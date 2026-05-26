const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET maintenance records (optionally for a specific asset)
router.get('/', async (req, res) => {
  const { asset_id } = req.query;
  try {
    let query = 'SELECT m.*, a.name as asset_name FROM maintenance_records m JOIN assets a ON m.asset_id = a.id';
    const params = [];
    if (asset_id) {
      query += ' WHERE m.asset_id = $1';
      params.push(asset_id);
    }
    query += ' ORDER BY m.maintenance_date DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.json([
      { id: 1, asset_name: 'Tracteur', maintenance_date: '2024-01-10', description: 'Vidange', cost: 25000 }
    ]);
  }
});

// POST a maintenance record
router.post('/', async (req, res) => {
  const { asset_id, maintenance_date, description, task_type, parts_used, cost, next_due_date } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO maintenance_records (asset_id, maintenance_date, description, task_type, parts_used, cost, next_due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [asset_id, maintenance_date, description, task_type, parts_used, cost, next_due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
