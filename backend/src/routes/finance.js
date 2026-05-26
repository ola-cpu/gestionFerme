const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');

// Apply authorization to all finance routes
router.use(authorize(['RH/Comptable']));

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM transactions ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, date: '2024-02-15', type: 'IN', category: 'Vente', amount: 50000, description: 'Vente Oeufs' }]);
  }
});

router.post('/', async (req, res) => {
  const { date, type, category, activity, source, amount, description } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO transactions (date, type, category, activity, source, amount, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [date, type, category, activity, source, amount, description]
    );

    // If it's an expense, update the corresponding budget
    if (type === 'OUT' && activity) {
        await db.query(
            'UPDATE budgets SET spent_amount = spent_amount + $1 WHERE activity = $2 AND period_start <= $3 AND period_end >= $3',
            [amount, activity, date]
        );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Get transaction details before deleting for budget update
    const txRes = await db.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    if (txRes.rows.length > 0) {
        const tx = txRes.rows[0];
        if (tx.type === 'OUT' && tx.activity) {
            await db.query(
                'UPDATE budgets SET spent_amount = spent_amount - $1 WHERE activity = $2 AND period_start <= $3 AND period_end >= $3',
                [tx.amount, tx.activity, tx.date]
            );
        }
    }
    await db.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BUDGETS ---

router.get('/budgets', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM budgets ORDER BY period_start DESC');
        res.json(result.rows);
    } catch (err) {
        res.json([{ id: 1, activity: 'Élevage', period_start: '2024-01-01', period_end: '2024-03-31', allocated_amount: 1000000, spent_amount: 450000 }]);
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

module.exports = router;
