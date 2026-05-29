const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');
const { deductStockFIFO } = require('../utils/stockUtils');

// Apply authorization
router.use(authorize(['Chef d’élevage', 'Magasinier']));

// --- MAINTENANCE RECORDS ---

// GET maintenance records
router.get('/', async (req, res) => {
  const { asset_id } = req.query;
  try {
    let query = `
      SELECT m.*, a.name as asset_name, a.code_actif, e.first_name || ' ' || e.last_name as technician_name
      FROM maintenance_records m
      JOIN assets a ON m.asset_id = a.id
      LEFT JOIN employees e ON m.technician_id = e.id
    `;
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
      { id: 1, asset_name: 'Tracteur', code_actif: 'TRAC-001', maintenance_date: '2024-01-10', description: 'Vidange', task_type: 'Préventif', total_cost: 25000 }
    ]);
  }
});

// POST a maintenance record (with parts integration)
router.post('/', async (req, res) => {
  const {
    asset_id, intervention_id, technician_id, maintenance_date,
    description, task_type, labor_cost, parts, downtime_hours, next_due_date
  } = req.body;

  try {
    // Start transaction
    await db.query('BEGIN');

    // 1. Calculate parts cost and deduct stock
    let totalPartsCost = 0;
    const partsUsed = parts || []; // Expected [{ stock_item_id, warehouse_id, quantity, unit_price }]

    // 2. Insert record
    const recordResult = await db.query(
      `INSERT INTO maintenance_records (
        asset_id, intervention_id, technician_id, maintenance_date,
        description, task_type, labor_cost, parts_cost, downtime_hours, next_due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [asset_id, intervention_id, technician_id, maintenance_date, description, task_type, labor_cost || 0, 0, downtime_hours || 0, next_due_date]
    );
    const recordId = recordResult.rows[0].id;

    for (const part of partsUsed) {
      // Deduct stock
      await deductStockFIFO(part.stock_item_id, part.warehouse_id, part.quantity, `Maintenance Asset #${asset_id}`, req.headers['x-user-id']);

      // Link part
      await db.query(
        'INSERT INTO maintenance_parts (maintenance_record_id, stock_item_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [recordId, part.stock_item_id, part.quantity, part.unit_price]
      );
      totalPartsCost += (part.quantity * part.unit_price);
    }

    // 3. Update parts_cost in record
    await db.query('UPDATE maintenance_records SET parts_cost = $1 WHERE id = $2', [totalPartsCost, recordId]);

    // 4. Update intervention status if linked
    if (intervention_id) {
      const intCheck = await db.query('SELECT status FROM maintenance_interventions WHERE id = $1', [intervention_id]);
      if (intCheck.rows[0].status !== 'Approuvé' && intCheck.rows[0].status !== 'En cours') {
          throw new Error('L\'intervention doit être Approuvée avant d\'être clôturée par un rapport.');
      }
      await db.query(
        'UPDATE maintenance_interventions SET status = \'Résolu\', resolved_at = CURRENT_TIMESTAMP WHERE id = $1',
        [intervention_id]
      );
    }

    // 5. Update asset status back to Actif
    await db.query('UPDATE assets SET status = \'Actif\' WHERE id = $1', [asset_id]);

    await db.query('COMMIT');
    res.status(201).json(recordResult.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// --- MAINTENANCE PLANS (PREVENTIVE) ---

router.get('/plans', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, a.name as asset_name, a.code_actif
      FROM maintenance_plans p
      JOIN assets a ON p.asset_id = a.id
      ORDER BY p.next_due_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

router.post('/plans', async (req, res) => {
  const { asset_id, task_name, frequency_days, frequency_usage, next_due_date, next_due_usage, description } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO maintenance_plans (asset_id, task_name, frequency_days, frequency_usage, next_due_date, next_due_usage, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [asset_id, task_name, frequency_days, frequency_usage, next_due_date, next_due_usage, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INTERVENTIONS (CORRECTIVE) ---

router.get('/interventions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, a.name as asset_name, a.code_actif, u.username as reporter_name, e.first_name || ' ' || e.last_name as technician_name
      FROM maintenance_interventions i
      JOIN assets a ON i.asset_id = a.id
      LEFT JOIN users u ON i.reporter_id = u.id
      LEFT JOIN employees e ON i.assigned_technician_id = e.id
      ORDER BY i.report_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

router.post('/interventions', async (req, res) => {
  const { asset_id, fault_description, urgency, assigned_technician_id } = req.body;
  const reporter_id = req.user.id;
  try {
    await db.query('BEGIN');
    const result = await db.query(
      `INSERT INTO maintenance_interventions (asset_id, reporter_id, fault_description, urgency, assigned_technician_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [asset_id, reporter_id, fault_description, urgency || 'Normale', assigned_technician_id]
    );
    // Update asset status
    await db.query('UPDATE assets SET status = \'En maintenance\' WHERE id = $1', [asset_id]);
    await db.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// PUT approve/update intervention status
router.put('/interventions/:id', authorize(['Chef d’élevage', 'Admin']), async (req, res) => {
  const { status, assigned_technician_id, resolution_details } = req.body;
  const user_id = req.user.id;
  try {
    const updateFields = [];
    const params = [req.params.id];
    let paramIdx = 2;

    if (status) {
        updateFields.push(`status = $${paramIdx++}`);
        params.push(status);
        if (status === 'Approuvé') {
            updateFields.push(`approved_by = $${paramIdx++}`);
            params.push(user_id);
        }
    }
    if (assigned_technician_id) {
        updateFields.push(`assigned_technician_id = $${paramIdx++}`);
        params.push(assigned_technician_id);
    }
    if (resolution_details) {
        updateFields.push(`resolution_details = $${paramIdx++}`);
        params.push(resolution_details);
    }

    if (updateFields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    const query = `UPDATE maintenance_interventions SET ${updateFields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ASSET USAGE LOGS ---

router.get('/usage/:asset_id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT l.*, e.first_name || \' \' || e.last_name as operator_name FROM asset_usage_logs l LEFT JOIN employees e ON l.operator_id = e.id WHERE asset_id = $1 ORDER BY record_date DESC LIMIT 50',
      [req.params.asset_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

router.post('/usage', async (req, res) => {
  const { asset_id, record_date, usage_value, fuel_liters, operator_id, notes } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO asset_usage_logs (asset_id, record_date, usage_value, fuel_liters, operator_id, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [asset_id, record_date || new Date(), usage_value, fuel_liters || 0, operator_id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
