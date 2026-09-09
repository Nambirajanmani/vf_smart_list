const express = require('express');
const router  = express.Router();
const { register, login, getProfile } = require('../controllers/userAuthController');
const userAuthMiddleware = require('../middleware/userAuthMiddleware');

// POST /api/user-auth/register
router.post('/register', register);

// POST /api/user-auth/login
router.post('/login', login);

// GET /api/user-auth/me (protected)
router.get('/me', userAuthMiddleware, getProfile);

module.exports = router;
