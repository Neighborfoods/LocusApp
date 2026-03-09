#!/usr/bin/env bash
# Check that API port 9000 is clear before starting backend/Docker.
# Usage: ./scripts/check-ports.sh   or   npm run check:ports

set -e
PORT=${1:-9000}
echo "[check-ports] Checking port $PORT..."
if command -v lsof >/dev/null 2>&1; then
  if lsof -i ":$PORT" >/dev/null 2>&1; then
    echo "[check-ports] WARNING: Port $PORT is in use:"
    lsof -i ":$PORT"
    echo "[check-ports] Free the port or choose another (e.g. ./scripts/check-ports.sh 9001)"
    exit 1
  fi
  echo "[check-ports] Port $PORT is clear."
else
  echo "[check-ports] lsof not found; skipping check."
fi
