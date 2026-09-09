const express = require('express');
const router  = express.Router();
const { saveHistory, getHistory, deleteHistory } = require('../controllers/historyController');
const userAuthMiddleware = require('../middleware/userAuthMiddleware');

// All history routes require user authentication
router.use(userAuthMiddleware);

// POST /api/history
router.post('/', saveHistory);

// GET /api/history
router.get('/', getHistory);

// DELETE /api/history/:id
router.delete('/:id', deleteHistory);

module.exports = router;
