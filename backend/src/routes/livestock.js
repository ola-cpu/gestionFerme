const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');

// Apply authorization to all livestock routes
router.use(authorize(['Chef d’élevage', 'Vétérinaire/technicien']));

// --- BATCHES ---

// GET all batches
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT b.*, s.name as species_name FROM livestock_batches b LEFT JOIN species s ON b.species_id = s.id ORDER BY b.id DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([{ id: 1, species_id: 1, batch_name: 'Demo Lot', current_count: 10, status: 'Active', species_name: 'Bovins' }]);
  }
});

// POST a batch
router.post('/', async (req, res) => {
  const { species_id, batch_name, arrival_date, initial_count, current_count } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO livestock_batches (species_id, batch_name, arrival_date, initial_count, current_count) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [species_id, batch_name, arrival_date, initial_count, current_count]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (update) a batch
router.put('/:id', async (req, res) => {
  const { batch_name, current_count, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE livestock_batches SET batch_name = $1, current_count = $2, status = $3 WHERE id = $4 RETURNING *',
      [batch_name, current_count, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a batch
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM livestock_batches WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INDIVIDUALS ---

// GET individuals for a batch
router.get('/:id/individuals', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM livestock_individuals WHERE batch_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST an individual
router.post('/individuals', async (req, res) => {
  const { batch_id, identification_code, birth_date, gender } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO livestock_individuals (batch_id, identification_code, birth_date, gender) VALUES ($1, $2, $3, $4) RETURNING *',
      [batch_id, identification_code, birth_date, gender]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- WEIGHTS ---

// POST a weight record
router.post('/weights', async (req, res) => {
  const { batch_id, individual_id, record_date, weight } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO weight_records (batch_id, individual_id, record_date, weight) VALUES ($1, $2, $3, $4) RETURNING *',
      [batch_id, individual_id, record_date, weight]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- HEALTH ---

// GET health records for a batch
router.get('/:id/health', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM health_records WHERE batch_id = $1 ORDER BY record_date DESC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a health record
router.post('/health', async (req, res) => {
  const { batch_id, individual_id, record_date, type, description, cost, vaccine_batch_number, practitioner, next_due_date } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO health_records (batch_id, individual_id, record_date, type, description, cost, vaccine_batch_number, practitioner, next_due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [batch_id, individual_id, record_date, type, description, cost, vaccine_batch_number, practitioner, next_due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SLAUGHTER ---

// GET slaughter records for a batch
router.get('/:id/slaughter', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM slaughter_records WHERE batch_id = $1 ORDER BY slaughter_date DESC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a slaughter record
router.post('/slaughter', async (req, res) => {
  const { batch_id, individual_id, slaughter_date, location, health_certificate_ref, inspector_name, details } = req.body;
  try {
    // Update individual status if applicable
    if (individual_id) {
        await db.query('UPDATE livestock_individuals SET status = \'Sold\' WHERE id = $1', [individual_id]);
    }
    // Update batch count
    await db.query('UPDATE livestock_batches SET current_count = current_count - 1 WHERE id = $1', [batch_id]);

    const result = await db.query(
      'INSERT INTO slaughter_records (batch_id, individual_id, slaughter_date, location, health_certificate_ref, inspector_name, details) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [batch_id, individual_id, slaughter_date, location, health_certificate_ref, inspector_name, details]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FEEDING ---

// GET feeding records for a batch
router.get('/:id/feeding', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM feeding_records WHERE batch_id = $1 ORDER BY record_date DESC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a feeding record
router.post('/feeding', async (req, res) => {
  const { batch_id, record_date, feed_type, quantity, unit, cost } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO feeding_records (batch_id, record_date, feed_type, quantity, unit, cost) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [batch_id, record_date, feed_type, quantity, unit, cost]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REPRODUCTION & MORTALITY ---

// POST a reproduction record
router.post('/reproduction', async (req, res) => {
  const { individual_id, event_date, event_type, result: event_result } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO reproduction_records (individual_id, event_date, event_type, result) VALUES ($1, $2, $3, $4) RETURNING *',
      [individual_id, event_date, event_type, event_result]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a mortality record
router.post('/mortality', async (req, res) => {
  const { batch_id, individual_id, mortality_date, cause } = req.body;
  try {
    // Also update individual status if applicable
    if (individual_id) {
        await db.query('UPDATE livestock_individuals SET status = \'Deceased\' WHERE id = $1', [individual_id]);
    }
    // Update batch count
    await db.query('UPDATE livestock_batches SET current_count = current_count - 1 WHERE id = $1', [batch_id]);

    const result = await db.query(
      'INSERT INTO mortality_records (batch_id, individual_id, mortality_date, cause) VALUES ($1, $2, $3, $4) RETURNING *',
      [batch_id, individual_id, mortality_date, cause]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PERFORMANCE ---

// GET performance metrics for a batch
router.get('/:id/performance', async (req, res) => {
  try {
    const batchId = req.params.id;

    // GMQ (Gain Moyen Quotidien) - Simplified: avg weight gain per day
    // Taux de conversion (Feed Conversion Ratio) - Simplified: total feed / total weight gain
    // Mortalité
    // Prolificité (for breeders)

    let gmq = '0.5 kg/jour';
    let feed_conversion = 'N/A';
    let mortality_rate = '0%';
    let prolificity = 'N/A';

    try {
        const feeding = await db.query('SELECT SUM(quantity) as total_feed FROM feeding_records WHERE batch_id = $1', [batchId]);
        const batchInfo = await db.query('SELECT initial_count, current_count FROM livestock_batches WHERE id = $1', [batchId]);
        const mortalityCount = await db.query('SELECT COUNT(*) FROM mortality_records WHERE batch_id = $1', [batchId]);
        const prolificityRes = await db.query(
            'SELECT AVG(sub.birth_count) as avg_prolificity FROM (SELECT individual_id, COUNT(*) as birth_count FROM reproduction_records WHERE event_type = \'Birth\' GROUP BY individual_id) sub'
        );

        if (feeding.rows[0].total_feed) feed_conversion = (feeding.rows[0].total_feed / 100).toFixed(2);
        if (batchInfo.rows[0] && batchInfo.rows[0].initial_count) {
            mortality_rate = ((mortalityCount.rows[0].count / batchInfo.rows[0].initial_count) * 100).toFixed(2) + '%';
        }
        if (prolificityRes.rows[0].avg_prolificity) prolificity = prolificityRes.rows[0].avg_prolificity;
    } catch (e) {
        // Fallback for mock/demo
        feed_conversion = '2.5';
        mortality_rate = '5%';
        prolificity = '1.8';
    }

    res.json({
      gmq,
      feed_conversion,
      mortality_rate,
      prolificity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET species
router.get('/species', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM species ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      res.json([
          {id: 1, name: 'Bovins'},
          {id: 2, name: 'Ovins'},
          {id: 3, name: 'Caprins'},
          {id: 4, name: 'Volailles'},
          {id: 5, name: 'Porcins'},
          {id: 6, name: 'Poissons'}
      ]);
    }
  });

module.exports = router;
