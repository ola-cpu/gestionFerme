import React, { useState, useEffect } from 'react';

function Dashboard({ user, ...props }) {
  const [kpis, setKpis] = useState({});
  const [alerts, setAlerts] = useState({ stock: [], expiry: [], maintenance: [] });

  useEffect(() => {
    const headers = { 'X-User-ID': user?.id };
    fetch('/api/reports/kpis', { headers })
      .then(res => res.json())
      .then(data => setKpis(data));

    fetch('/api/reports/alerts', { headers })
      .then(res => res.json())
      .then(data => setAlerts(data));
  }, [user]);

  const handleExport = (module) => {
    window.open(`/api/reports/export/${module}`);
  };

  return (
    <div className="dashboard">
      <h2>Tableau de Bord</h2>

      <div className="kpi-grid">
        <div className="kpi-card">
          <h4>Mortalité (Élevage)</h4>
          <p className="kpi-value">{kpis.mortality_rate}</p>
        </div>
        <div className="kpi-card">
          <h4>Chiffre d'Affaires</h4>
          <p className="kpi-value">{kpis.total_sales} FCFA</p>
        </div>
        <div className="kpi-card">
          <h4>Disponibilité Actifs</h4>
          <p className="kpi-value">{kpis.asset_availability}</p>
        </div>
        <div className="kpi-card">
          <h4>Coûts Maintenance</h4>
          <p className="kpi-value">{kpis.maintenance_costs}</p>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="alert-section">
          <h3>Alertes et Notifications</h3>

          {alerts.maintenance && alerts.maintenance.length > 0 && (
            <div className="alert-box info">
              <p><strong>🛠️ Maintenances préventives à venir:</strong></p>
              <ul>
                {alerts.maintenance.map((m, i) => (
                  <li key={i}>{m.name}: {m.task_name} (Échéance: {m.next_due_date})</li>
                ))}
              </ul>
            </div>
          )}

          {alerts.stock && alerts.stock.length > 0 && (
            <div className="alert-box warning">
              <p><strong>📦 Ruptures de stock imminentes:</strong></p>
              <ul>
                {alerts.stock.map((s, i) => (
                  <li key={i}>{s.name}: {s.current_stock} restant (Seuil: {s.minimum_threshold})</li>
                ))}
              </ul>
            </div>
          )}

          {alerts.expiry && alerts.expiry.length > 0 && (
            <div className="alert-box danger">
              <p><strong>⚠️ Produits approchant péremption:</strong></p>
              <ul>
                {alerts.expiry.map((e, i) => (
                  <li key={i}>{e.batch_number} - Expire le: {e.expiry_date}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="reports-section">
          <h3>Génération de Rapports (CSV)</h3>
          <div className="report-buttons">
            <button onClick={() => handleExport('transactions')}>Flux de Trésorerie</button>
            <button onClick={() => handleExport('livestock')}>Production Élevage</button>
            <button onClick={() => handleExport('crops')}>Cycles Culturaux</button>
            <button onClick={() => handleExport('stock')}>État des Stocks</button>
            <button onClick={() => handleExport('maintenance')}>Historique Maintenance</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
