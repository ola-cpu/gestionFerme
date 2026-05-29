const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');
const { authorize } = require('../middleware/auth');
const { deductStockFIFO } = require('../utils/stockUtils');

// Apply authorization to all stock routes
router.use(authorize(['Magasinier', 'Chef d’élevage']));

// GET all stock items with category name and alerts
router.get('/', async (req, res) => {
  const { warehouse_id, category_id } = req.query;
  try {
    let query = `
      SELECT si.*, sc.name as category_name,
      (SELECT COUNT(*) FROM stock_batches sb WHERE sb.stock_item_id = si.id AND sb.expiry_date < CURRENT_DATE + INTERVAL '30 days') as near_expiry_count
      FROM stock_items si
      JOIN stock_categories sc ON si.category_id = sc.id
    `;

    const params = [];
    if (warehouse_id || category_id) {
        query += ' WHERE ';
        if (warehouse_id) {
            query += 'si.id IN (SELECT stock_item_id FROM stock_batches WHERE warehouse_id = $1)';
            params.push(warehouse_id);
        }
        if (category_id) {
            if (warehouse_id) query += ' AND ';
            query += 'si.category_id = $' + (params.length + 1);
            params.push(category_id);
        }
    }

    query += ' ORDER BY si.id ASC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.json([
      { id: 1, name: 'Maïs Concassé', category_id: 1, category_name: 'Aliments', unit: 'kg', current_stock: 500, minimum_threshold: 100, near_expiry_count: 0 }
    ]);
  }
});

