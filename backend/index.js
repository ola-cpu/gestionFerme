const express = require('express');
const app = express();
const port = 3001; // Changed to 3001 to avoid conflict with React (3000)

app.use(express.json());

// Routes
const livestockRoutes = require('./src/routes/livestock');
const stockRoutes = require('./src/routes/stocks');
const cropRoutes = require('./src/routes/crops');
const purchaseRoutes = require('./src/routes/purchases');
const saleRoutes = require('./src/routes/sales');
const personnelRoutes = require('./src/routes/personnel');
const financeRoutes = require('./src/routes/finance');
const assetRoutes = require('./src/routes/assets');
const maintenanceRoutes = require('./src/routes/maintenance');
const reportRoutes = require('./src/routes/reports');

app.use('/api/livestock', livestockRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.send('Gestock-Ferme API is running');
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
