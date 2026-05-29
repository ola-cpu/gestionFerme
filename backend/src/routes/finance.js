const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');

// Apply authorization to all finance routes
router.use(authorize(['RH/Comptable']));

// --- BANK ACCOUNTS ---
router.get('/accounts', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM bank_accounts WHERE is_active = TRUE ORDER BY account_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/accounts', async (req, res) => {
  const { account_name, account_type, bank_name, account_number, currency, current_balance } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO bank_accounts (account_name, account_type, bank_name, account_number, currency, current_balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [account_name, account_type, bank_name, account_number, currency, current_balance]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TRANSACTIONS ---
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, b.account_name
      FROM transactions t
      LEFT JOIN bank_accounts b ON t.bank_account_id = b.id
      ORDER BY t.date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { bank_account_id, date, type, category, activity, amount, reference_number, description } = req.body;
  try {
    // Start transaction
    await db.query('BEGIN');

    const result = await db.query(
      'INSERT INTO transactions (bank_account_id, date, type, category, activity, amount, reference_number, description, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [bank_account_id, date, type, category, activity, amount, reference_number, description, req.user.id]
    );

    // Update bank account balance
    const balanceChange = (type === 'ENTRÉE' ? amount : -amount);
    await db.query(
        'UPDATE bank_accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [balanceChange, bank_account_id]
    );

    // If it's an expense, update the corresponding budget
    if (type === 'SORTIE' && activity) {
        await db.query(
            'UPDATE budgets SET spent_amount = spent_amount + $1 WHERE activity = $2 AND period_start <= $3 AND period_end >= $3',
            [amount, activity, date]
        );
    }

    await db.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Start transaction
    await db.query('BEGIN');

    // Get transaction details before deleting for budget and balance update
    const txRes = await db.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    if (txRes.rows.length > 0) {
        const tx = txRes.rows[0];

        // Reverse balance update
        const balanceChange = (tx.type === 'ENTRÉE' ? -tx.amount : tx.amount);
        if (tx.bank_account_id) {
            await db.query(
                'UPDATE bank_accounts SET current_balance = current_balance + $1 WHERE id = $2',
                [balanceChange, tx.bank_account_id]
            );
        }

        // Reverse budget update
        if (tx.type === 'SORTIE' && tx.activity) {
            await db.query(
                'UPDATE budgets SET spent_amount = spent_amount - $1 WHERE activity = $2 AND period_start <= $3 AND period_end >= $3',
                [tx.amount, tx.activity, tx.date]
            );
        }
    }

    await db.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);

    await db.query('COMMIT');
    res.json({ message: 'Deleted' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// --- BUDGETS ---

router.get('/budgets', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM budgets ORDER BY period_start DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/budgets', async (req, res) => {
    const { activity, period_start, period_end, allocated_amount } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO budgets (activity, period_start, period_end, allocated_amount) VALUES ($1, $2, $3, $4) RETURNING *',
            [activity, period_start, period_end, allocated_amount]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DEBTS & RECEIVABLES ---
router.get('/debts-receivables', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM debts_receivables ORDER BY due_date ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/debts-receivables', async (req, res) => {
  const { entity_type, entity_name, type, amount, due_date, description } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO debts_receivables (entity_type, entity_name, type, amount, due_date, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [entity_type, entity_name, type, amount, due_date, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REPORTING ---
router.get('/reports/cashflow', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'ENTRÉE' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'SORTIE' THEN amount ELSE 0 END) as expenses
      FROM transactions
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
