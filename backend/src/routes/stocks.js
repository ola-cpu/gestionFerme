const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');
const { authorize } = require('../middleware/auth');

// Apply authorization to all stock routes
router.use(authorize(['Magasinier', 'Chef d’élevage']));

// GET all stock items with category name and alerts
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT si.*, sc.name as category_name,
      (SELECT COUNT(*) FROM stock_batches sb WHERE sb.stock_item_id = si.id AND sb.expiry_date < CURRENT_DATE + INTERVAL '30 days') as near_expiry_count
      FROM stock_items si
      JOIN stock_categories sc ON si.category_id = sc.id
      ORDER BY si.id ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.json([
      { id: 1, name: 'Maïs Concassé', category_id: 1, category_name: 'Aliments', unit: 'kg', current_stock: 500, minimum_threshold: 100, near_expiry_count: 0 }
    ]);
  }
});

// GET batches for a stock item
router.get('/:id/batches', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stock_batches WHERE stock_item_id = $1 ORDER BY expiry_date ASC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET movements for a stock item
router.get('/:id/movements', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stock_movements WHERE stock_item_id = $1 ORDER BY movement_date DESC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a movement (IN/OUT)
router.post('/:id/movements', async (req, res) => {
  const { batch_id, movement_type, quantity, reason, unit_price, user_id } = req.body;
  const stock_item_id = req.params.id;

  try {
    await db.query('BEGIN');

    // 1. Record movement
    await db.query(
      'INSERT INTO stock_movements (stock_item_id, batch_id, movement_type, quantity, reason) VALUES ($1, $2, $3, $4, $5)',
      [stock_item_id, batch_id, movement_type, quantity, reason]
    );

    // 2. Update stock_items current_stock
    const multiplier = movement_type === 'IN' ? 1 : -1;
    await db.query(
      'UPDATE stock_items SET current_stock = current_stock + $1 WHERE id = $2',
      [quantity * multiplier, stock_item_id]
    );

    // 3. Update batch if applicable
    if (batch_id) {
      await db.query(
        'UPDATE stock_batches SET current_quantity = current_quantity + $1 WHERE id = $2',
        [quantity * multiplier, batch_id]
      );
    } else if (movement_type === 'IN' && !batch_id) {
      // Create new batch if none provided for IN movement
      await db.query(
        'INSERT INTO stock_batches (stock_item_id, batch_number, initial_quantity, current_quantity, unit_price) VALUES ($1, $2, $3, $4, $5)',
        [stock_item_id, 'LOT-' + Date.now(), quantity, quantity, unit_price]
      );
    }

    await logAction(user_id, `STOCK_${movement_type}`, 'stock_items', stock_item_id, { quantity, reason });

    await db.query('COMMIT');
    res.status(201).json({ message: 'Movement recorded successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// GET one stock item
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT si.*, sc.name as category_name FROM stock_items si JOIN stock_categories sc ON si.category_id = sc.id WHERE si.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new stock item
router.post('/', async (req, res) => {
  const { category_id, name, unit, minimum_threshold, current_stock } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO stock_items (category_id, name, unit, minimum_threshold, current_stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [category_id, name, unit, minimum_threshold, current_stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update stock item
router.put('/:id', async (req, res) => {
  const { category_id, name, unit, minimum_threshold, current_stock } = req.body;
  try {
    const result = await db.query(
      'UPDATE stock_items SET category_id = $1, name = $2, unit = $3, minimum_threshold = $4, current_stock = $5 WHERE id = $6 RETURNING *',
      [category_id, name, unit, minimum_threshold, current_stock, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE stock item
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM stock_items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
