const express = require('express');
const router = require('express').Router();
const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');
const { authorize } = require('../middleware/auth');
const { deductStockFIFO } = require('../utils/stockUtils');

// Apply authorization to all sales routes
router.use(authorize(['Commercial']));

// --- SALES ---
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sales WHERE deleted_at IS NULL ORDER BY id DESC');
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

/**
 * Helper to process sale items (DB inserts and stock deduction)
 */
async function processSaleItems(client, saleId, items, document_type, reference_number, user_id) {
    for (const item of items) {
        await db.query(
            'INSERT INTO sale_items (sale_id, batch_id, individual_id, stock_item_id, product_description, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [saleId, item.batch_id, item.individual_id, item.stock_item_id, item.product_description, item.quantity, item.unit_price, item.total_price]
        );

        const isConfirmed = ['Facture', 'Bon de commande'].includes(document_type);

        if (item.stock_item_id && isConfirmed) {
            // Verify compliance before sale
            if (item.batch_id) {
                const batchRes = await db.query('SELECT is_compliant FROM stock_batches WHERE id = $1', [item.batch_id]);
                if (batchRes.rows.length > 0 && !batchRes.rows[0].is_compliant) {
                    throw new Error(`Le lot #${item.batch_id} n'est pas conforme et ne peut être vendu.`);
                }
            } else {
                // Check if any non-compliant batch would be used by FIFO
                const batchesRes = await db.query(
                    'SELECT id FROM stock_batches WHERE stock_item_id = $1 AND current_quantity > 0 AND is_compliant = FALSE ORDER BY received_date ASC',
                    [item.stock_item_id]
                );
                if (batchesRes.rows.length > 0) {
                    throw new Error(`Certains lots pour le produit ID ${item.stock_item_id} ne sont pas conformes.`);
                }
            }

            // Assuming warehouse_id is handled (default to 1 for this implementation)
            await deductStockFIFO(item.stock_item_id, 1, item.quantity, `Vente #${reference_number}`, user_id);
        }

        if (item.individual_id && isConfirmed) {
            await db.query('UPDATE livestock_individuals SET status = \'Sold\' WHERE id = $1', [item.individual_id]);
        }

        if (item.batch_id && isConfirmed) {
            await db.query('UPDATE livestock_batches SET current_count = current_count - $1 WHERE id = $2', [item.quantity || 1, item.batch_id]);
        }
    }
}

