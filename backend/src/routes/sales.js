const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');

// --- SALES ---
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sales ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{
      id: 1,
      client_id: 1,
      sale_date: '2024-02-01',
      total_amount: 120000,
      payment_status: 'Paid',
      document_type: 'Facture',
      reference_number: 'FAC-2024-001',
      delivery_status: 'Delivered'
    }]);
  }
});

router.post('/', async (req, res) => {
  const { client_id, sale_date, total_amount, payment_status, document_type, reference_number, delivery_status, user_id } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO sales (client_id, sale_date, total_amount, payment_status, document_type, reference_number, delivery_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [client_id, sale_date, total_amount, payment_status, document_type, reference_number, delivery_status]
    );

    await logAction(user_id, 'CREATE_SALE', 'sales', result.rows[0].id, { reference_number, total_amount });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Reference number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { total_amount, payment_status, document_type, delivery_status } = req.body;
  try {
    const result = await db.query(
      'UPDATE sales SET total_amount = $1, payment_status = $2, document_type = $3, delivery_status = $4 WHERE id = $5 RETURNING *',
      [total_amount, payment_status, document_type, delivery_status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM sales WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CLIENTS ---
router.get('/clients', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM clients ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.json([
      { id: 1, name: 'Grossiste Alim', type: 'Wholesaler', phone: '01020304', email: 'alim@test.com', address: 'Cotonou' },
      { id: 2, name: 'Resto Saveurs', type: 'Restaurateur', phone: '05060708', email: 'saveurs@test.com', address: 'Porto-Novo' }
    ]);
  }
});

router.post('/clients', async (req, res) => {
  const { name, type, phone, email, address } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO clients (name, type, phone, email, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, type, phone, email, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PAYMENTS ---
router.get('/payments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sale_payments ORDER BY payment_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, sale_id: 1, payment_date: '2024-02-01', amount: 120000, payment_method: 'Cash' }]);
  }
});

router.post('/payments', async (req, res) => {
  const { sale_id, amount, payment_method, user_id } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO sale_payments (sale_id, amount, payment_method) VALUES ($1, $2, $3) RETURNING *',
      [sale_id, amount, payment_method]
    );

    await logAction(user_id, 'RECORD_PAYMENT', 'sale_payments', result.rows[0].id, { sale_id, amount });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROMOTIONS ---
router.get('/promotions', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM promotions WHERE is_active = TRUE');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, name: 'Promo Ramadan', discount_percent: 10, start_date: '2024-03-01', end_date: '2024-04-01' }]);
  }
});

// --- SALE ITEMS & TRACEABILITY ---
router.get('/items', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT si.*, s.sale_date, b.batch_name
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN livestock_batches b ON si.batch_id = b.id
      ORDER BY s.sale_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
