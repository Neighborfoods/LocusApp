# Locus Production Deployment (Always Free Tier)

Single Ubuntu instance: API, PostgreSQL, Nginx Proxy Manager (SSL + domain routing).

## 1. Server setup

- Ubuntu 22.04 (e.g. Oracle Cloud Always Free or similar).
- Install Docker and Docker Compose.
- SSH key access.

## 2. Environment

```bash
cp .env.production.example .env.production
# Edit .env.production: DB_PASSWORD, JWT_SECRET, STRIPE_KEY (optional).
```

## 3. Deploy

```bash
./scripts/deploy.sh user@your-server
# Or set REMOTE_DIR: REMOTE_DIR=/opt/locus ./scripts/deploy.sh user@host
```

First run: ensure the server has the repo (e.g. clone once, then deploy pushes updates via rsync, or use git pull on server).

## 4. After deploy

- Nginx Proxy Manager UI: `https://YOUR_SERVER_IP:81` (default login: admin@example.com / changeme).
- Add a proxy host: forward `api.yourdomain.com` to `http://locus_api:8080`.
- Request SSL certificate in NPM for `api.yourdomain.com`.

## 5. Mobile production build

- In `mobile/src/utils/apiBaseUrl.ts`, set `PRODUCTION_API_BASE_URL` to `https://api.yourdomain.com` (or use `EXPO_PUBLIC_API_URL` at build time).
- **ATS (HTTPS only)**: For App Store / release builds, in `ios/LocusTemp/Info.plist` set `NSAllowsArbitraryLoads` to `false` so the app allows only HTTPS. (Debug keeps it `true` for local HTTP.)

## 6. Compose file

- `docker-compose.prod.yml`: `locus_api`, `locus_db`, `locus_proxy` (NPM). All use `restart: always`.
