const express = require('express');
const db = require('./src/config/db');
const app = express();
const port = 3003;

app.use(express.json());
const livestock = require('./src/routes/livestock');
const crops = require('./src/routes/crops');
const reports = require('./src/routes/reports');
const docs = require('./src/routes/documents');
const purchases = require('./src/routes/purchases');

// Mock auth
app.use((req, res, next) => {
    req.user = { id: 999, role_name: 'Admin' };
    next();
});

app.use('/api/livestock', livestock);
app.use('/api/crops', crops);
app.use('/api/reports', reports);
app.use('/api/documents', docs);
app.use('/api/purchases', purchases);

const server = app.listen(port, async () => {
    console.log('Verification server running');
    try {
        console.log('Testing Global Search...');
        // We can't easily test without real DB data, but we can check if routes respond (even with empty)
        // or if they throw 500.
        const searchRes = await fetch(`http://localhost:${port}/api/reports/search?q=test`);
        console.log('Search Status:', searchRes.status);

        console.log('Testing Documents API...');
        const docRes = await fetch(`http://localhost:${port}/api/documents/Livestock/1`);
        console.log('Docs Status:', docRes.status);

        console.log('Testing Recommendations...');
        const recRes = await fetch(`http://localhost:${port}/api/livestock/individuals/1/recommendations`);
        console.log('Recommendations Status:', recRes.status);

        console.log('Testing Forecast...');
        const forecastRes = await fetch(`http://localhost:${port}/api/crops/1/forecast`);
        console.log('Forecast Status:', forecastRes.status);

        process.exit(0);
    } catch (e) {
        console.error('Verification failed:', e.message);
        process.exit(1);
    }
});
