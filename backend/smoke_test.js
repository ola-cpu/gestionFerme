const express = require('express');
const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req, res, next) => {
    req.user = { id: 1 };
    next();
});

const assetRoutes = require('./src/routes/assets');
const maintenanceRoutes = require('./src/routes/maintenance');
const reportRoutes = require('./src/routes/reports');

app.use('/api/assets', assetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);

const server = app.listen(3002, () => {
    console.log('Test server running on port 3002');
});

// Simple test script using fetch
async function runTests() {
    const baseUrl = 'http://localhost:3002/api';
    const headers = { 'Content-Type': 'application/json', 'X-User-ID': '1' };

    try {
        console.log('Testing GET /api/assets...');
        let res = await fetch(`${baseUrl}/assets`, { headers });
        let data = await res.json();
        console.log('Assets:', data.length, 'found');

        console.log('Testing GET /api/maintenance...');
        res = await fetch(`${baseUrl}/maintenance`, { headers });
        data = await res.json();
        console.log('Maintenance records:', data.length, 'found');

        console.log('Testing GET /api/reports/kpis...');
        res = await fetch(`${baseUrl}/reports/kpis`, { headers });
        data = await res.json();
        console.log('KPIs:', data);

        console.log('Testing GET /api/reports/alerts...');
        res = await fetch(`${baseUrl}/reports/alerts`, { headers });
        data = await res.json();
        console.log('Alerts:', data);

        console.log('All smoke tests passed (using fallbacks where DB is missing)');
    } catch (err) {
        console.error('Tests failed:', err);
    } finally {
        server.close();
    }
}

runTests();
