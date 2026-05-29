const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');

// Apply authorization to all warehouse routes
router.use(authorize(['Magasinier', 'Admin']));

// GET all warehouses
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT w.*, u.username as manager_name
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      ORDER BY w.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new warehouse
router.post('/', async (req, res) => {
  const { name, type, location, capacity, manager_id, conditions } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO warehouses (name, type, location, capacity, manager_id, conditions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, type, location, capacity, manager_id, conditions]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one warehouse
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM warehouses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update warehouse
router.put('/:id', async (req, res) => {
  const { name, type, location, capacity, manager_id, conditions } = req.body;
  try {
    const result = await db.query(
      'UPDATE warehouses SET name = $1, type = $2, location = $3, capacity = $4, manager_id = $5, conditions = $6 WHERE id = $7 RETURNING *',
      [name, type, location, capacity, manager_id, conditions, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE warehouse
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM warehouses WHERE id = $1', [req.params.id]);
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ZONES ---

// GET zones for a warehouse
router.get('/:id/zones', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM storage_zones WHERE warehouse_id = $1 ORDER BY name ASC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new zone
router.post('/:id/zones', async (req, res) => {
  const { name, description } = req.body;
  const warehouse_id = req.params.id;
  try {
    const result = await db.query(
      'INSERT INTO storage_zones (warehouse_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [warehouse_id, name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
