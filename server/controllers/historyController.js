const pool = require('../db/pool');

/**
 * POST /api/history
 * Save current selection to user shopping history.
 * Body: { title?: string, items: Array<{ id, name, name_ta, emoji, category, kg, kgFormatted }> }
 */
const saveHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one selected item is required to save to history.' });
    }

    const totalItems  = items.length;
    const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.kg) || 0), 0);
    const historyTitle = (title && title.trim()) || `Shopping List (${totalItems} items)`;

    // Insert into database
    const result = await pool.query(
      'INSERT INTO shopping_history (user_id, title, total_items, total_weight, items_data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, historyTitle, totalItems, totalWeight, JSON.stringify(items)]
    );

    return res.status(201).json({
      message: 'Shopping list saved to history successfully!',
      history: result.rows[0],
    });
  } catch (err) {
    console.error('Save History Error:', err);
    return res.status(500).json({ error: 'Failed to save shopping list to history.' });
  }
};

/**
 * GET /api/history
 * Fetch all saved shopping history entries for the logged-in user.
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM shopping_history WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return res.json({ history: result.rows });
  } catch (err) {
    console.error('Get History Error:', err);
    return res.status(500).json({ error: 'Failed to fetch selection history.' });
  }
};

/**
 * DELETE /api/history/:id
 * Delete a history entry for the logged-in user.
 */
const deleteHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const historyId = req.params.id;

    await pool.query(
      'DELETE FROM shopping_history WHERE id = $1 AND user_id = $2',
      [historyId, userId]
    );

    return res.json({ message: 'History entry deleted successfully.' });
  } catch (err) {
    console.error('Delete History Error:', err);
    return res.status(500).json({ error: 'Failed to delete history record.' });
  }
};

module.exports = { saveHistory, getHistory, deleteHistory };
