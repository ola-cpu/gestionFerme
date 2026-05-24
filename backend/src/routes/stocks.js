const express = require('express');
const router = express.Router();

// Mock data
const stockItems = [
  { id: 1, category: 'Aliments', name: 'Maïs Concassé', unit: 'kg', stock: 500, min: 100 },
  { id: 2, category: 'Santé', name: 'Vaccin Newcastle', unit: 'flacon', stock: 15, min: 5 },
  { id: 3, category: 'Intrants', name: 'Engrais NPK', unit: 'sac', stock: 20, min: 10 }
];

// GET /api/stocks
router.get('/', (req, res) => {
  res.json(stockItems);
});

module.exports = router;
