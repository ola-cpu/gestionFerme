const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- PLOTS ---

router.get('/plots', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM plots ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, name: 'Parcelle Nord', area_hectares: 5, soil_type: 'Argileux' }]);
  }
});

router.post('/plots', async (req, res) => {
  const { name, area_hectares, soil_type } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO plots (name, area_hectares, soil_type) VALUES ($1, $2, $3) RETURNING *',
      [name, area_hectares, soil_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CROP CYCLES ---

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, p.name as plot_name
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      ORDER BY c.planting_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, plot_id: 1, plot_name: 'Parcelle Nord', crop_name: 'Maïs', planting_date: '2023-10-01', actual_yield: 2.5 }]);
  }
});

router.get('/:id', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT c.*, p.name as plot_name, p.area_hectares
        FROM crop_cycles c
        JOIN plots p ON c.plot_id = p.id
        WHERE c.id = $1
      `, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/', async (req, res) => {
  const { plot_id, crop_name, season, planting_date, harvest_date, expected_yield } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO crop_cycles (plot_id, crop_name, season, planting_date, harvest_date, expected_yield) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [plot_id, crop_name, season, planting_date, harvest_date, expected_yield]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { crop_name, season, actual_yield, harvest_date } = req.body;
  try {
    const result = await db.query(
      'UPDATE crop_cycles SET crop_name = $1, season = $2, actual_yield = $3, harvest_date = $4 WHERE id = $5 RETURNING *',
      [crop_name, season, actual_yield, harvest_date, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASKS ---

router.get('/:id/tasks', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM crop_tasks WHERE crop_cycle_id = $1 ORDER BY task_date DESC', [req.params.id]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/tasks', async (req, res) => {
    const { crop_cycle_id, task_type, task_date, description, cost } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO crop_tasks (crop_cycle_id, task_type, task_date, description, cost) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [crop_cycle_id, task_type, task_date, description, cost]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// --- INPUTS ---

router.get('/tasks/:taskId/inputs', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT ci.*, si.name as item_name
        FROM crop_inputs ci
        JOIN stock_items si ON ci.stock_item_id = si.id
        WHERE ci.crop_task_id = $1
      `, [req.params.taskId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/inputs', async (req, res) => {
    const { crop_task_id, stock_item_id, quantity, unit, cost } = req.body;
    try {
      // 1. Check stock and decrease it
      const stockCheck = await db.query('SELECT current_stock FROM stock_items WHERE id = $1', [stock_item_id]);
      if (stockCheck.rows.length === 0) return res.status(404).json({ error: 'Stock item not found' });
      if (stockCheck.rows[0].current_stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

      await db.query('UPDATE stock_items SET current_stock = current_stock - $1 WHERE id = $2', [quantity, stock_item_id]);

      // 2. Insert input record
      const result = await db.query(
        'INSERT INTO crop_inputs (crop_task_id, stock_item_id, quantity, unit, cost) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [crop_task_id, stock_item_id, quantity, unit, cost]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// --- PERFORMANCE ---

router.get('/:id/performance', async (req, res) => {
    try {
      const cycleId = req.params.id;

      const cycleRes = await db.query(`
        SELECT c.actual_yield, p.area_hectares
        FROM crop_cycles c
        JOIN plots p ON c.plot_id = p.id
        WHERE c.id = $1
      `, [cycleId]);

      const taskCostsRes = await db.query('SELECT SUM(cost) as total_task_cost FROM crop_tasks WHERE crop_cycle_id = $1', [cycleId]);
      const inputCostsRes = await db.query(`
        SELECT SUM(ci.cost) as total_input_cost
        FROM crop_inputs ci
        JOIN crop_tasks ct ON ci.crop_task_id = ct.id
        WHERE ct.crop_cycle_id = $1
      `, [cycleId]);

      const cycle = cycleRes.rows[0];
      const totalCost = (parseFloat(taskCostsRes.rows[0].total_task_cost || 0) + parseFloat(inputCostsRes.rows[0].total_input_cost || 0));

      let yieldPerHa = 0;
      let costPerHa = 0;

      if (cycle && cycle.area_hectares > 0) {
        yieldPerHa = (cycle.actual_yield || 0) / cycle.area_hectares;
        costPerHa = totalCost / cycle.area_hectares;
      }

      res.json({
        total_cost: totalCost,
        yield_per_ha: yieldPerHa.toFixed(2),
        cost_per_ha: costPerHa.toFixed(2),
        area: cycle ? cycle.area_hectares : 0
      });
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
