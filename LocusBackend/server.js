require('dotenv').config();
const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db/pool');
const { authMiddleware } = require('./middleware/auth');

const app = express();
app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json());

// Upload directory for avatars
const uploadDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://129.146.186.180';
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// In-memory cache for list endpoints (60s TTL)
const cache = new Map();
const CACHE_TTL = 60 * 1000;
function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'locus-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30;

// ── Helpers ─────────────────────────────────────────────────────────────────
function userRowToProfile(row) {
  if (!row) return null;
  const name = row.name || '';
  const [first_name = '', ...rest] = name.trim().split(/\s+/);
  const last_name = rest.join(' ') || '';
  return {
    id: row.id,
    email: row.email,
    first_name: first_name || 'User',
    last_name,
    name: row.name,
    phone: row.phone ?? null,
    bio: row.bio ?? null,
    avatar_url: row.avatar_url ?? null,
    role: 'member',
    housing_reason: 'exploring',
    is_active: true,
    hobbies: [],
    kyc_status: 'pending',
    verification_score: 0,
    created_at: row.created_at,
  };
}

function createRefreshToken() {
  return require('crypto').randomBytes(64).toString('hex');
}

async function createTokens(userId, email) {
  const access_token = jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  const refresh = createRefreshToken();
  const expires_at = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, refresh, expires_at]
  );
  return { access_token, refresh_token: refresh };
}

// ── Public routes ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ project: 'LocusApp', status: 'Online 🚀', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});

app.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, version() as version');
    res.json({ status: 'connected', time: result.rows[0].time, version: result.rows[0].version });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Legacy: no-password registration (keep for backward compat)
