const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { deductStockFIFO } = require('../utils/stockUtils');

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
  const { name, area_hectares, soil_type, latitude, longitude, fertility_level, water_availability, responsible_id, status } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO plots (name, area_hectares, soil_type, latitude, longitude, fertility_level, water_availability, responsible_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, area_hectares, soil_type, latitude, longitude, fertility_level, water_availability, responsible_id, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/plots/:id', async (req, res) => {
    const { name, area_hectares, soil_type, latitude, longitude, fertility_level, water_availability, responsible_id, status } = req.body;
    try {
      const result = await db.query(
        'UPDATE plots SET name = $1, area_hectares = $2, soil_type = $3, latitude = $4, longitude = $5, fertility_level = $6, water_availability = $7, responsible_id = $8, status = $9 WHERE id = $10 RETURNING *',
        [name, area_hectares, soil_type, latitude, longitude, fertility_level, water_availability, responsible_id, status, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.delete('/plots/:id', async (req, res) => {
    try {
      await db.query('DELETE FROM plots WHERE id = $1', [req.params.id]);
      res.json({ message: 'Plot deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// --- CROP TYPES ---

router.get('/types', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM crop_types ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/types', async (req, res) => {
    const { name, variety, cycle_duration_days, water_needs, fertilizer_needs, expected_yield_per_ha } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO crop_types (name, variety, cycle_duration_days, water_needs, fertilizer_needs, expected_yield_per_ha) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, variety, cycle_duration_days, water_needs, fertilizer_needs, expected_yield_per_ha]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// --- CAMPAIGNS ---

router.get('/campaigns', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM agricultural_campaigns ORDER BY start_date DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/campaigns', async (req, res) => {
    const { name, start_date, end_date, status } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO agricultural_campaigns (name, start_date, end_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, start_date, end_date, status]
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
      SELECT c.*, p.name as plot_name, ct.name as crop_type_name, ac.name as campaign_name
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      LEFT JOIN crop_types ct ON c.crop_type_id = ct.id
      LEFT JOIN agricultural_campaigns ac ON c.campaign_id = ac.id
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
        SELECT c.*, p.name as plot_name, p.area_hectares, ct.name as crop_type_name, ac.name as campaign_name
        FROM crop_cycles c
        JOIN plots p ON c.plot_id = p.id
        LEFT JOIN crop_types ct ON c.crop_type_id = ct.id
        LEFT JOIN agricultural_campaigns ac ON c.campaign_id = ac.id
        WHERE c.id = $1
      `, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/', async (req, res) => {
  const { plot_id, campaign_id, crop_type_id, crop_name, season, planting_date, harvest_date, expected_yield } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO crop_cycles (plot_id, campaign_id, crop_type_id, crop_name, season, planting_date, harvest_date, expected_yield) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [plot_id, campaign_id, crop_type_id, crop_name, season, planting_date, harvest_date, expected_yield]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { crop_name, season, actual_yield, harvest_date, campaign_id, crop_type_id } = req.body;
  try {
    const result = await db.query(
      'UPDATE crop_cycles SET crop_name = $1, season = $2, actual_yield = $3, harvest_date = $4, campaign_id = $5, crop_type_id = $6 WHERE id = $7 RETURNING *',
      [crop_name, season, actual_yield, harvest_date, campaign_id, crop_type_id, req.params.id]
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
    const { crop_task_id, stock_item_id, quantity, unit, cost, warehouse_id } = req.body;
    const user_id = req.user.id;
    try {
      await db.query('BEGIN');

      // 1. Check stock and decrease it using FIFO logic
      await deductStockFIFO(stock_item_id, warehouse_id, quantity, `Utilisation culture - tâche #${crop_task_id}`, user_id);

      // 2. Insert input record
      const result = await db.query(
        'INSERT INTO crop_inputs (crop_task_id, stock_item_id, quantity, unit, cost) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [crop_task_id, stock_item_id, quantity, unit, cost]
      );

      await db.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await db.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    }
  });

// --- OBSERVATIONS ---

router.get('/:id/observations', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM agronomic_observations WHERE crop_cycle_id = $1 ORDER BY observation_date DESC', [req.params.id]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/observations', async (req, res) => {
    const { crop_cycle_id, observation_date, growth_stage, health_status, pests_observations, diseases_observations, recommendations, photo_url, recorded_by } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO agronomic_observations (crop_cycle_id, observation_date, growth_stage, health_status, pests_observations, diseases_observations, recommendations, photo_url, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [crop_cycle_id, observation_date, growth_stage, health_status, pests_observations, diseases_observations, recommendations, photo_url, recorded_by]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// --- IRRIGATION ---

router.get('/:id/irrigation', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM irrigation_records WHERE crop_cycle_id = $1 ORDER BY irrigation_date DESC', [req.params.id]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/irrigation', async (req, res) => {
    const { crop_cycle_id, irrigation_date, water_quantity_m3, duration_minutes, cost, method } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO irrigation_records (crop_cycle_id, irrigation_date, water_quantity_m3, duration_minutes, cost, method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [crop_cycle_id, irrigation_date, water_quantity_m3, duration_minutes, cost, method]
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
        SELECT c.actual_yield, p.area_hectares, ct.expected_yield_per_ha
        FROM crop_cycles c
        JOIN plots p ON c.plot_id = p.id
        LEFT JOIN crop_types ct ON c.crop_type_id = ct.id
        WHERE c.id = $1
      `, [cycleId]);

      const taskCostsRes = await db.query('SELECT SUM(cost) as total_task_cost FROM crop_tasks WHERE crop_cycle_id = $1', [cycleId]);
      const inputCostsRes = await db.query(`
        SELECT SUM(ci.cost) as total_input_cost
        FROM crop_inputs ci
        JOIN crop_tasks ct ON ci.crop_task_id = ct.id
        WHERE ct.crop_cycle_id = $1
      `, [cycleId]);
      const irrigationCostsRes = await db.query('SELECT SUM(cost) as total_irrigation_cost FROM irrigation_records WHERE crop_cycle_id = $1', [cycleId]);

      const cycle = cycleRes.rows[0];
      const totalCost = (
        parseFloat(taskCostsRes.rows[0].total_task_cost || 0) +
        parseFloat(inputCostsRes.rows[0].total_input_cost || 0) +
        parseFloat(irrigationCostsRes.rows[0].total_irrigation_cost || 0)
      );

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
        area: cycle ? cycle.area_hectares : 0,
        expected_yield_per_ha: cycle ? cycle.expected_yield_per_ha : 0
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
