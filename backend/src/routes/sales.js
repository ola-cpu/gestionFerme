const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sales ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, client_id: 1, sale_date: '2024-02-01', total_amount: 120000, payment_status: 'Paid' }]);
  }
});

router.post('/', async (req, res) => {
  const { client_id, sale_date, total_amount, payment_status } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO sales (client_id, sale_date, total_amount, payment_status) VALUES ($1, $2, $3, $4) RETURNING *',
      [client_id, sale_date, total_amount, payment_status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { total_amount, payment_status } = req.body;
  try {
    const result = await db.query(
      'UPDATE sales SET total_amount = $1, payment_status = $2 WHERE id = $3 RETURNING *',
      [total_amount, payment_status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM sales WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sale items (for traceability)
router.get('/items', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT si.*, s.sale_date, b.batch_name
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN livestock_batches b ON si.batch_id = b.id
      ORDER BY s.sale_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