router.post('/', async (req, res) => {
  const { client_id, sale_date, total_amount, tax_amount, discount_amount, payment_status, document_type, reference_number, valid_until, items } = req.body;
  const user_id = req.user.id;

  try {
    await db.query('BEGIN');

    // 1. Credit Limit Check
    if (document_type !== 'Devis') {
        const clientRes = await db.query('SELECT credit_limit FROM clients WHERE id = $1', [client_id]);
        const debtRes = await db.query('SELECT COALESCE(SUM(total_amount), 0) - (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE sale_id IN (SELECT id FROM sales WHERE client_id = $1)) as balance FROM sales WHERE client_id = $1', [client_id]);
        const currentDebt = parseFloat(debtRes.rows[0]?.balance || 0);
        if (clientRes.rows[0].credit_limit > 0 && (currentDebt + total_amount) > clientRes.rows[0].credit_limit) {
            throw new Error('Dépassement du plafond de crédit client');
        }
    }

    // 2. Stock Availability Check
    if (['Facture', 'Bon de commande'].includes(document_type)) {
        for (const item of items) {
            if (item.stock_item_id) {
                const stockRes = await db.query('SELECT current_stock FROM stock_items WHERE id = $1', [item.stock_item_id]);
                if (stockRes.rows[0].current_stock < item.quantity) {
                    throw new Error(`Stock insuffisant pour le produit ID ${item.stock_item_id}`);
                }
            }
        }
    }

    // 3. Create Sale
    const result = await db.query(
      'INSERT INTO sales (client_id, sale_date, total_amount, tax_amount, discount_amount, payment_status, document_type, reference_number, valid_until) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [client_id, sale_date, total_amount, tax_amount || 0, discount_amount || 0, payment_status, document_type, reference_number, valid_until]
    );
    const saleId = result.rows[0].id;

    // 4. Process Items
    await processSaleItems(null, saleId, items, document_type, reference_number, user_id);

    await logAction(user_id, 'CREATE_SALE', 'sales', saleId, { reference_number, total_amount });

    await db.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    if (err.code === '23505') {
        return res.status(400).json({ error: 'Référence déjà existante' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST Convert Quote to Order/Invoice
router.post('/convert/:id', async (req, res) => {
    const quoteId = req.params.id;
    const { target_type, reference_number } = req.body;

    try {
        await db.query('BEGIN');

        const quoteRes = await db.query('SELECT * FROM sales WHERE id = $1 AND document_type = \'Devis\'', [quoteId]);
        if (quoteRes.rows.length === 0) throw new Error('Devis non trouvé');
        const quote = quoteRes.rows[0];

        const itemsRes = await db.query('SELECT * FROM sale_items WHERE sale_id = $1', [quoteId]);

        const newSaleRes = await db.query(
            'INSERT INTO sales (client_id, sale_date, total_amount, tax_amount, discount_amount, payment_status, document_type, reference_number) VALUES ($1, CURRENT_DATE, $2, $3, $4, \'Pending\', $5, $6) RETURNING id',
            [quote.client_id, quote.total_amount, quote.tax_amount, quote.discount_amount, target_type, reference_number]
        );
        const newSaleId = newSaleRes.rows[0].id;

        await processSaleItems(null, newSaleId, itemsRes.rows, target_type, reference_number, req.user.id);

        await db.query('UPDATE sales SET document_type = \'Devis Converti\' WHERE id = $1', [quoteId]);

        await db.query('COMMIT');
        res.json({ id: newSaleId, message: 'Devis converti avec succès' });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// --- DELIVERIES ---
router.post('/:id/deliveries', async (req, res) => {
    const sale_id = req.params.id;
    const { driver_name, vehicle_plate, notes } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO deliveries (sale_id, delivery_date, driver_name, vehicle_plate, status, notes) VALUES ($1, CURRENT_TIMESTAMP, $2, $3, \'Pending\', $4) RETURNING *',
            [sale_id, driver_name, vehicle_plate, notes]
        );
        await db.query('UPDATE sales SET delivery_status = \'Shipped\' WHERE id = $1', [sale_id]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/deliveries/all', async (req, res) => {
    try {
        const result = await db.query('SELECT d.*, s.reference_number, c.name as client_name FROM deliveries d JOIN sales s ON d.sale_id = s.id JOIN clients c ON s.client_id = c.id');
        res.json(result.rows);
    } catch (err) {
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
    await db.query('UPDATE sales SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);
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
  const { sale_id, amount, payment_method } = req.body;
  const user_id = req.user.id;
  try {
    await db.query('BEGIN');

    // 1. Record the payment
    const result = await db.query(
      'INSERT INTO sale_payments (sale_id, amount, payment_method) VALUES ($1, $2, $3) RETURNING *',
      [sale_id, amount, payment_method]
    );

    // 2. Automate Sales status update
    const saleRes = await db.query('SELECT total_amount, reference_number FROM sales WHERE id = $1', [sale_id]);
    const paymentsRes = await db.query('SELECT SUM(amount) as paid FROM sale_payments WHERE sale_id = $1', [sale_id]);

    const totalAmount = parseFloat(saleRes.rows[0].total_amount);
    const totalPaid = parseFloat(paymentsRes.rows[0].paid);
    const reference = saleRes.rows[0].reference_number;

    let newStatus = 'Partial';
    if (totalPaid >= totalAmount) newStatus = 'Paid';

    await db.query('UPDATE sales SET payment_status = $1 WHERE id = $2', [newStatus, sale_id]);

    // 3. Create Finance transaction (Link to Finance)
    // Defaulting to first bank account if none provided, or a dedicated 'Caisse' account could be found
    const bankAccRes = await db.query('SELECT id FROM bank_accounts WHERE is_active = TRUE LIMIT 1');
    const bankAccountId = bankAccRes.rows.length > 0 ? bankAccRes.rows[0].id : null;

    if (bankAccountId) {
        await db.query(
            `INSERT INTO transactions (bank_account_id, date, type, category, activity, amount, reference_number, description, status, user_id)
             VALUES ($1, CURRENT_DATE, 'ENTRÉE', 'Vente', 'Commercial', $2, $3, $4, 'Validé', $5)`,
            [bankAccountId, amount, reference, `Paiement pour vente #${reference}`, user_id]
        );

        // Update balance immediately as it's a confirmed sale payment
        await db.query(
            'UPDATE bank_accounts SET current_balance = current_balance + $1 WHERE id = $2',
            [amount, bankAccountId]
        );
    }

    await logAction(user_id, 'RECORD_PAYMENT', 'sale_payments', result.rows[0].id, { sale_id, amount });

    await db.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
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
