#!/usr/bin/env bash
# Deploy Locus production stack on a single Ubuntu instance via SSH.
# Usage: ./scripts/deploy.sh [user@host]
# Example: SSH_KEY_PATH=~/.ssh/oracle.key ./scripts/deploy.sh ubuntu@my-server.example.com
# Oracle Always Free requires key-based auth (no passwords). Set SSH_KEY_PATH to your .key file.

set -e
HOST="${1:?Usage: $0 user@host}"

# SSH identity file (required for Oracle Cloud; use your downloaded .key path).
SSH_KEY_PATH="${SSH_KEY_PATH:-$SSH_IDENTITY}"
REMOTE_DIR="${REMOTE_DIR:-/opt/locus}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Build ssh/rsync options when a key is provided.
SSH_OPTS=()
RSYNC_SSH_OPTS=()
if [[ -n "$SSH_KEY_PATH" ]]; then
  SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"
  if [[ -f "$SSH_KEY_PATH" ]]; then
    SSH_OPTS=(-i "$SSH_KEY_PATH")
    RSYNC_SSH_OPTS=(-e "ssh -i $SSH_KEY_PATH")
  fi
fi

echo "[deploy] Connecting to $HOST..."
ssh "${SSH_OPTS[@]}" "$HOST" "mkdir -p $REMOTE_DIR"

echo "[deploy] Syncing code to server..."
if command -v rsync >/dev/null 2>&1; then
  rsync -avz "${RSYNC_SSH_OPTS[@]}" --exclude '.git' --exclude 'node_modules' --exclude 'mobile/node_modules' \
    --exclude 'mobile/ios/Pods' --exclude '*.log' \
    ./ "$HOST:$REMOTE_DIR/"
else
  echo "[deploy] rsync not found; run 'git pull' on server and re-run deploy, or install rsync."
  ssh "${SSH_OPTS[@]}" "$HOST" "cd $REMOTE_DIR && git pull || true"
fi

echo "[deploy] Ensuring $ENV_FILE exists on server..."
ssh "${SSH_OPTS[@]}" "$HOST" "cd $REMOTE_DIR && if [ ! -f $ENV_FILE ]; then cp .env.production.example $ENV_FILE 2>/dev/null || true; echo 'Edit $ENV_FILE on server with DB_PASSWORD, JWT_SECRET, etc.'; fi"

echo "[deploy] Running docker compose..."
ssh "${SSH_OPTS[@]}" "$HOST" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build"

echo "[deploy] Done. API behind Nginx Proxy Manager (ports 80, 443, 81 for admin)."
echo "[deploy] Configure SSL and domain routing at https://\$SERVER_IP:81"
