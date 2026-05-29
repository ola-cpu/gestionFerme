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
            <th>Ancienne Valeur</th>
            <th>Nouvelle Valeur</th>
            <th>IP / Appareil</th>
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
              <td style={{fontSize: '0.8em', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis'}} title={log.old_value}>{log.old_value}</td>
              <td style={{fontSize: '0.8em', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis'}} title={log.new_value}>{log.new_value}</td>
              <td style={{fontSize: '0.8em'}}>
                  <div>{log.ip_address}</div>
                  <div style={{color: '#666', fontSize: '0.9em'}} title={log.user_agent}>{log.user_agent?.substring(0, 30)}...</div>
              </td>
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
