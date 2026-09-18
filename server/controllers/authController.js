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

    const trimmedUser = username.trim();
    const defaultUser = process.env.ADMIN_USERNAME || 'admin';
    const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Query database for admin user
    let admin = null;
    try {
      const result = await pool.query(
        'SELECT * FROM admin_users WHERE LOWER(username) = LOWER($1)',
        [trimmedUser]
      );
      if (result && result.rows && result.rows.length > 0) {
        admin = result.rows[0];
      }
    } catch (queryErr) {
      console.warn('⚠️ Admin query DB notice:', queryErr.message);
    }

    let isMatch = false;

    // 2. If admin found in DB, check hash
    if (admin && admin.password_hash) {
      isMatch = await bcrypt.compare(password, admin.password_hash);
    }

    // 3. Fallback: If matching configured default admin credentials
    if (!isMatch && trimmedUser.toLowerCase() === defaultUser.toLowerCase() && password === defaultPass) {
      isMatch = true;
      if (!admin) {
        admin = { id: 1, username: defaultUser };
      }
      // Ensure the admin user exists in the DB with the updated hash so DB stays synchronized
      try {
        const hash = await bcrypt.hash(defaultPass, 10);
        await pool.query(
          `INSERT INTO admin_users (username, password_hash)
           VALUES ($1, $2)
           ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
          [defaultUser, hash]
        );
        console.log(`✅ Admin credentials synchronized in database for "${defaultUser}"`);
      } catch (upsertErr) {
        // Fallback if table or constraint is different
        try {
          const hash = await bcrypt.hash(defaultPass, 10);
          await pool.query(
            'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
            [defaultUser, hash]
          );
        } catch (insertErr) {
          // Table or DB offline, memory fallback is already active
        }
      }
    }

    if (!isMatch || !admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT (expires in 8 hours)
    const token = jwt.sign(
      { id: admin.id, username: admin.username || defaultUser },
      process.env.JWT_SECRET || 'vf_smart_list_super_secret_jwt_key_2024',
      { expiresIn: '8h' }
    );

    return res.json({ token, username: admin.username || defaultUser });
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
