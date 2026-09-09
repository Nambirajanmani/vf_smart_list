const express       = require('express');
const router        = express.Router();
const { login, verify } = require('../controllers/authController');
const authMiddleware    = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/verify  (protected — checks token validity)
router.get('/verify', authMiddleware, verify);

module.exports = router;
