# Section 2B — Backend performance (run on server)

Run these on the server after SSH.

## 1. Database indexes (critical for distance queries)

```bash
ssh -i ~/.ssh/locus-vcn.key ubuntu@129.146.186.180
```

Then:

```bash
sudo docker exec -it locus-postgres psql -U postgres -d locus -c "
  CREATE INDEX IF NOT EXISTS idx_communities_location_lat
  ON communities (((location->>'lat')::float8), ((location->>'lng')::float8));

  CREATE INDEX IF NOT EXISTS idx_properties_location_lat
  ON properties (((location->>'lat')::float8), ((location->>'lng')::float8));

  CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read);
  CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members (user_id, community_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
  ANALYZE;
"
```

## 2. Compression and cache (already in repo)

- `LocusBackend/server.js`: compression middleware and 60s in-memory cache for GET /communities are already added.
- Run `npm install` in LocusBackend to install `compression`.

## 3. Pool config

- `LocusBackend/db/pool.js` already has: `max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 2000`.

## 4. Deploy and restart

From your Mac (replace path if needed):

```bash
scp -i ~/.ssh/locus-vcn.key -r ~/Desktop/LocusApp/LocusBackend/* ubuntu@129.146.186.180:~/LocusBackend/
ssh -i ~/.ssh/locus-vcn.key ubuntu@129.146.186.180 "cd ~/LocusBackend && npm install && pm2 restart locus-backend --update-env"
```

## 5. Verify

- Indexes:  
  `sudo docker exec locus-postgres psql -U postgres -d locus -c '\d communities'`  
  `sudo docker exec locus-postgres psql -U postgres -d locus -c 'EXPLAIN ANALYZE SELECT * FROM communities LIMIT 1;'`
- API timing:  
  `curl -w "\nTime: %{time_total}s\n" "http://129.146.186.180/communities?lat=37.785834&lng=-122.406417&radius=50"`  
  (should be under ~0.5s after cache warm or with indexes.)
