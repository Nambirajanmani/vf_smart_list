const pool = require('../db/pool');

/* ─────────────────────────────────────────────
   PUBLIC ROUTES
───────────────────────────────────────────── */

/**
 * GET /api/items
 * Returns all ACTIVE items. Optional ?category=vegetable|fruit filter.
 */
const getPublicItems = async (req, res) => {
  try {
    const { category } = req.query;

    let query  = 'SELECT * FROM items WHERE is_active = TRUE';
    const params = [];

    if (category && ['vegetable', 'fruit'].includes(category)) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY category, name ASC';

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('getPublicItems error:', err);
    return res.status(500).json({ error: 'Failed to fetch items.' });
  }
};

/* ─────────────────────────────────────────────
   ADMIN ROUTES (JWT protected)
───────────────────────────────────────────── */

/**
 * GET /api/admin/items
 * Returns ALL items (active + inactive) for admin management.
 */
const getAllItems = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query  = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (category && ['vegetable', 'fruit'].includes(category)) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR name_ta ILIKE $${params.length})`;
    }

    query += ' ORDER BY category, name ASC';

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('getAllItems error:', err);
    return res.status(500).json({ error: 'Failed to fetch items.' });
  }
};

/**
 * POST /api/admin/items
 * Body: { name, name_ta, category, price_per_kg, emoji }
 */
const createItem = async (req, res) => {
  try {
    const { name, name_ta, category, price_per_kg, emoji } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'name and category are required.' });
    }

    if (!['vegetable', 'fruit'].includes(category)) {
      return res.status(400).json({ error: 'category must be "vegetable" or "fruit".' });
    }

    const result = await pool.query(
      `INSERT INTO items (name, name_ta, category, price_per_kg, emoji)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), (name_ta || '').trim(), category, parseFloat(price_per_kg || 0), emoji || '🛒']
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createItem error:', err);
    return res.status(500).json({ error: 'Failed to create item.' });
  }
};

/**
 * PUT /api/admin/items/:id
 * Body: { name, name_ta, category, price_per_kg, emoji, is_active }
 */
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, name_ta, category, price_per_kg, emoji, is_active } = req.body;

    const existing = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const item = existing.rows[0];

    const result = await pool.query(
      `UPDATE items
       SET name         = $1,
           name_ta      = $2,
           category     = $3,
           price_per_kg = $4,
           emoji        = $5,
           is_active    = $6
       WHERE id = $7
       RETURNING *`,
      [
        name         !== undefined ? name.trim()             : item.name,
        name_ta      !== undefined ? name_ta.trim()          : item.name_ta,
        category     !== undefined ? category                : item.category,
        price_per_kg !== undefined ? parseFloat(price_per_kg): item.price_per_kg,
        emoji        !== undefined ? emoji                   : item.emoji,
        is_active    !== undefined ? is_active               : item.is_active,
        id,
      ]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('updateItem error:', err);
    return res.status(500).json({ error: 'Failed to update item.' });
  }
};

/**
 * DELETE /api/admin/items/:id
 */
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    await pool.query('DELETE FROM items WHERE id = $1', [id]);
    return res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    console.error('deleteItem error:', err);
    return res.status(500).json({ error: 'Failed to delete item.' });
  }
};

/**
 * PATCH /api/admin/items/:id/toggle
 * Toggles is_active status
 */
const toggleItem = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const newStatus = !existing.rows[0].is_active;

    const result = await pool.query(
      'UPDATE items SET is_active = $1 WHERE id = $2 RETURNING *',
      [newStatus, id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('toggleItem error:', err);
    return res.status(500).json({ error: 'Failed to toggle item.' });
  }
};

/**
 * GET /api/admin/stats
 * Returns item counts for admin dashboard
 */
const getStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE category = 'vegetable')   AS vegetables,
        COUNT(*) FILTER (WHERE category = 'fruit')       AS fruits,
        COUNT(*) FILTER (WHERE is_active = TRUE)         AS active,
        COUNT(*) FILTER (WHERE is_active = FALSE)        AS hidden
      FROM items
    `);
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

module.exports = {
  getPublicItems,
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  toggleItem,
  getStats,
};
