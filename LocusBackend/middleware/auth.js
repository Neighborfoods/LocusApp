const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'locus-secret-key';

/**
 * Require Authorization: Bearer <access_token>. Sets req.user = { id, email }.
 */
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

module.exports = { authMiddleware };