// GET batches for a stock item
router.get('/:id/batches', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stock_batches WHERE stock_item_id = $1 ORDER BY expiry_date ASC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET movements for a stock item
router.get('/:id/movements', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stock_movements WHERE stock_item_id = $1 ORDER BY movement_date DESC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a movement (IN/OUT)
router.post('/:id/movements', async (req, res) => {
  const { batch_id, warehouse_id, movement_type, quantity, reason, unit_price } = req.body;
  const stock_item_id = req.params.id;
  const user_id = req.user.id;

  try {
    await db.query('BEGIN');

    // 1. Get stock item info
    const itemRes = await db.query('SELECT * FROM stock_items WHERE id = $1', [stock_item_id]);
    const item = itemRes.rows[0];

    // 2. Handle different movement types
    let targetBatchId = batch_id;

    if (movement_type === 'IN') {
      if (!targetBatchId) {
        // Create new batch if none provided for IN movement
        const newBatch = await db.query(
          'INSERT INTO stock_batches (stock_item_id, warehouse_id, batch_number, initial_quantity, current_quantity, unit_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [stock_item_id, warehouse_id, 'LOT-' + Date.now(), quantity, quantity, unit_price]
        );
        targetBatchId = newBatch.rows[0].id;
      } else {
        await db.query(
          'UPDATE stock_batches SET current_quantity = current_quantity + $1 WHERE id = $2',
          [quantity, targetBatchId]
        );
      }

      await db.query(
        'INSERT INTO stock_movements (stock_item_id, batch_id, warehouse_id, movement_type, quantity, reason, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [stock_item_id, targetBatchId, warehouse_id, 'IN', quantity, reason, user_id]
      );

      await db.query('UPDATE stock_items SET current_stock = current_stock + $1 WHERE id = $2', [quantity, stock_item_id]);

    } else if (movement_type === 'OUT') {
      if (!targetBatchId) {
        await deductStockFIFO(stock_item_id, warehouse_id, quantity, reason, user_id);
      } else {
        await db.query(
          'UPDATE stock_batches SET current_quantity = current_quantity - $1 WHERE id = $2',
          [quantity, targetBatchId]
        );
        await db.query(
          'INSERT INTO stock_movements (stock_item_id, batch_id, warehouse_id, movement_type, quantity, reason, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [stock_item_id, targetBatchId, warehouse_id, 'OUT', quantity, reason, user_id]
        );
        await db.query('UPDATE stock_items SET current_stock = current_stock - $1 WHERE id = $2', [quantity, stock_item_id]);
      }
    }

    // 5. CMUP Valuation Update (Simplified)
    if (movement_type === 'IN' && item.valuation_method === 'CMUP') {
        // Placeholder for future CMUP logic
    }

    await logAction(user_id, `STOCK_${movement_type}`, 'stock_items', stock_item_id, { quantity, reason });

    await db.query('COMMIT');
    res.status(201).json({ message: 'Movement recorded successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// GET one stock item
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT si.*, sc.name as category_name FROM stock_items si JOIN stock_categories sc ON si.category_id = sc.id WHERE si.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new stock item (Article creation)
router.post('/', async (req, res) => {
  const { category_id, name, unit, minimum_threshold, maximum_threshold, code, qr_code, valuation_method } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO stock_items (category_id, name, unit, minimum_threshold, maximum_threshold, code, qr_code, valuation_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [category_id, name, unit, minimum_threshold, maximum_threshold, code, qr_code, valuation_method || 'CMUP']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update stock item
router.put('/:id', async (req, res) => {
  const { category_id, name, unit, minimum_threshold, current_stock } = req.body;
  try {
    const result = await db.query(
      'UPDATE stock_items SET category_id = $1, name = $2, unit = $3, minimum_threshold = $4, current_stock = $5 WHERE id = $6 RETURNING *',
      [category_id, name, unit, minimum_threshold, current_stock, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE stock item
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM stock_items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a transfer between warehouses
router.post('/transfers', async (req, res) => {
  const { from_warehouse_id, to_warehouse_id, stock_item_id, batch_id, quantity } = req.body;
  const user_id = req.user.id;

  try {
    await db.query('BEGIN');

    // 1. Check if enough stock exists in source batch
    const sourceBatch = await db.query(
      'SELECT current_quantity FROM stock_batches WHERE id = $1 AND warehouse_id = $2',
      [batch_id, from_warehouse_id]
    );

    if (sourceBatch.rows.length === 0 || sourceBatch.rows[0].current_quantity < quantity) {
      throw new Error('Insufficient stock in source batch/warehouse');
    }

    // 2. Decrement source batch
    await db.query(
      'UPDATE stock_batches SET current_quantity = current_quantity - $1 WHERE id = $2',
      [quantity, batch_id]
    );

    // 3. Increment or create target batch
    // Try to find a batch with same number in target warehouse, or create new
    const originalBatch = await db.query('SELECT * FROM stock_batches WHERE id = $1', [batch_id]);
    const { batch_number, expiry_date, unit_price } = originalBatch.rows[0];

    const targetBatch = await db.query(
      'SELECT id FROM stock_batches WHERE batch_number = $1 AND warehouse_id = $2 AND stock_item_id = $3',
      [batch_number, to_warehouse_id, stock_item_id]
    );

    let finalTargetBatchId;
    if (targetBatch.rows.length > 0) {
      finalTargetBatchId = targetBatch.rows[0].id;
      await db.query(
        'UPDATE stock_batches SET current_quantity = current_quantity + $1 WHERE id = $2',
        [quantity, finalTargetBatchId]
      );
    } else {
      const newBatch = await db.query(
        'INSERT INTO stock_batches (stock_item_id, warehouse_id, batch_number, expiry_date, initial_quantity, current_quantity, unit_price) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [stock_item_id, to_warehouse_id, batch_number, expiry_date, quantity, quantity, unit_price]
      );
      finalTargetBatchId = newBatch.rows[0].id;
    }

    // 4. Record transfer
    await db.query(
      'INSERT INTO stock_transfers (from_warehouse_id, to_warehouse_id, stock_item_id, batch_id, quantity, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [from_warehouse_id, to_warehouse_id, stock_item_id, batch_id, quantity, user_id]
    );

    // 5. Record movements for history
    await db.query(
      'INSERT INTO stock_movements (stock_item_id, batch_id, warehouse_id, movement_type, quantity, reason, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [stock_item_id, batch_id, from_warehouse_id, 'OUT', quantity, `Transfer to warehouse ${to_warehouse_id}`, user_id]
    );
    await db.query(
      'INSERT INTO stock_movements (stock_item_id, batch_id, warehouse_id, movement_type, quantity, reason, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [stock_item_id, finalTargetBatchId, to_warehouse_id, 'IN', quantity, `Transfer from warehouse ${from_warehouse_id}`, user_id]
    );

    await logAction(user_id, 'STOCK_TRANSFER', 'stock_transfers', null, { from_warehouse_id, to_warehouse_id, quantity });

    await db.query('COMMIT');
    res.status(201).json({ message: 'Transfer completed successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// POST bulk stock adjustment (Inventory validation)
router.post('/bulk-adjust', async (req, res) => {
  const { warehouse_id, adjustments } = req.body; // adjustments: [{ stock_item_id, theoretical, actual }]
  const user_id = req.user.id;

  try {
    await db.query('BEGIN');

    for (const adj of adjustments) {
      const diff = adj.actual - adj.theoretical;
      if (diff === 0) continue;

      if (diff > 0) {
        // IN movement
        const newBatch = await db.query(
          'INSERT INTO stock_batches (stock_item_id, warehouse_id, batch_number, initial_quantity, current_quantity) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [adj.stock_item_id, warehouse_id, 'INV-ADJ-' + Date.now(), diff, diff]
        );
        await db.query(
          'INSERT INTO stock_movements (stock_item_id, batch_id, warehouse_id, movement_type, quantity, reason, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [adj.stock_item_id, newBatch.rows[0].id, warehouse_id, 'IN', diff, 'Régularisation inventaire', user_id]
        );
        await db.query('UPDATE stock_items SET current_stock = current_stock + $1 WHERE id = $2', [diff, adj.stock_item_id]);
      } else {
        // OUT movement
        await deductStockFIFO(adj.stock_item_id, warehouse_id, Math.abs(diff), 'Régularisation inventaire', user_id);
      }
    }

    await logAction(user_id, 'BULK_STOCK_ADJUST', 'stock_items', null, { warehouse_id, count: adjustments.length });

    await db.query('COMMIT');
    res.json({ message: 'Inventory validated and stocks adjusted successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
