const db = require('../config/db');

/**
 * Middleware to authenticate user based on 'X-User-ID' header.
 * In a real app, this would use JWT and verify tokens.
 */
async function authenticate(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const result = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND u.is_active = TRUE',
      [userId]
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
      req.user.ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      req.user.user_agent = req.headers['user-agent'];
      return next();
    }
  } catch (err) {
    console.error('Auth database error, attempting fallback:', err.message);
  }

  // Mock fallback for demo purposes (e.g., if DB is down or user not in DB)
  if (userId === '999') {
    req.user = { id: 999, username: 'demo', role_name: 'Admin' };
    req.user.ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    req.user.user_agent = req.headers['user-agent'];
    return next();
  }

  res.status(401).json({ error: 'Invalid or inactive user' });
}

/**
 * Middleware to authorize based on roles.
 * @param {string[]} allowedRoles - List of role names allowed to access the route.
 */
function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role_name === 'Admin') {
      return next(); // Admin has access to everything
    }

    if (allowedRoles.includes(req.user.role_name)) {
      return next();
    }

    res.status(403).json({ error: 'Access denied: insufficient permissions' });
  };
}

module.exports = {
  authenticate,
  authorize
};
