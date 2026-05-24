const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM transactions ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, date: '2024-02-15', type: 'IN', category: 'Vente', amount: 50000, description: 'Vente Oeufs' }]);
  }
});

router.post('/', async (req, res) => {
  const { date, type, category, amount, description } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO transactions (date, type, category, amount, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [date, type, category, amount, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
