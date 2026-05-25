const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM employees ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, first_name: 'Koffi', last_name: 'Mensah', position: 'Chef d’élevage', base_salary: 150000 }]);
  }
});

router.post('/', async (req, res) => {
  const { first_name, last_name, position, hire_date, base_salary } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO employees (first_name, last_name, position, hire_date, base_salary) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [first_name, last_name, position, hire_date, base_salary]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { position, base_salary } = req.body;
  try {
    const result = await db.query(
      'UPDATE employees SET position = $1, base_salary = $2 WHERE id = $3 RETURNING *',
      [position, base_salary, req.params.id]
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

module.exports = router;
