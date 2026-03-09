#!/usr/bin/env bash
# Bootstrap: create ~/LocusBackend/scripts/production and ~/LocusBackend/nginx on the SERVER.
# Run from your Mac (one shot):
#   ssh -i ~/.ssh/locus-vcn.key ubuntu@129.146.186.180 'bash -s' < scripts/bootstrap-locus-backend-on-server.sh
# Or copy this script to the server and run: bash bootstrap-locus-backend-on-server.sh

set -e
BASE="${1:-$HOME/LocusBackend}"
mkdir -p "$BASE/scripts/production"
mkdir -p "$BASE/nginx/sites-available"
mkdir -p "$BASE/nginx/conf.d"

echo "[bootstrap] Creating $BASE/scripts/production/01-firewall.sh"
cat > "$BASE/scripts/production/01-firewall.sh" << 'ENDFW'
#!/usr/bin/env bash
# Persistent firewall for Locus backend (Oracle Cloud Ubuntu 22.04).
# Run on server: sudo bash scripts/production/01-firewall.sh
set -e
echo "[firewall] Opening ports 80, 443, 3000..."
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
echo "[firewall] Saving rules (netfilter-persistent)..."
sudo netfilter-persistent save 2>/dev/null || true
echo "[firewall] Done."
ENDFW

echo "[bootstrap] Creating $BASE/scripts/production/02-pm2-ha.sh"
cat > "$BASE/scripts/production/02-pm2-ha.sh" << 'ENDPM2'
#!/usr/bin/env bash
# PM2 high availability: survive reboot. Run: bash scripts/production/02-pm2-ha.sh
set -e
echo "[pm2] Generating systemd startup and linking PM2 with systemd..."
STARTUP_OUT=$(pm2 startup systemd -u "$USER" --hp "$HOME" 2>&1)
STARTUP_CMD=$(echo "$STARTUP_OUT" | grep 'sudo env.*pm2 startup systemd' | head -1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
if [[ -z "$STARTUP_CMD" ]]; then
  echo "[pm2] Could not parse startup command. Run the sudo env ... line above, then: pm2 save"
  echo "$STARTUP_OUT"
  exit 1
fi
echo "[pm2] Executing: $STARTUP_CMD"
bash -c "$STARTUP_CMD"
echo "[pm2] Freezing process list (pm2 save)..."
pm2 save
echo "[pm2] Status:"
pm2 status
PM2_SVC="pm2-$USER"
echo "[pm2] Verifying systemd service $PM2_SVC..."
systemctl is-enabled "$PM2_SVC" &>/dev/null && echo "[pm2] $PM2_SVC is enabled." || echo "[pm2] WARN: sudo systemctl enable $PM2_SVC"
systemctl status "$PM2_SVC" --no-pager 2>/dev/null || true
echo "[pm2] Done. LocusBackend will auto-restart after reboot."
ENDPM2

echo "[bootstrap] Creating $BASE/scripts/production/03-nginx-node-proxy.sh"
cat > "$BASE/scripts/production/03-nginx-node-proxy.sh" << 'ENDNGX'
#!/usr/bin/env bash
# Install Nginx and proxy 80 → 3000. Run: sudo bash scripts/production/03-nginx-node-proxy.sh
set -e
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
SITE_NAME="locus-node"
CONFIG_SRC="$REPO_ROOT/nginx/sites-available/$SITE_NAME"
echo "[nginx] Installing nginx..."
sudo apt-get update -qq && sudo apt-get install -y nginx
[[ -f "$CONFIG_SRC" ]] || { echo "ERROR: $CONFIG_SRC not found"; exit 1; }
[[ -f "$REPO_ROOT/nginx/conf.d/locus-rate-limit.conf" ]] && sudo cp "$REPO_ROOT/nginx/conf.d/locus-rate-limit.conf" /etc/nginx/conf.d/
sudo ln -sf "$CONFIG_SRC" "/etc/nginx/sites-enabled/$SITE_NAME"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx && sudo systemctl enable nginx
echo "[nginx] Done."
ENDNGX

echo "[bootstrap] Creating $BASE/scripts/production/04-verify.sh"
cat > "$BASE/scripts/production/04-verify.sh" << 'ENDVER'
#!/usr/bin/env bash
set -e
SERVER_IP="${SERVER_IP:-129.146.186.180}"
FAIL=0
run() { if "$@"; then echo "[OK] $*"; else echo "[FAIL] $*"; FAIL=1; fi; }
echo "=== Local ==="
run curl -sf -o /dev/null http://localhost || true
run curl -sf http://localhost/health | grep -q healthy || true
echo "=== PM2 ==="
pm2 status
echo "=== Nginx ==="
run sudo nginx -t
run sudo systemctl is-active -q nginx && echo "[OK] nginx active" || true
[[ -n "${VERIFY_EXTERNAL}" ]] && run curl -sf "http://${SERVER_IP}/health" | grep -q healthy || true
[[ $FAIL -eq 0 ]] && echo "All passed." || exit 1
ENDVER

echo "[bootstrap] Creating $BASE/nginx/sites-available/locus-node"
cat > "$BASE/nginx/sites-available/locus-node" << 'ENDLOCUS'
# Locus backend — Nginx reverse proxy 80 → 3000
# Zone: nginx/conf.d/locus-rate-limit.conf in http (e.g. /etc/nginx/conf.d/)

server {
    listen 80;
    server_name _;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    gzip on;
    gzip_types application/json text/plain;

    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
ENDLOCUS

echo "[bootstrap] Creating $BASE/nginx/conf.d/locus-rate-limit.conf"
cat > "$BASE/nginx/conf.d/locus-rate-limit.conf" << 'ENDRATE'
# Rate limit zone — include in http (e.g. /etc/nginx/conf.d/)
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
ENDRATE

chmod +x "$BASE/scripts/production/"*.sh
echo "[bootstrap] Done. Contents of ~/LocusBackend:"
ls -la "$BASE"
ls -la "$BASE/scripts/production"
ls -la "$BASE/nginx/sites-available"
ls -la "$BASE/nginx/conf.d"
