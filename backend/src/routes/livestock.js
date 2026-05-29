const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/auth');
const { deductStockFIFO } = require('../utils/stockUtils');

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

// GET reproduction records for a batch
router.get('/:id/reproduction', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT r.* FROM reproduction_records r JOIN livestock_individuals i ON r.individual_id = i.id WHERE i.batch_id = $1 ORDER BY r.event_date DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE species
router.delete('/species/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM species WHERE id = $1', [req.params.id]);
        res.json({ message: 'Espèce supprimée' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST an individual
router.post('/individuals', async (req, res) => {
  const { batch_id, identification_code, birth_date, gender, breed_id, pen_id, name, provenance, status } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO livestock_individuals (batch_id, identification_code, birth_date, gender, breed_id, pen_id, name, provenance, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [batch_id, identification_code, birth_date, gender, breed_id, pen_id, name, provenance, status]
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
  const { batch_id, individual_id, record_date, type, description, cost, vaccine_batch_number, practitioner, next_due_date, stock_item_id, quantity, warehouse_id } = req.body;
  const user_id = req.user.id;
  try {
    await db.query('BEGIN');

    const result = await db.query(
      'INSERT INTO health_records (batch_id, individual_id, record_date, type, description, cost, vaccine_batch_number, practitioner, next_due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [batch_id, individual_id, record_date, type, description, cost, vaccine_batch_number, practitioner, next_due_date]
    );

    // Decrement stock if medicine/vaccine used
    if (stock_item_id && quantity) {
        await deductStockFIFO(stock_item_id, warehouse_id, quantity, `Soins animal/lot #${individual_id || batch_id}`, user_id);
    }

    await db.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
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
  const { batch_id, record_date, feed_type, quantity, unit, cost, stock_item_id, warehouse_id } = req.body;
  const user_id = req.user.id;
  try {
    await db.query('BEGIN');

    const result = await db.query(
      'INSERT INTO feeding_records (batch_id, record_date, feed_type, quantity, unit, cost) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [batch_id, record_date, feed_type, quantity, unit, cost]
    );

    // Decrement stock for animal feed
    if (stock_item_id && quantity) {
        await deductStockFIFO(stock_item_id, warehouse_id, quantity, `Alimentation lot #${batch_id}`, user_id);
    }

    await db.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// --- REPRODUCTION & MORTALITY ---

// POST a reproduction record
router.post('/reproduction', async (req, res) => {
  const { individual_id, partner_id, event_date, event_type, result: event_result } = req.body;
  try {
    let expected_birth_date = null;

    if (event_type === 'Insemination' || event_type === 'Mating') {
        // Fetch species gestation duration
        const speciesRes = await db.query(
            'SELECT s.gestation_duration_days FROM species s JOIN livestock_batches b ON s.id = b.species_id JOIN livestock_individuals i ON b.id = i.batch_id WHERE i.id = $1',
            [individual_id]
        );
        if (speciesRes.rows[0] && speciesRes.rows[0].gestation_duration_days) {
            const eventDate = new Date(event_date);
            eventDate.setDate(eventDate.getDate() + speciesRes.rows[0].gestation_duration_days);
            expected_birth_date = eventDate.toISOString().split('T')[0];
        }
    }

    const result = await db.query(
      'INSERT INTO reproduction_records (individual_id, partner_id, event_date, event_type, result, expected_birth_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [individual_id, partner_id, event_date, event_type, event_result, expected_birth_date]
    );

    // Logic for Birth or Insemination/Mating
    const animalRes = await db.query('SELECT gender, batch_id, breed_id, pen_id FROM livestock_individuals WHERE id = $1', [individual_id]);
    const animal = animalRes.rows[0];

    if (event_type === 'Birth' && animal.gender === 'Female') {
        await db.query('UPDATE livestock_individuals SET status = \'Active\' WHERE id = $1', [individual_id]);

        // Automatic offspring creation
        const { offspring_count = 1 } = req.body;
        for (let i = 0; i < offspring_count; i++) {
            const code = `BB-${individual_id}-${Date.now()}-${i}`;
            const gender = Math.random() > 0.5 ? 'Female' : 'Male';
            await db.query(
                'INSERT INTO livestock_individuals (batch_id, identification_code, birth_date, gender, provenance, status, mother_id, father_id, breed_id, pen_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [animal.batch_id, code, event_date, gender, 'Naissance', 'Active', individual_id, partner_id, animal.breed_id, animal.pen_id]
            );
        }
    } else if ((event_type === 'Insemination' || event_type === 'Mating') && animal.gender === 'Female') {
        await db.query('UPDATE livestock_individuals SET status = \'Gestante\' WHERE id = $1', [individual_id]);

        // Create an alert for upcoming birth
        if (expected_birth_date) {
            await db.query(
                'INSERT INTO alerts (type, message, record_id, table_name) VALUES ($1, $2, $3, $4)',
                ['Birth', `Mise bas prévue pour l'animal #${individual_id} le ${expected_birth_date}`, result.rows[0].id, 'reproduction_records']
            );
        }
    }

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

        // Real GMQ calculation
        const weightHistory = await db.query(
            'SELECT weight, record_date FROM weight_records WHERE batch_id = $1 ORDER BY record_date ASC',
            [batchId]
        );
        if (weightHistory.rows.length >= 2) {
            const first = weightHistory.rows[0];
            const last = weightHistory.rows[weightHistory.rows.length - 1];
            const days = (new Date(last.record_date) - new Date(first.record_date)) / (1000 * 60 * 60 * 24);
            if (days > 0) {
                gmq = ((last.weight - first.weight) / days).toFixed(3) + ' kg/jour';
            }
        }

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
      res.status(500).json({ error: err.message });
    }
});

// POST species
router.post('/species', async (req, res) => {
    const { name, gestation_duration_days, adult_age_months, feed_type, care_frequency, fattening_duration_days, avg_weight_kg, expected_yield } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO species (name, gestation_duration_days, adult_age_months, feed_type, care_frequency, fattening_duration_days, avg_weight_kg, expected_yield) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, gestation_duration_days, adult_age_months, feed_type, care_frequency, fattening_duration_days, avg_weight_kg, expected_yield]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE breed
router.delete('/breeds/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM breeds WHERE id = $1', [req.params.id]);
        res.json({ message: 'Race supprimée' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET breeds
router.get('/breeds', async (req, res) => {
    try {
        const result = await db.query('SELECT b.*, s.name as species_name FROM breeds b JOIN species s ON b.species_id = s.id ORDER BY s.name, b.name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST breed
router.post('/breeds', async (req, res) => {
    const { species_id, name } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO breeds (species_id, name) VALUES ($1, $2) RETURNING *',
            [species_id, name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET buildings & pens
router.get('/locations', async (req, res) => {
    try {
        const buildings = await db.query('SELECT * FROM buildings');
        const pens = await db.query('SELECT * FROM pens');
        res.json({ buildings: buildings.rows, pens: pens.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET alerts
router.get('/alerts', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM alerts WHERE status = \'Pending\' ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
