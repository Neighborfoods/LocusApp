# LocusBackend (Node + PostgreSQL)

Production backend for Locus (Oracle Cloud, PM2, Nginx).

## First-time server setup

1. **Install Docker** (once per server):
   ```bash
   chmod +x install-docker.sh && ./install-docker.sh
   # Log out and back in (or run: newgrp docker)
   ```

2. **Configure env** (use a strong password):
   ```bash
   cp .env.example .env
   # Edit .env: set POSTGRES_PASSWORD and DATABASE_URL password
   ```

3. **Install deps and start DB**:
   ```bash
   npm install
   ./deploy-db.sh
   ```

4. **PM2** (if not already):
   ```bash
   pm2 start server.js --name locus-backend
   pm2 save && pm2 startup
   ```

## Verification checklist

- [ ] `docker compose ps` → `locus-postgres` healthy
- [ ] `curl http://129.146.186.180/db-check` → `"status":"connected"`
- [ ] `curl -X POST http://129.146.186.180/api/users/register -H "Content-Type: application/json" -d '{"email":"test@example.com","name":"Test"}'`
- [ ] `pm2 status` → `locus-backend` online
- [ ] `.env` is in `.gitignore` and never committed

## Security

- PostgreSQL binds only to `127.0.0.1:5432` (not public).
- All SQL uses parameterized queries (no string concatenation).
