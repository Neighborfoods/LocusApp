# Locus — Decentralized Shared-Equity Housing Platform

**Locus** is a monorepo for a mobile-first platform enabling shared-equity housing and community governance. It targets App Store (iOS) and production deployment on Oracle Cloud.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Oracle Cloud (129.146.186.180)                                  │
│  Firewall → Nginx :80 (rate limit, gzip, security headers)       │
│       → PM2 → Node.js :3000 (LocusBackend)                       │
│            → PostgreSQL :5432 (Docker, localhost only)           │
│                 → users + properties                             │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    HTTPS (production) / HTTP (TestFlight)
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Mobile app (React Native, bare — no Expo)                       │
│  iOS: Locus.xcworkspace | Android: (future)                      │
│  Bundle ID: com.locus.app                                        │
└─────────────────────────────────────────────────────────────────┘
```

- **Backend:** Node.js + Express, PM2, PostgreSQL 15 (Docker). Health: `/health`, DB: `/db-check`, register: `POST /api/users/register`.
- **Mobile:** Bare React Native (iOS first). TestFlight via Xcode Archive or Fastlane `beta` lane.
- **Infra:** Nginx reverse proxy, firewall scripts, PM2 startup, optional SSL (see `docs/`).

---

## Repository structure

| Path | Purpose |
|------|--------|
| **`mobile/`** | React Native app (iOS: `Locus.xcworkspace`, Fastlane in `ios/fastlane/`). |
| **`LocusBackend/`** | Node.js API, Docker Compose (PostgreSQL), PM2. Deploy to `~/LocusBackend` on server. |
| **`scripts/`** | Bootstrap and production scripts (firewall, PM2 HA, Nginx, verify). |
| **`nginx/`** | Nginx site config and rate-limit snippet for Node proxy. |
| **`docs/`** | Runbooks: `PRODUCTION_NODE_ORACLE.md`, `TESTFLIGHT_CHECKLIST.md`, `HEALTH_ENDPOINT_NODE.md`. |

---

## Quick start

### Backend (local)

```bash
cd LocusBackend
cp .env.example .env   # edit with real DB password
npm install
docker compose up -d postgres
npm start
```

### Mobile (iOS)

```bash
cd mobile
npm install
cd ios && pod install && cd ..
npx react-native run-ios --project-path ios
```

Open **`mobile/ios/Locus.xcworkspace`** in Xcode for signing and archiving.

### TestFlight

See **`docs/TESTFLIGHT_CHECKLIST.md`**. From `mobile/ios`: `fastlane beta` (after Fastlane install and Appfile/credentials).

---

## Security

- **Never commit:** `.env`, `GoogleService-Info.plist`, `google-services.json`, `*.keystore`, `*.p12`, `*.mobileprovision`. All are in root `.gitignore`.
- Backend uses parameterized queries only; PostgreSQL binds to `127.0.0.1:5432` on the server.

---

## License

Proprietary. All rights reserved.
