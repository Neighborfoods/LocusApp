#!/usr/bin/env bash
# PM2 high availability: survive reboot, auto-start locus-backend.
# Run on server (after PM2 is running your app): bash scripts/production/02-pm2-ha.sh
# Ensures: systemd link, saved process list, and pm2-<user> service enabled.

set -e
echo "[pm2] Generating systemd startup and linking PM2 with systemd..."
STARTUP_OUT=$(pm2 startup systemd -u "$USER" --hp "$HOME" 2>&1)
STARTUP_CMD=$(echo "$STARTUP_OUT" | grep 'sudo env.*pm2 startup systemd' | head -1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
if [[ -z "$STARTUP_CMD" ]]; then
  echo "[pm2] Could not parse startup command. PM2 output:"
  echo "$STARTUP_OUT"
  echo "[pm2] Run the 'sudo env ...' line above manually, then: pm2 save && bash $0"
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
if systemctl is-enabled "$PM2_SVC" &>/dev/null; then
  echo "[pm2] $PM2_SVC is enabled — will start on boot."
  systemctl status "$PM2_SVC" --no-pager || true
else
  echo "[pm2] WARN: $PM2_SVC not enabled. Run: sudo systemctl enable $PM2_SVC"
  systemctl status "$PM2_SVC" --no-pager 2>/dev/null || true
fi

echo "[pm2] Done. LocusBackend will auto-restart after reboot."
