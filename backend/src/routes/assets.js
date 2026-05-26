const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all assets
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM assets ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.json([
      { id: 1, name: 'Tracteur John Deere', category: 'Véhicule', status: 'Actif' },
      { id: 2, name: 'Bâtiment A (Poulailler)', category: 'Bâtiment', status: 'Actif' }
    ]);
  }
});

// POST a new asset
router.post('/', async (req, res) => {
  const { name, category, purchase_date, purchase_price, status } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO assets (name, category, purchase_date, purchase_price, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, category, purchase_date, purchase_price, status || 'Actif']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (update) an asset
router.put('/:id', async (req, res) => {
  const { name, category, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE assets SET name = $1, category = $2, status = $3 WHERE id = $4 RETURNING *',
      [name, category, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an asset
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM assets WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
