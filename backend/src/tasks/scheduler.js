const cron = require('node-cron');
const db = require('../config/db');

/**
 * Scheduled Reporting Summary Task
 */
const initScheduler = () => {
    // Run every Monday at 8:00 AM
    cron.schedule('0 8 * * 1', async () => {
        console.log('Running Weekly Performance Summary Task...');
        try {
            const sales = await db.query('SELECT SUM(total_amount) as total FROM sales WHERE sale_date >= CURRENT_DATE - INTERVAL \'7 days\'');
            const mortality = await db.query('SELECT COUNT(*) FROM mortality_records WHERE mortality_date >= CURRENT_DATE - INTERVAL \'7 days\'');

            console.log(`Weekly Summary: Sales = ${sales.rows[0].total || 0}, Mortality = ${mortality.rows[0].count}`);
            // In a real system, this could send an email or generate an alert record
        } catch (err) {
            console.error('Error in Weekly Summary Task:', err.message);
        }
    });

    console.log('Scheduler initialized.');
};

module.exports = { initScheduler };
