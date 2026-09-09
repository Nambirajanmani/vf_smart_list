const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const pool     = require('../db/pool');

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, username }
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Find admin user
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const admin = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT (expires in 8 hours)
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ token, username: admin.username });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/auth/verify
 * Verifies that the current token is valid (used by frontend on page load)
 */
const verify = (req, res) => {
  // authMiddleware already verified the token; req.admin is set
  return res.json({ valid: true, admin: req.admin });
};

module.exports = { login, verify };
