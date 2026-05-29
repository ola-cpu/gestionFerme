const db = require('../config/db');

/**
 * Log an action to the audit_logs table.
 *
 * @param {number} userId - The ID of the user performing the action.
 * @param {string} action - Descriptive name of the action (e.g., 'CREATE_SALE').
 * @param {string} tableName - The name of the table affected.
 * @param {number} recordId - The ID of the record affected.
 * @param {object} details - Additional details as a JSON-serializable object.
 * @param {string} oldValue - Optional previous value of the record.
 * @param {string} newValue - Optional new value of the record.
 * @param {string} ipAddress - Client IP address.
 * @param {string} userAgent - Client User Agent.
 */
async function logAction(userId, action, tableName, recordId, details, oldValue = null, newValue = null, ipAddress = null, userAgent = null) {
  try {
    const detailsStr = details ? JSON.stringify(details) : null;
    await db.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, details, old_value, new_value, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [userId, action, tableName, recordId, detailsStr, oldValue, newValue, ipAddress, userAgent]
    );
  } catch (err) {
    console.error('Failed to record audit log:', err);
    // We don't throw here to avoid breaking the main transaction
  }
}

module.exports = {
  logAction
};
