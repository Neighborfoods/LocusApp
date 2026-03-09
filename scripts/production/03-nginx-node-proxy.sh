#!/usr/bin/env bash
# Install Nginx and configure reverse proxy 80 → localhost:3000 (Locus Node backend).
# Run on server: sudo bash scripts/production/03-nginx-node-proxy.sh
# REPO_ROOT: path to repo on server (e.g. /opt/locus). Default: script's repo root.

set -e
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
SITE_NAME="locus-node"
CONFIG_SRC="$REPO_ROOT/nginx/sites-available/$SITE_NAME"

echo "[nginx] Installing nginx..."
sudo apt-get update -qq
sudo apt-get install -y nginx

if [[ ! -f "$CONFIG_SRC" ]]; then
  echo "[nginx] ERROR: $CONFIG_SRC not found. Set REPO_ROOT or run from repo."
  exit 1
fi

# Rate-limit zone (must be in http block; Ubuntu includes /etc/nginx/conf.d/*.conf)
RATE_LIMIT_SRC="$REPO_ROOT/nginx/conf.d/locus-rate-limit.conf"
if [[ -f "$RATE_LIMIT_SRC" ]]; then
  echo "[nginx] Deploying rate-limit zone..."
  sudo cp "$RATE_LIMIT_SRC" /etc/nginx/conf.d/
fi

echo "[nginx] Deploying $SITE_NAME site..."
sudo ln -sf "$CONFIG_SRC" "/etc/nginx/sites-enabled/$SITE_NAME"
sudo rm -f /etc/nginx/sites-enabled/default

echo "[nginx] Testing config..."
sudo nginx -t

echo "[nginx] Reloading and enabling nginx..."
sudo systemctl reload nginx
sudo systemctl enable nginx

echo "[nginx] Done. Port 80 → localhost:3000. Test: curl -I http://localhost"
