const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');

// Apply authorization to all personnel routes
router.use(authorize(['RH/Comptable']));

// --- DEPARTMENTS ---
router.get('/departments', async (req, res) => {
  try {
    const result = await db.query('SELECT d.*, e.last_name as manager_name FROM departments d LEFT JOIN employees e ON d.manager_id = e.id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/departments', async (req, res) => {
  const { name, description, manager_id } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO departments (name, description, manager_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, manager_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POSITIONS ---
router.get('/positions', async (req, res) => {
  try {
    const result = await db.query('SELECT p.*, d.name as department_name FROM positions p JOIN departments d ON p.department_id = d.id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/positions', async (req, res) => {
  const { department_id, title, description, hierarchy_level, required_skills } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO positions (department_id, title, description, hierarchy_level, required_skills) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [department_id, title, description, hierarchy_level, required_skills]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMPLOYEES ---
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, d.name as department_name, p.title as position_title
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      ORDER BY e.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const {
    matricule, first_name, last_name, email, phone, address,
    department_id, position_id, hire_date, base_salary, contract_type, payment_frequency
  } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO employees
      (matricule, first_name, last_name, email, phone, address, department_id, position_id, hire_date, base_salary, contract_type, payment_frequency)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [matricule, first_name, last_name, email, phone, address, department_id, position_id, hire_date, base_salary, contract_type, payment_frequency]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const {
    first_name, last_name, email, phone, address,
    department_id, position_id, base_salary, contract_type, status
  } = req.body;
  try {
    const result = await db.query(
      `UPDATE employees SET
      first_name = $1, last_name = $2, email = $3, phone = $4, address = $5,
      department_id = $6, position_id = $7, base_salary = $8, contract_type = $9, status = $10
      WHERE id = $11 RETURNING *`,
      [first_name, last_name, email, phone, address, department_id, position_id, base_salary, contract_type, status, req.params.id]
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
    res.status(500).json({ error: err.message });
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

// --- CONTRACTS ---
router.get('/contracts', async (req, res) => {
  try {
    const result = await db.query('SELECT c.*, e.last_name FROM contracts c JOIN employees e ON c.employee_id = e.id ORDER BY c.start_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contracts', async (req, res) => {
  const { employee_id, contract_type, start_date, end_date, salary, auto_renewal, notes } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO contracts (employee_id, contract_type, start_date, end_date, salary, auto_renewal, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [employee_id, contract_type, start_date, end_date, salary, auto_renewal, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PERFORMANCE ---
router.get('/performance', async (req, res) => {
  try {
    const result = await db.query('SELECT p.*, e.last_name FROM performance_evaluations p JOIN employees e ON p.employee_id = e.id ORDER BY p.evaluation_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/performance', async (req, res) => {
  const { employee_id, evaluator_id, score, productivity_rating, comments, goals } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO performance_evaluations (employee_id, evaluator_id, score, productivity_rating, comments, goals) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employee_id, evaluator_id, score, productivity_rating, comments, goals]
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// --- LEAVES ---
router.get('/leaves', async (req, res) => {
  try {
    const result = await db.query('SELECT l.*, e.last_name FROM leave_requests l JOIN employees e ON l.employee_id = e.id ORDER BY l.start_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/leaves', async (req, res) => {
  const { employee_id, leave_type, start_date, end_date, reason } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [employee_id, leave_type, start_date, end_date, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADVANCES ---
router.get('/advances', async (req, res) => {
  try {
    const result = await db.query('SELECT a.*, e.last_name FROM salary_advances a JOIN employees e ON a.employee_id = e.id ORDER BY a.request_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/advances', async (req, res) => {
  const { employee_id, amount, repayment_start_month, repayment_start_year, repayment_months, notes } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO salary_advances (employee_id, amount, repayment_start_month, repayment_start_year, repayment_months, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employee_id, amount, repayment_start_month, repayment_start_year, repayment_months, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
