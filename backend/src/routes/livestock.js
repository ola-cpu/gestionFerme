const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM livestock_batches ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, species_id: 1, batch_name: 'Demo Lot', current_count: 10, status: 'Active' }]);
  }
});

// POST
router.post('/', async (req, res) => {
  const { species_id, batch_name, arrival_date, initial_count, current_count } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO livestock_batches (species_id, batch_name, arrival_date, initial_count, current_count) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [species_id, batch_name, arrival_date, initial_count, current_count]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT
router.put('/:id', async (req, res) => {
  const { batch_name, current_count, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE livestock_batches SET batch_name = $1, current_count = $2, status = $3 WHERE id = $4 RETURNING *',
      [batch_name, current_count, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM livestock_batches WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
