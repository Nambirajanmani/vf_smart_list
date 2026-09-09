const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getPublicItems,
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  toggleItem,
  getStats,
} = require('../controllers/itemController');

// ── PUBLIC ───────────────────────────────────
// GET /api/items          → all active items (optionally filtered by ?category=)
router.get('/', getPublicItems);

// ── ADMIN (JWT protected) ────────────────────
// GET    /api/admin/items
router.get('/admin/items',        authMiddleware, getAllItems);

// GET    /api/admin/stats
router.get('/admin/stats',        authMiddleware, getStats);

// POST   /api/admin/items
router.post('/admin/items',       authMiddleware, createItem);

// PUT    /api/admin/items/:id
router.put('/admin/items/:id',    authMiddleware, updateItem);

// DELETE /api/admin/items/:id
router.delete('/admin/items/:id', authMiddleware, deleteItem);

// PATCH  /api/admin/items/:id/toggle
router.patch('/admin/items/:id/toggle', authMiddleware, toggleItem);

module.exports = router;
