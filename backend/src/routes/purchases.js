const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM purchases ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, supplier_id: 1, purchase_date: '2024-01-10', total_amount: 45000, status: 'Received' }]);
  }
});

router.post('/', async (req, res) => {
  const { supplier_id, purchase_date, total_amount, status } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO purchases (supplier_id, purchase_date, total_amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [supplier_id, purchase_date, total_amount, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { total_amount, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE purchases SET total_amount = $1, status = $2 WHERE id = $3 RETURNING *',
      [total_amount, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM purchases WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
