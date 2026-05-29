const db = require('../config/db');

/**
 * Deducts stock using FIFO logic from batches in a specific warehouse.
 *
 * @param {number} stockItemId
 * @param {number} warehouseId
 * @param {number} quantity
 * @param {string} reason
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function deductStockFIFO(stockItemId, warehouseId, quantity, reason, userId) {
    const batches = await db.query(
        'SELECT id, current_quantity, unit_price FROM stock_batches WHERE stock_item_id = $1 AND warehouse_id = $2 AND current_quantity > 0 ORDER BY received_date ASC, id ASC',
        [stockItemId, warehouseId]
    );

    let remaining = quantity;
    let totalCost = 0;
    for (const b of batches.rows) {
        const out = Math.min(remaining, b.current_quantity);
        await db.query('UPDATE stock_batches SET current_quantity = current_quantity - $1 WHERE id = $2', [out, b.id]);
        await db.query(
            'INSERT INTO stock_movements (stock_item_id, batch_id, warehouse_id, movement_type, quantity, reason, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [stockItemId, b.id, warehouseId, 'OUT', out, reason, userId]
        );
        totalCost += (out * parseFloat(b.unit_price || 0));
        remaining -= out;
        if (remaining <= 0) break;
    }

    if (remaining > 0) {
        throw new Error(`Stock insuffisant dans le magasin (Manque: ${remaining})`);
    }

    await db.query('UPDATE stock_items SET current_stock = current_stock - $1 WHERE id = $2', [quantity, stockItemId]);
    return totalCost;
}

module.exports = {
    deductStockFIFO
};
