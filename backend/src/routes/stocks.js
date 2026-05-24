const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all stock items
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stock_items ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    // Fallback to mock data if DB is not available for demo
    res.json([
      { id: 1, name: 'Maïs Concassé', category_id: 1, unit: 'kg', current_stock: 500, minimum_threshold: 100 }
    ]);
  }
});

// GET one stock item
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stock_items WHERE id = $1', [req.params.id]);
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
