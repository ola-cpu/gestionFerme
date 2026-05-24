const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM crop_cycles ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, plot_id: 1, crop_name: 'Maïs', planting_date: '2023-10-01', actual_yield: 2.5 }]);
  }
});

router.post('/', async (req, res) => {
  const { plot_id, crop_name, planting_date, harvest_date, expected_yield } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO crop_cycles (plot_id, crop_name, planting_date, harvest_date, expected_yield) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [plot_id, crop_name, planting_date, harvest_date, expected_yield]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { crop_name, actual_yield, harvest_date } = req.body;
  try {
    const result = await db.query(
      'UPDATE crop_cycles SET crop_name = $1, actual_yield = $2, harvest_date = $3 WHERE id = $4 RETURNING *',
      [crop_name, actual_yield, harvest_date, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM crop_cycles WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
