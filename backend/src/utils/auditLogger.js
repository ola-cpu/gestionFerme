const db = require('../config/db');

/**
 * Log an action to the audit_logs table.
 *
 * @param {number} userId - The ID of the user performing the action.
 * @param {string} action - Descriptive name of the action (e.g., 'CREATE_SALE').
 * @param {string} tableName - The name of the table affected.
 * @param {number} recordId - The ID of the record affected.
 * @param {object} details - Additional details as a JSON-serializable object.
 */
async function logAction(userId, action, tableName, recordId, details) {
  try {
    const detailsStr = details ? JSON.stringify(details) : null;
    await db.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, action, tableName, recordId, detailsStr]
    );
  } catch (err) {
    console.error('Failed to record audit log:', err);
    // We don't throw here to avoid breaking the main transaction
  }
}

module.exports = {
  logAction
};
