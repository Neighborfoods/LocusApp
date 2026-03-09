#!/usr/bin/env bash
# Production verification checklist (Node + Nginx + PM2).
# Run on server: bash scripts/production/04-verify.sh
# Optional: VERIFY_EXTERNAL=1 to curl public IP (set SERVER_IP or pass as env).

set -e
SERVER_IP="${SERVER_IP:-129.146.186.180}"
FAIL=0

run() {
  if "$@"; then echo "[OK] $*"; else echo "[FAIL] $*"; FAIL=1; fi
}

echo "=== Local checks ==="
run curl -sf -o /dev/null -w "%{http_code}" http://localhost | grep -q 200 || run curl -sI http://localhost | head -1
run curl -sf http://localhost/health | grep -q healthy || run curl -s http://localhost/health | head -1

echo ""
echo "=== PM2 ==="
run pm2 status | grep -q "online" || true
pm2 status
echo "--- Last 5 lines of logs ---"
pm2 logs locus-backend --lines 5 --nostream 2>/dev/null || true

echo ""
echo "=== Nginx ==="
run sudo nginx -t
run sudo systemctl is-active -q nginx && echo "[OK] nginx active" || echo "[FAIL] nginx not active"

if [[ -n "${VERIFY_EXTERNAL}" ]]; then
  echo ""
  echo "=== External (from this host) ==="
  run curl -sf -o /dev/null -w "%{http_code}" "http://${SERVER_IP}/health" | grep -q 200 || curl -s "http://${SERVER_IP}/health" || true
fi

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "All checks passed."
else
  echo "Some checks failed."
  exit 1
fi
