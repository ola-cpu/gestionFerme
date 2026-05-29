const express = require('express');
require('dotenv').config();
const db = require('./src/config/db');
const { authenticate } = require('./src/middleware/auth');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const roleMap = {
    'admin': 'Admin',
    'elevage': 'Chef d’élevage',
    'magasin': 'Magasinier',
    'veto': 'Vétérinaire/technicien',
    'vente': 'Commercial',
    'compta': 'RH/Comptable'
  };

  try {
    // Attempt database authentication
    const result = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = $1 AND u.is_active = TRUE',
      [username]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return res.json({
        id: user.id,
        username: user.username,
        role: user.role_name,
        token: `mock-token-${user.id}`
      });
    }
  } catch (err) {
    console.error('Login database error, attempting fallback:', err.message);
  }

  // Demo fallback if DB is empty/missing OR if DB connection fails
  if (roleMap[username] && password === 'password') {
    return res.json({
      id: 999,
      username: username,
      role: roleMap[username],
      token: `mock-token-999`
    });
  }

  res.status(401).json({ error: 'Identifiants invalides' });
});

// Apply authentication middleware to all subsequent routes
app.use(authenticate);

// Routes
const livestockRoutes = require('./src/routes/livestock');
const stockRoutes = require('./src/routes/stocks');
const warehouseRoutes = require('./src/routes/warehouses');
const cropRoutes = require('./src/routes/crops');
const purchaseRoutes = require('./src/routes/purchases');
const saleRoutes = require('./src/routes/sales');
const personnelRoutes = require('./src/routes/personnel');
const financeRoutes = require('./src/routes/finance');
const assetRoutes = require('./src/routes/assets');
const maintenanceRoutes = require('./src/routes/maintenance');
const reportRoutes = require('./src/routes/reports');
const auditRoutes = require('./src/routes/audit');
const documentRoutes = require('./src/routes/documents');

app.use('/api/livestock', livestockRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/documents', documentRoutes);

app.get('/', (req, res) => {
  res.send('Gestock-Ferme API is running');
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
