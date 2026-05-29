const db = require('../config/db');

/**
 * Checks for various system alerts and populates the 'alerts' table.
 */
async function checkAndGenerateAlerts() {
    try {
        // 1. Stock Alerts: Current stock <= Minimum threshold
        const stockAlerts = await db.query(`
            SELECT id, name, current_stock, minimum_threshold
            FROM stock_items
            WHERE current_stock <= minimum_threshold
        `);
        for (const item of stockAlerts.rows) {
            const message = `Stock critique pour ${item.name}: ${item.current_stock} ${item.unit || ''} restant (Seuil: ${item.minimum_threshold})`;
            const alertResult = await db.query(`
                INSERT INTO alerts (type, message, record_id, table_name)
                SELECT 'Stock', $1, $2, 'stock_items'
                WHERE NOT EXISTS (
                    SELECT 1 FROM alerts WHERE type = 'Stock' AND record_id = $2 AND status = 'Pending' AND message = $1
                )
                RETURNING *
            `, [message, item.id]);

            if (alertResult.rows.length > 0 && global.io) {
                global.io.emit('new_alert', alertResult.rows[0]);
            }
        }

        // 2. Stock Expiry Alerts: Batch expiring in less than 30 days
        const expiryAlerts = await db.query(`
            SELECT b.id, b.batch_number, b.expiry_date, i.name
            FROM stock_batches b
            JOIN stock_items i ON b.stock_item_id = i.id
            WHERE b.expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND b.current_quantity > 0
        `);
        for (const batch of expiryAlerts.rows) {
            const message = `Péremption proche pour ${batch.name} (Lot: ${batch.batch_number}) le ${batch.expiry_date}`;
            await db.query(`
                INSERT INTO alerts (type, message, record_id, table_name)
                SELECT 'Expiry', $1, $2, 'stock_batches'
                WHERE NOT EXISTS (
                    SELECT 1 FROM alerts WHERE type = 'Expiry' AND record_id = $2 AND status = 'Pending' AND message = $1
                )
            `, [message, batch.id]);
        }

        // 3. Livestock: Vaccine due dates in next 7 days
        const healthAlerts = await db.query(`
            SELECT id, type, next_due_date, batch_id, individual_id
            FROM health_records
            WHERE next_due_date <= CURRENT_DATE + INTERVAL '7 days' AND next_due_date >= CURRENT_DATE
        `);
        for (const hr of healthAlerts.rows) {
            const message = `Soin prévu (${hr.type}) pour ${hr.individual_id ? 'animal #'+hr.individual_id : 'lot #'+hr.batch_id} le ${hr.next_due_date}`;
            await db.query(`
                INSERT INTO alerts (type, message, record_id, table_name)
                SELECT 'Vaccine', $1, $2, 'health_records'
                WHERE NOT EXISTS (
                    SELECT 1 FROM alerts WHERE type = 'Vaccine' AND record_id = $2 AND status = 'Pending' AND message = $1
                )
            `, [message, hr.id]);
        }

        // 4. Finance: Overdue debts/receivables
        const financeAlerts = await db.query(`
            SELECT id, entity_name, type, amount, due_date
            FROM debts_receivables
            WHERE due_date <= CURRENT_DATE AND status != 'Payé'
        `);
        for (const dr of financeAlerts.rows) {
            const message = `${dr.type} en retard: ${dr.entity_name} (${dr.amount} FCFA) depuis le ${dr.due_date}`;
            await db.query(`
                INSERT INTO alerts (type, message, record_id, table_name)
                SELECT 'Finance', $1, $2, 'debts_receivables'
                WHERE NOT EXISTS (
                    SELECT 1 FROM alerts WHERE type = 'Finance' AND record_id = $2 AND status = 'Pending' AND message = $1
                )
            `, [message, dr.id]);
        }

        // 5. Finance: Budget Overruns
        const budgetAlerts = await db.query(`
            SELECT id, activity, allocated_amount, spent_amount
            FROM budgets
            WHERE spent_amount > allocated_amount AND CURRENT_DATE BETWEEN period_start AND period_end
        `);
        for (const b of budgetAlerts.rows) {
            const message = `Dépassement de budget pour ${b.activity}: ${b.spent_amount} / ${b.allocated_amount}`;
            await db.query(`
                INSERT INTO alerts (type, message, record_id, table_name)
                SELECT 'Finance', $1, $2, 'budgets'
                WHERE NOT EXISTS (
                    SELECT 1 FROM alerts WHERE type = 'Finance' AND record_id = $2 AND status = 'Pending' AND message = $1
                )
            `, [message, b.id]);
        }

    } catch (err) {
        console.error('Error generating alerts:', err.message);
    }
}

module.exports = { checkAndGenerateAlerts };