app.post('/api/users/register', async (req, res) => {
  const { email, name } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'email required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING RETURNING *',
      [email.trim(), name != null ? String(name).trim() : null]
    );
    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, message: 'email already exists', user: null });
    }
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Auth routes ──────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { email, name, password } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: 'email required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ success: false, error: 'password required, min 8 characters' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING *',
      [email.trim(), (name != null ? String(name).trim() : null) || null, password_hash]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }
    const user = result.rows[0];
    const { access_token, refresh_token } = await createTokens(user.id, user.email);
    const profile = userRowToProfile(user);
    res.status(201).json({
      success: true,
      data: { user: profile, access_token, refresh_token },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'email and password required' });
  }
  try {
    const r = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim()]);
    if (r.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const user = r.rows[0];
    const hash = user.password_hash;
    if (!hash) {
      return res.status(401).json({ success: false, error: 'Use registration instead. This account has no password set.' });
    }
    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid email or password' });
    const { access_token, refresh_token } = await createTokens(user.id, user.email);
    res.json({
      success: true,
      data: { user: userRowToProfile(user), access_token, refresh_token },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (r.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: userRowToProfile(r.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/auth/refresh', async (req, res) => {
  const { refresh_token: token } = req.body || {};
  if (!token) return res.status(400).json({ success: false, error: 'refresh_token required' });
  try {
    const r = await pool.query(
      'SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (r.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }
    const userRow = await pool.query('SELECT * FROM users WHERE id = $1', [r.rows[0].user_id]);
    if (userRow.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    const user = userRow.rows[0];
    const access_token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    const newRefresh = createRefreshToken();
    const expires_at = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, newRefresh, expires_at]
    );
    res.json({
      success: true,
      data: { access_token, refresh_token: newRefresh },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/auth/logout', async (req, res) => {
  const { refresh_token: token } = req.body || {};
  if (token) {
    try {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    } catch (_) {}
  }
  res.json({ success: true });
});

app.post('/auth/forgot-password', (req, res) => {
  res.json({ success: true, message: 'If email exists, reset link sent' });
});

app.post('/auth/reset-password', (req, res) => {
  res.json({ success: true });
});

app.post('/auth/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, error: 'current_password and new_password required' });
  }
  if (typeof new_password !== 'string' || new_password.length < 8) {
    return res.status(400).json({ success: false, error: 'new_password must be at least 8 characters' });
  }
  try {
    const r = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (r.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    const hash = r.rows[0].password_hash;
    if (!hash) {
      return res.status(400).json({ success: false, error: 'Account has no password set' });
    }
    const ok = await bcrypt.compare(current_password, hash);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1', [req.user.id, newHash]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Communities ─────────────────────────────────────────────────────────────
app.get('/communities', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 50;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const cacheKey = `communities:${lat}:${lng}:${radius}:${page}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  try {
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM communities
         WHERE location IS NOT NULL AND location->>'lat' IS NOT NULL AND location->>'lng' IS NOT NULL
         AND ( ((location->>'lat')::float8 - $1::float8) * ((location->>'lat')::float8 - $1::float8) +
               ((location->>'lng')::float8 - $2::float8) * ((location->>'lng')::float8 - $2::float8) ) <= ($3::float8) * ($3::float8)`,
        [lat, lng, radius]
      );
      const total = countResult.rows[0].total;
      const r = await pool.query(
        `SELECT * FROM communities
         WHERE location IS NOT NULL AND location->>'lat' IS NOT NULL AND location->>'lng' IS NOT NULL
         AND ( ((location->>'lat')::float8 - $1::float8) * ((location->>'lat')::float8 - $1::float8) +
               ((location->>'lng')::float8 - $2::float8) * ((location->>'lng')::float8 - $2::float8) ) <= ($3::float8) * ($3::float8)
         ORDER BY created_at DESC LIMIT $4 OFFSET $5`,
        [lat, lng, radius, limit, offset]
      );
      const payload = { success: true, data: r.rows, total, page, limit };
      setCache(cacheKey, payload);
      return res.json(payload);
    }
    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM communities');
    const total = countResult.rows[0].total;
    const r = await pool.query(
      'SELECT * FROM communities ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const payload = { success: true, data: r.rows, total, page, limit };
    setCache(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/communities/nearby', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 50;
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ success: false, error: 'lat and lng required' });
  }
  try {
    const r = await pool.query(
      `SELECT * FROM communities
       WHERE location IS NOT NULL
       AND location->>'lat' IS NOT NULL
       AND location->>'lng' IS NOT NULL
       AND ( ((location->>'lat')::float8 - $1::float8) * ((location->>'lat')::float8 - $1::float8) +
             ((location->>'lng')::float8 - $2::float8) * ((location->>'lng')::float8 - $2::float8) ) <= ($3::float8) * ($3::float8)
       ORDER BY created_at DESC
       LIMIT 50`,
      [lat, lng, radius]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/communities/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM communities WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/communities', authMiddleware, async (req, res) => {
  const { name, description, location } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: 'name required' });
  }
  try {
    const r = await pool.query(
      'INSERT INTO communities (name, description, location, owner_id, member_count) VALUES ($1, $2, $3, $4, 1) RETURNING *',
      [name.trim(), description || null, location ? JSON.stringify(location) : null, req.user.id]
    );
    const community = r.rows[0];
    await pool.query(
      'INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)',
      [community.id, req.user.id, 'owner']
    );
    res.status(201).json({ success: true, data: community });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/communities/:id/apply', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const inserted = await pool.query(
      'INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (community_id, user_id) DO NOTHING RETURNING id',
      [id, req.user.id, 'member']
    );
    if (inserted.rows.length > 0) {
      await pool.query('UPDATE communities SET member_count = member_count + 1 WHERE id = $1', [id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/communities/:id/members', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT cm.*, u.email, u.name FROM community_members cm JOIN users u ON u.id = cm.user_id WHERE cm.community_id = $1',
      [req.params.id]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Notifications ────────────────────────────────────────────────────────────
app.get('/notifications', authMiddleware, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  try {
    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1', [req.user.id]);
    const total = countResult.rows[0].total;
    const r = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ success: true, data: r.rows, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (r.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = true WHERE user_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = false',
      [req.user.id]
    );
    res.json({ success: true, data: { count: r.rows[0].count } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Voting ───────────────────────────────────────────────────────────────────
app.get('/communities/:id/votes', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM votes WHERE community_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/communities/:id/votes', authMiddleware, async (req, res) => {
  const { title, description, closes_at } = req.body || {};
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, error: 'title required' });
  }
  try {
    const r = await pool.query(
      'INSERT INTO votes (community_id, title, description, created_by, closes_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.id, title.trim(), description || null, req.user.id, closes_at || null]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/communities/:id/votes/:voteId/cast', authMiddleware, async (req, res) => {
  const { voteId } = req.params;
  const { choice } = req.body || {};
  try {
    await pool.query(
      'INSERT INTO vote_casts (vote_id, user_id, choice) VALUES ($1, $2, $3) ON CONFLICT (vote_id, user_id) DO UPDATE SET choice = $3',
      [voteId, req.user.id, choice != null ? String(choice) : null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/communities/:id/votes/:voteId/results', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT choice, COUNT(*)::int AS count FROM vote_casts WHERE vote_id = $1 GROUP BY choice',
      [req.params.voteId]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Properties ───────────────────────────────────────────────────────────────
app.get('/properties', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 50;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const offset = (page - 1) * limit;
  try {
    let data = [];
    let total = 0;
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM properties
         WHERE location IS NOT NULL AND location->>'lat' IS NOT NULL AND location->>'lng' IS NOT NULL
         AND ( ((location->>'lat')::float8 - $1::float8) * ((location->>'lat')::float8 - $1::float8) +
               ((location->>'lng')::float8 - $2::float8) * ((location->>'lng')::float8 - $2::float8) ) <= ($3::float8) * ($3::float8)`,
        [lat, lng, radius]
      );
      total = countResult.rows[0].total;
      const r = await pool.query(
        `SELECT * FROM properties
         WHERE location IS NOT NULL AND location->>'lat' IS NOT NULL AND location->>'lng' IS NOT NULL
         AND ( ((location->>'lat')::float8 - $1::float8) * ((location->>'lat')::float8 - $1::float8) +
               ((location->>'lng')::float8 - $2::float8) * ((location->>'lng')::float8 - $2::float8) ) <= ($3::float8) * ($3::float8)
         ORDER BY created_at DESC LIMIT $4 OFFSET $5`,
        [lat, lng, radius, limit, offset]
      );
      data = r.rows;
    } else {
      const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM properties');
      total = countResult.rows[0].total;
      const r = await pool.query('SELECT * FROM properties ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      data = r.rows;
    }
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/properties/map', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 50;
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.json({ success: true, data: [] });
  }
  try {
    const r = await pool.query(
      `SELECT id, title, price, location, status FROM properties
       WHERE location IS NOT NULL AND location->>'lat' IS NOT NULL AND location->>'lng' IS NOT NULL
       AND ( ((location->>'lat')::float8 - $1::float8) * ((location->>'lat')::float8 - $1::float8) +
             ((location->>'lng')::float8 - $2::float8) * ((location->>'lng')::float8 - $2::float8) ) <= ($3::float8) * ($3::float8)
       ORDER BY created_at DESC LIMIT 100`,
      [lat, lng, radius]
    );
    const data = r.rows.map((row) => {
      const loc = row.location || {};
      const lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat);
      const lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng);
      return {
        id: row.id,
        latitude: Number.isFinite(lat) ? lat : 0,
        longitude: Number.isFinite(lng) ? lng : 0,
        rent_cents_per_month: Math.round(Number(row.price || 0) * 100),
        is_available: row.status === 'active',
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/properties/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/properties', authMiddleware, async (req, res) => {
  const { title, type, address, price, description, location, photos } = req.body || {};
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, error: 'title required' });
  }
  try {
    const r = await pool.query(
      `INSERT INTO properties (owner_id, title, type, address, price, description, location, photos, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') RETURNING *`,
      [
        req.user.id,
        title.trim(),
        type || null,
        address || null,
        price != null ? Number(price) : null,
        description || null,
        location ? JSON.stringify(location) : null,
        photos ? JSON.stringify(Array.isArray(photos) ? photos : []) : '[]',
      ]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Users profile / rentals / transactions ────────────────────────────────────
app.get('/users/me', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, email, name, phone, bio, avatar_url, created_at FROM users WHERE id = $1', [req.user.id]);
    if (r.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const row = r.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        email: row.email,
        name: row.name ?? null,
        phone: row.phone ?? null,
        bio: row.bio ?? null,
        avatar_url: row.avatar_url ?? null,
        created_at: row.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/users/profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  const body = req.body || {};
  const updates = [];
  const params = [req.user.id];
  let i = 2;

  let avatar_url = body.avatar_url != null ? String(body.avatar_url).trim() : null;
  if (req.file) {
    avatar_url = `${PUBLIC_BASE_URL}/uploads/avatars/${req.file.filename}`;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    updates.push(`name = $${i}`);
    params.push(body.name != null ? String(body.name).trim() : null);
    i++;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
    updates.push(`phone = $${i}`);
    params.push(body.phone != null ? String(body.phone).trim() : null);
    i++;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'bio')) {
    updates.push(`bio = $${i}`);
    params.push(body.bio != null ? String(body.bio).trim() : null);
    i++;
  }
  if (avatar_url !== undefined || req.file) {
    updates.push(`avatar_url = $${i}`);
    params.push(avatar_url);
    i++;
  }
  if (updates.length === 0) {
    const r = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: userRowToProfile(r.rows[0]) });
  }
  try {
    updates.push('updated_at = NOW()');
    const r = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );
    if (r.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: userRowToProfile(r.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/users/rentals', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.* FROM properties p
       INNER JOIN community_members cm ON cm.community_id = (SELECT id FROM communities LIMIT 1)
       WHERE cm.user_id = $1
       LIMIT 100`,
      [req.user.id]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/users/transactions', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Support ───────────────────────────────────────────────────────────────────
app.post('/support/issues', authMiddleware, async (req, res) => {
  const { title, description, type } = req.body || {};
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, error: 'title required' });
  }
  try {
    const r = await pool.query(
      'INSERT INTO support_issues (user_id, title, description, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title.trim(), description || null, type || null]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Listen ───────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`LocusBackend listening on http://127.0.0.1:${PORT}`);
});
