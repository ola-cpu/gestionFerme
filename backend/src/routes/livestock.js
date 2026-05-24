const express = require('express');
const router = express.Router();

// Mock data for demonstration
const batches = [
  { id: 1, species: 'Bovins', name: 'Lot A1', count: 10, status: 'Active' },
  { id: 2, species: 'Volailles', name: 'Poulets Chair', count: 500, status: 'Active' }
];

// GET /api/livestock/batches
router.get('/batches', (req, res) => {
  res.json(batches);
});

// POST /api/livestock/batches
router.post('/batches', (req, res) => {
  const newBatch = { id: batches.length + 1, ...req.body };
  batches.push(newBatch);
  res.status(201).json(newBatch);
});

module.exports = router;
