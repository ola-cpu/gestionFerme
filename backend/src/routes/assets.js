const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all assets with responsible name
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT a.*, e.first_name || ' ' || e.last_name as responsible_name, f.name as farm_name
      FROM assets a
      LEFT JOIN employees e ON a.responsible_id = e.id
      LEFT JOIN farms f ON a.farm_id = f.id
      ORDER BY a.name
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    res.json([
      { id: 1, name: 'Tracteur John Deere', category: 'Véhicule', status: 'Actif', code_actif: 'TRAC-001', brand: 'John Deere', model: '6120M' },
      { id: 2, name: 'Bâtiment A (Poulailler)', category: 'Bâtiment', status: 'Actif', code_actif: 'BAT-A' }
    ]);
  }
});

// GET single asset details
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new asset
router.post('/', async (req, res) => {
  const {
    farm_id, code_actif, serial_number, name, category, brand, model,
    purchase_date, purchase_price, lifespan_years, status, responsible_id,
    latitude, longitude, exploitation_type
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO assets (
        farm_id, code_actif, serial_number, name, category, brand, model,
        purchase_date, purchase_price, lifespan_years, status, responsible_id,
        latitude, longitude, exploitation_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        farm_id, code_actif, serial_number, name, category, brand, model,
        purchase_date, purchase_price, lifespan_years, status || 'Actif', responsible_id,
        latitude, longitude, exploitation_type || 'Heures'
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (update) an asset
router.put('/:id', async (req, res) => {
  const {
    farm_id, code_actif, serial_number, name, category, brand, model,
    purchase_date, purchase_price, lifespan_years, status, responsible_id,
    latitude, longitude, exploitation_type
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE assets SET
        farm_id = $1, code_actif = $2, serial_number = $3, name = $4, category = $5,
        brand = $6, model = $7, purchase_date = $8, purchase_price = $9,
        lifespan_years = $10, status = $11, responsible_id = $12,
        latitude = $13, longitude = $14, exploitation_type = $15
      WHERE id = $16 RETURNING *`,
      [
        farm_id, code_actif, serial_number, name, category, brand, model,
        purchase_date, purchase_price, lifespan_years, status, responsible_id,
        latitude, longitude, exploitation_type, req.params.id
      ]
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
