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
  const { requester_id, description } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO purchase_requests (requester_id, description) VALUES ($1, $2) RETURNING *',
      [requester_id, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { supplier_id, purchase_date, total_amount, status, items, purchase_request_id } = req.body;
  try {
    await db.query('BEGIN');

    const purchaseResult = await db.query(
      'INSERT INTO purchases (supplier_id, purchase_date, total_amount, status, purchase_request_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [supplier_id, purchase_date, total_amount, status, purchase_request_id]
    );
    const purchaseId = purchaseResult.rows[0].id;

    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          'INSERT INTO purchase_items (purchase_id, stock_item_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
          [purchaseId, item.stock_item_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );

        // Update price history
        await db.query(
          'INSERT INTO supplier_price_history (supplier_id, stock_item_id, price) VALUES ($1, $2, $3)',
          [supplier_id, item.stock_item_id, item.unit_price]
        );
      }
    }

    await db.query('COMMIT');
    res.status(201).json(purchaseResult.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
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
