-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ── Full text search config ───────────────────────────────────────────────────
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS locus_search (COPY = english);

-- ── Geometry index helper ─────────────────────────────────────────────────────
-- Allows PostGIS-based nearby queries using ST_DWithin
-- Example: WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
