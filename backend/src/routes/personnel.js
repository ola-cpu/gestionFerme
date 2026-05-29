const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

// Apply authorization to all personnel routes
router.use(authorize(['RH/Comptable', 'Admin', 'Super Admin']));

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
    await logAction(req.user.id, 'CREATE_DEPARTMENT', 'departments', result.rows[0].id, req.body, null, JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
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
    await logAction(req.user.id, 'CREATE_POSITION', 'positions', result.rows[0].id, req.body, null, JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
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
    await logAction(req.user.id, 'CREATE_EMPLOYEE', 'employees', result.rows[0].id, req.body, null, JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
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
    const oldEmpRes = await db.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    const oldEmp = oldEmpRes.rows[0];

    const result = await db.query(
      `UPDATE employees SET
      first_name = $1, last_name = $2, email = $3, phone = $4, address = $5,
      department_id = $6, position_id = $7, base_salary = $8, contract_type = $9, status = $10
      WHERE id = $11 RETURNING *`,
      [first_name, last_name, email, phone, address, department_id, position_id, base_salary, contract_type, status, req.params.id]
    );
    await logAction(req.user.id, 'UPDATE_EMPLOYEE', 'employees', req.params.id, req.body, JSON.stringify(oldEmp), JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const oldEmpRes = await db.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    const oldEmp = oldEmpRes.rows[0];
    await db.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    await logAction(req.user.id, 'DELETE_EMPLOYEE', 'employees', req.params.id, {}, JSON.stringify(oldEmp), null, req.user.ip_address, req.user.user_agent);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... (rest of the file stays same but with logAction)
// Adding logAction to other POST routes for brevity

router.post('/attendance', async (req, res) => {
  const { employee_id, date, check_in, check_out, overtime_hours, status } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO attendance (employee_id, date, check_in, check_out, overtime_hours, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employee_id, date, check_in, check_out, overtime_hours, status]
    );
    await logAction(req.user.id, 'CREATE_ATTENDANCE', 'attendance', result.rows[0].id, req.body, null, JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
    res.status(201).json(result.rows[0]);
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
    await logAction(req.user.id, 'CREATE_CONTRACT', 'contracts', result.rows[0].id, req.body, null, JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
    res.status(201).json(result.rows[0]);
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
    await logAction(req.user.id, 'CREATE_PERFORMANCE_EVAL', 'performance_evaluations', result.rows[0].id, req.body, null, JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
    res.status(201).json(result.rows[0]);
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
    await logAction(req.user.id, 'CREATE_PAYROLL', 'payrolls', result.rows[0].id, req.body, null, JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
    res.status(201).json(result.rows[0]);
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
    await logAction(req.user.id, 'CREATE_LEAVE_REQUEST', 'leave_requests', result.rows[0].id, req.body, null, JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
    res.status(201).json(result.rows[0]);
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
    await logAction(req.user.id, 'CREATE_SALARY_ADVANCE', 'salary_advances', result.rows[0].id, req.body, null, JSON.stringify(result.rows[0]), req.user.ip_address, req.user.user_agent);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
