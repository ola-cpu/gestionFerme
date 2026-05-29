const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');

router.use(authorize(['Admin', 'Chef d’élevage', 'Magasinier', 'RH/Comptable', 'Commercial']));

router.get('/:entity_type/:entity_id', async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const result = await db.query(
      'SELECT * FROM documents WHERE entity_type = $1 AND entity_id = $2 AND deleted_at IS NULL ORDER BY uploaded_at DESC',
      [entity_type, entity_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { file_url, file_name, document_type, entity_type, entity_id, notes } = req.body;
  const uploaded_by = req.user.id;
  try {
    const result = await db.query(
      'INSERT INTO documents (file_url, file_name, document_type, entity_type, entity_id, uploaded_by, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [file_url, file_name, document_type, entity_type, entity_id, uploaded_by, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);
    res.json({ message: 'Document supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
