# Locus Backend — Production Readiness (Node.js + Oracle Cloud)

**Target:** Oracle Cloud Ubuntu 22.04, Node.js/Express on port 3000 (PM2), Nginx reverse proxy, HTTPS-ready for App Store & Google Play.

**Server:** 129.146.186.180 (update in scripts if different)

---

## 0. Создать файлы на сервере в ~/LocusBackend (если папки ещё нет)

**Вариант A — с вашего Mac одной командой (скрипт создаст все файлы на сервере):**

```bash
cd ~/LocusApp
ssh -i ~/.ssh/locus-vcn.key ubuntu@129.146.186.180 'bash -s' < scripts/bootstrap-locus-backend-on-server.sh
```

**Вариант B — скопировать папки с Mac на сервер:**

```bash
scp -i ~/.ssh/locus-vcn.key -r ~/LocusApp/scripts ubuntu@129.146.186.180:~/LocusBackend/
scp -i ~/.ssh/locus-vcn.key -r ~/LocusApp/nginx ubuntu@129.146.186.180:~/LocusBackend/
```

После этого на сервере в `~/LocusBackend` будут `scripts/production/` и `nginx/`.

---

## 1. Persistent firewall

On the server (allow 80, 443, 3000 and persist rules):

```bash
sudo bash scripts/production/01-firewall.sh
```

Or manually:

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

---

## 2. PM2 high availability (auto-restart on reboot)

After your app is running under PM2 (e.g. `pm2 start server.js --name locus-backend`):

```bash
cd ~/LocusBackend
bash scripts/production/02-pm2-ha.sh
```

The script will:
1. **Run `pm2 startup`** and **execute the generated `sudo env ...` command** to link PM2 with systemd.
2. **Run `pm2 save`** to freeze the current process list (reloaded on boot).
3. **Show `pm2 status`** and **verify the `pm2-ubuntu` service** with `systemctl status pm2-ubuntu` (or `pm2-$USER`).

If the script cannot parse the startup command, it will print PM2’s output so you can run the `sudo env ...` line manually, then run `pm2 save`.

---

## 3. Nginx reverse proxy (80 → localhost:3000)

Config is in `nginx/sites-available/locus-node`. On the server:

```bash
# From repo root on server
sudo bash scripts/production/03-nginx-node-proxy.sh
```

Or manually (include rate-limit zone in http block):

```bash
sudo apt-get install -y nginx
sudo cp /path/to/repo/nginx/conf.d/locus-rate-limit.conf /etc/nginx/conf.d/
sudo ln -sf /path/to/repo/nginx/sites-available/locus-node /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl enable nginx
```

After any config edit: `sudo nginx -t && sudo systemctl reload nginx`

---

## 4. Health endpoint in server.js

Add the `/health` route to your Node app. See **docs/HEALTH_ENDPOINT_NODE.md** for the snippet.

Then:

```bash
pm2 restart locus-backend
```

---

## 5. Oracle Cloud — open ports 80 & 443

In **Oracle Cloud Console**:

1. **Networking** → **Virtual Cloud Networks** → select your VCN (e.g. locus-vcn).
2. **Security Lists** → select the list used by your instance’s subnet.
3. **Add Ingress Rules:**
   - TCP, destination port **80**, source **0.0.0.0/0**.
   - TCP, destination port **443**, source **0.0.0.0/0**.

(SSH port 22 should already be open.)

---

## 6. Verification checklist

On the server:

```bash
bash scripts/production/04-verify.sh
```

Manual checks:

```bash
# Local
curl -I http://localhost
curl http://localhost/health

# PM2
pm2 status
pm2 logs locus-backend --lines 20

# Nginx
sudo systemctl status nginx
sudo nginx -t
```

From your Mac (after Oracle ports 80/443 are open):

```bash
curl http://129.146.186.180/health
```

---

## 7. SSL (HTTPS) — after domain is attached

Required for App Store. Once your domain points to 129.146.186.180:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

Certbot will configure Nginx for HTTPS and auto-renewal.

---

## Success criteria

- [ ] `curl http://129.146.186.180` returns your app response (or redirect).
- [ ] `curl http://129.146.186.180/health` returns `{"status":"healthy",...}`.
- [ ] PM2 shows `locus-backend` as **online**.
- [ ] Nginx is **active** and proxying to localhost:3000.
- [ ] After reboot, PM2 and Nginx start automatically (zero-downtime ready).
