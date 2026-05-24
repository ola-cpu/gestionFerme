const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Routes
const livestockRoutes = require('./src/routes/livestock');
const stockRoutes = require('./src/routes/stocks');

app.use('/api/livestock', livestockRoutes);
app.use('/api/stocks', stockRoutes);

app.get('/', (req, res) => {
  res.send('Gestock-Ferme API is running');
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
