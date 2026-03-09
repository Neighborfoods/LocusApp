#!/bin/bash
set -e
echo "=== Step 1: Starting PostgreSQL ==="
docker compose up -d postgres

echo "=== Step 2: Waiting for healthy state ==="
sleep 5
docker compose ps

echo "=== Step 3: Restart Node.js ==="
pm2 restart locus-backend 2>/dev/null || echo "(pm2 locus-backend not found; start with: pm2 start server.js --name locus-backend)"

echo "=== Step 4: Verify ==="
curl -s http://localhost/db-check | python3 -m json.tool

echo "✅ Database is live"
