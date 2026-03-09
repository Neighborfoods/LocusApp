#!/bin/bash
set -e

echo "=== Step 1: Installing Nginx ==="
sudo apt-get update -y
sudo apt-get install -y nginx

echo "=== Step 2: Creating /etc/nginx/conf.d/locus-rate-limit.conf ==="
sudo tee /etc/nginx/conf.d/locus-rate-limit.conf > /dev/null << 'EOF'
# Locus API rate limit zone (10 req/s per client, burst 20)
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
EOF

echo "=== Step 3: Creating /etc/nginx/sites-available/locus ==="
sudo tee /etc/nginx/sites-available/locus > /dev/null << 'EOF'
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
        proxy_pass http://127.0.0.1:3000;
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
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
EOF

echo "=== Step 4: Enabling config ==="
sudo ln -sf /etc/nginx/sites-available/locus /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "=== Step 5: Firewall ==="
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || true

echo "=== Step 6: Verify ==="
echo -n "Nginx status: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost || echo "curl failed"
echo "App (127.0.0.1:3000) response:"
curl -s http://127.0.0.1:3000 2>/dev/null | head -c 100 || echo "(no response)"
echo ""
echo ""
echo "PM2 status:"
pm2 status 2>/dev/null || echo "(pm2 not running or no processes)"
echo ""
echo -n "nginx service: "
systemctl is-active nginx

echo ""
echo "✅ Nginx is live at http://129.146.186.180"
