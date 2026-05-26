import React, { useState, useEffect } from 'react';

function AuditLog({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching audit logs:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement du journal d'audit...</div>;

  return (
    <div className="audit-log">
      <h2>Journal d'Audit</h2>
      <p>Historique des actions effectuées sur le système.</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Action</th>
            <th>Table</th>
            <th>ID Enreg.</th>
            <th>Détails</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.username || 'Système'}</td>
              <td>{log.action}</td>
              <td>{log.table_name}</td>
              <td>{log.record_id}</td>
              <td>{log.details}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan="6" style={{textAlign: 'center'}}>Aucun log trouvé.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AuditLog;
