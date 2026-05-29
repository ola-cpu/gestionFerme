const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

// Roles Management
router.get('/roles', authorize(['Admin', 'Super Admin']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/roles/:id/permissions', authorize(['Admin', 'Super Admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/roles/:id/permissions', authorize(['Super Admin']), async (req, res) => {
  const { permissionIds } = req.body;
  const roleId = req.params.id;

  try {
    await db.query('BEGIN');

    // Get old permissions for audit
    const oldPermsRes = await db.query('SELECT permission_id FROM role_permissions WHERE role_id = $1', [roleId]);
    const oldPerms = oldPermsRes.rows.map(r => r.permission_id).join(',');

    await db.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

    if (permissionIds && permissionIds.length > 0) {
      const values = permissionIds.map(pId => `(${roleId}, ${pId})`).join(',');
      await db.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`);
    }

    const newPerms = permissionIds.join(',');
    await logAction(req.user.id, 'UPDATE_ROLE_PERMISSIONS', 'role_permissions', roleId, { permissionIds }, oldPerms, newPerms, req.user.ip_address, req.user.user_agent);

    await db.query('COMMIT');
    res.json({ message: 'Permissions updated' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// Permissions List
router.get('/permissions', authorize(['Admin', 'Super Admin']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM permissions ORDER BY module, action');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users Management
router.get('/', authorize(['Admin', 'Super Admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.role_id, u.employee_id, u.is_active, u.suspended_at, u.last_login_at, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authorize(['Admin', 'Super Admin']), async (req, res) => {
  const { username, password, first_name, last_name, email, role_id, employee_id } = req.body;
  const password_hash = password;

  try {
    const result = await db.query(
      'INSERT INTO users (username, password_hash, first_name, last_name, email, role_id, employee_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username',
      [username, password_hash, first_name, last_name, email, role_id, employee_id]
    );

    await logAction(req.user.id, 'CREATE_USER', 'users', result.rows[0].id, { username, role_id }, null, JSON.stringify({username, first_name, last_name, email, role_id, employee_id}), req.user.ip_address, req.user.user_agent);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authorize(['Admin', 'Super Admin']), async (req, res) => {
  const { first_name, last_name, email, role_id, employee_id, is_active } = req.body;
  try {
    const oldUserRes = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const oldUser = oldUserRes.rows[0];

    const result = await db.query(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3, role_id = $4, employee_id = $5, is_active = $6 WHERE id = $7 RETURNING id, username',
      [first_name, last_name, email, role_id, employee_id, is_active, req.params.id]
    );

    await logAction(req.user.id, 'UPDATE_USER', 'users', req.params.id, req.body, JSON.stringify(oldUser), JSON.stringify(req.body), req.user.ip_address, req.user.user_agent);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/suspend', authorize(['Admin', 'Super Admin']), async (req, res) => {
  const { suspend } = req.body;
  const suspended_at = suspend ? new Date() : null;
  try {
    const oldUserRes = await db.query('SELECT suspended_at FROM users WHERE id = $1', [req.params.id]);
    const oldSuspended = oldUserRes.rows[0].suspended_at;

    await db.query('UPDATE users SET suspended_at = $1 WHERE id = $2', [suspended_at, req.params.id]);
    await logAction(req.user.id, suspend ? 'SUSPEND_USER' : 'UNSUSPEND_USER', 'users', req.params.id, {}, oldSuspended, suspended_at, req.user.ip_address, req.user.user_agent);
    res.json({ message: suspend ? 'User suspended' : 'User unsuspended' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reset-password', authorize(['Admin', 'Super Admin']), async (req, res) => {
  const { newPassword } = req.body;
  try {
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPassword, req.params.id]);
    await logAction(req.user.id, 'RESET_PASSWORD', 'users', req.params.id, {}, 'REDACTED', 'REDACTED', req.user.ip_address, req.user.user_agent);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
