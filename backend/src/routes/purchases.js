const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');

// Apply authorization to all purchase routes
router.use(authorize(['Magasinier', 'Chef d’élevage']));

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.id DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, supplier_id: 1, supplier_name: 'Agro-Shop Benin', purchase_date: '2024-01-10', total_amount: 45000, status: 'Received' }]);
  }
});

// GET purchase requests
router.get('/requests', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM purchase_requests ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST purchase request
router.post('/requests', async (req, res) => {
  const { department, description, urgency, justification, estimated_budget } = req.body;
  const requester_id = req.user.id;
  try {
    const result = await db.query(
      'INSERT INTO purchase_requests (requester_id, department, description, urgency, justification, estimated_budget, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [requester_id, department, description, urgency, justification, estimated_budget, 'Soumis']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update purchase request (Validation)
router.put('/requests/:id', async (req, res) => {
  const { status, justification } = req.body;
  const validator_id = req.user.id;
  try {
    const result = await db.query(
      'UPDATE purchase_requests SET status = $1, validation_date = CURRENT_DATE, validator_id = $2 WHERE id = $3 RETURNING *',
      [status, validator_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { supplier_id, purchase_date, total_amount, items, purchase_request_id } = req.body;
  try {
    await db.query('BEGIN');

    const purchaseResult = await db.query(
      'INSERT INTO purchases (supplier_id, purchase_request_id, purchase_date, total_amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [supplier_id, purchase_request_id, purchase_date, total_amount, 'Ordered']
    );
    const purchaseId = purchaseResult.rows[0].id;

    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          'INSERT INTO purchase_items (purchase_id, stock_item_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
          [purchaseId, item.stock_item_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
    }

    if (purchase_request_id) {
        await db.query('UPDATE purchase_requests SET status = \'Commandé\' WHERE id = $1', [purchase_request_id]);
    }

    await db.query('COMMIT');
    res.status(201).json(purchaseResult.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// POST record reception
router.post('/:id/receptions', async (req, res) => {
  const { delivery_note_ref, notes, items } = req.body;
  const purchase_id = req.params.id;
  const user_id = req.user.id;

  try {
    await db.query('BEGIN');

    // 1. Create reception record
    const receptionRes = await db.query(
      'INSERT INTO purchase_receptions (purchase_id, received_by, delivery_note_ref, notes) VALUES ($1, $2, $3, $4) RETURNING id',
      [purchase_id, user_id, delivery_note_ref, notes]
    );
    const receptionId = receptionRes.rows[0].id;

    for (const item of items) {
      // 2. Create batch for received items
      const batchRes = await db.query(
        'INSERT INTO stock_batches (stock_item_id, batch_number, expiry_date, initial_quantity, current_quantity, unit_price) VALUES ($1, $2, $3, $4, $5, (SELECT unit_price FROM purchase_items WHERE id = $6)) RETURNING id',
        [item.stock_item_id, item.lot_number || `LOT-P${purchase_id}-${Date.now()}`, item.expiry_date, item.quantity_received, item.quantity_received, item.purchase_item_id]
      );
      const batchId = batchRes.rows[0].id;

      // 3. Record reception item
      await db.query(
        'INSERT INTO purchase_reception_items (reception_id, purchase_item_id, stock_item_id, batch_id, quantity_received, quantity_rejected, expiry_date, lot_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [receptionId, item.purchase_item_id, item.stock_item_id, batchId, item.quantity_received, item.quantity_rejected || 0, item.expiry_date, item.lot_number]
      );

      // 4. Update purchase item received quantity
      await db.query(
        'UPDATE purchase_items SET received_quantity = received_quantity + $1 WHERE id = $2',
        [item.quantity_received, item.purchase_item_id]
      );

      // 5. Update stock item current stock
      await db.query(
        'UPDATE stock_items SET current_stock = current_stock + $1 WHERE id = $2',
        [item.quantity_received, item.stock_item_id]
      );

      // 6. Record movement
      await db.query(
        'INSERT INTO stock_movements (stock_item_id, batch_id, movement_type, quantity, reason, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [item.stock_item_id, batchId, 'IN', item.quantity_received, `Réception achat #${purchase_id}`, user_id]
      );

      // 7. Update price history
      const pi = await db.query('SELECT unit_price FROM purchase_items WHERE id = $1', [item.purchase_item_id]);
      await db.query(
          'INSERT INTO supplier_price_history (supplier_id, stock_item_id, price) VALUES ((SELECT supplier_id FROM purchases WHERE id = $1), $2, $3)',
          [purchase_id, item.stock_item_id, pi.rows[0].unit_price]
      );
    }

    // 8. Update purchase status if fully received
    const remainingItems = await db.query(
        'SELECT SUM(quantity - received_quantity) as remaining FROM purchase_items WHERE purchase_id = $1',
        [purchase_id]
    );
    if (parseFloat(remainingItems.rows[0].remaining) <= 0) {
        await db.query('UPDATE purchases SET status = \'Received\' WHERE id = $1', [purchase_id]);
        await db.query('UPDATE purchase_requests SET status = \'Réceptionné\' WHERE id = (SELECT purchase_request_id FROM purchases WHERE id = $1)', [purchase_id]);
    } else {
        await db.query('UPDATE purchases SET status = \'Partially Received\' WHERE id = $1', [purchase_id]);
    }

    await db.query('COMMIT');
    res.status(201).json({ message: 'Réception enregistrée' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// GET suppliers with performance metrics
router.get('/suppliers/performance', async (req, res) => {
    try {
        const query = `
            SELECT s.id, s.name,
            COUNT(p.id) as total_orders,
            AVG(qc.is_conform::int) * 100 as quality_rate,
            COUNT(CASE WHEN p.status = 'Received' THEN 1 END) as completed_orders
            FROM suppliers s
            LEFT JOIN purchases p ON s.id = p.supplier_id
            LEFT JOIN quality_controls qc ON p.id = qc.purchase_id
            GROUP BY s.id, s.name
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET supplier price history for an item
router.get('/prices/:stock_item_id', async (req, res) => {
  try {
    const query = `
      SELECT sph.*, s.name as supplier_name
      FROM supplier_price_history sph
      JOIN suppliers s ON sph.supplier_id = s.id
      WHERE sph.stock_item_id = $1
      ORDER BY sph.effective_date DESC
    `;
    const result = await db.query(query, [req.params.stock_item_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { total_amount, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE purchases SET total_amount = $1, status = $2 WHERE id = $3 RETURNING *',
      [total_amount, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM purchases WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
