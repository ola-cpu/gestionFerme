const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');

// Apply authorization to all personnel routes
router.use(authorize(['RH/Comptable']));

// --- EMPLOYEES ---
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM employees ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([
      { id: 1, first_name: 'Koffi', last_name: 'Mensah', position: 'Chef d’élevage', base_salary: 150000, contract_type: 'Permanent' },
      { id: 2, first_name: 'Amina', last_name: 'Salami', position: 'Vétérinaire', base_salary: 200000, contract_type: 'Permanent' }
    ]);
  }
});

router.post('/', async (req, res) => {
  const { first_name, last_name, position, hire_date, base_salary, contract_type } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO employees (first_name, last_name, position, hire_date, base_salary, contract_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [first_name, last_name, position, hire_date, base_salary, contract_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { position, base_salary, contract_type, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE employees SET position = $1, base_salary = $2, contract_type = $3, status = $4 WHERE id = $5 RETURNING *',
      [position, base_salary, contract_type, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ATTENDANCE (Pointage) ---
router.get('/attendance', async (req, res) => {
  try {
    const result = await db.query('SELECT a.*, e.last_name FROM attendance a JOIN employees e ON a.employee_id = e.id ORDER BY a.date DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, employee_id: 1, last_name: 'Mensah', date: '2024-02-15', check_in: '08:00', check_out: '17:00', status: 'Present' }]);
  }
});

router.post('/attendance', async (req, res) => {
  const { employee_id, date, check_in, check_out, overtime_hours, status } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO attendance (employee_id, date, check_in, check_out, overtime_hours, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employee_id, date, check_in, check_out, overtime_hours, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PAYROLL (Paie) ---
router.get('/payrolls', async (req, res) => {
  try {
    const result = await db.query('SELECT p.*, e.last_name FROM payrolls p JOIN employees e ON p.employee_id = e.id ORDER BY p.year DESC, p.month DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, employee_id: 1, last_name: 'Mensah', month: 2, year: 2024, base_salary_paid: 150000, net_salary: 150000 }]);
  }
});

router.post('/payrolls', async (req, res) => {
  const { employee_id, month, year, base_salary_paid, bonuses, deductions, net_salary } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO payrolls (employee_id, month, year, base_salary_paid, bonuses, deductions, net_salary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [employee_id, month, year, base_salary_paid, bonuses, deductions, net_salary]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SCHEDULES (Planning) ---
router.get('/schedules', async (req, res) => {
  try {
    const result = await db.query('SELECT s.*, e.last_name FROM work_schedules s JOIN employees e ON s.employee_id = e.id ORDER BY s.date DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, employee_id: 1, last_name: 'Mensah', date: '2024-02-16', shift: 'Morning', tasks: 'Feeding and cleaning' }]);
  }
});

module.exports = router;
