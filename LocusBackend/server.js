require('dotenv').config();
const express = require('express');
const pool = require('./db/pool');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Root
app.get('/', (req, res) => {
  res.json({
    project: 'LocusApp',
    status: 'Online 🚀',
    version: '1.0.0',
    message: 'Hello from Oracle Cloud!',
  });
});

// Health (for Nginx / PM2)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});

// DB health check
app.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT NOW() as time, version() as version'
    );
    res.json({
      status: 'connected',
      time: result.rows[0].time,
      version: result.rows[0].version,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});

// User registration (for App Store testers) — parameterized only
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
    res.status(201).json({
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`LocusBackend listening on http://127.0.0.1:${PORT}`);
});
