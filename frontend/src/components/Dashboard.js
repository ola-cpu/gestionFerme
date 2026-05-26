import React, { useState, useEffect } from 'react';

function Dashboard({ user, ...props }) {
  const [kpis, setKpis] = useState({});
  const [alerts, setAlerts] = useState({ stock: [], expiry: [] });

  useEffect(() => {
    const headers = { 'X-User-ID': user?.id };
    fetch('/api/reports/kpis', { headers })
      .then(res => res.json())
      .then(data => setKpis(data));

    fetch('/api/reports/alerts', { headers })
      .then(res => res.json())
      .then(data => setAlerts(data));
  }, [user]);

  return (
    <div className="dashboard">
      <h2>Tableau de Bord</h2>

      <div className="kpi-grid">
        <div className="kpi-card">
          <h4>Mortalité (Élevage)</h4>
          <p className="kpi-value">{kpis.mortality_rate}</p>
        </div>
        <div className="kpi-card">
          <h4>GMQ Moyen</h4>
          <p className="kpi-value">{kpis.gmq_avg}</p>
        </div>
        <div className="kpi-card">
          <h4>Chiffre d'Affaires</h4>
          <p className="kpi-value">{kpis.total_sales} FCFA</p>
        </div>
        <div className="kpi-card">
          <h4>Flux de Trésorerie</h4>
          <p className="kpi-value" style={{color: kpis.cash_flow >= 0 ? 'green' : 'red'}}>
            {kpis.cash_flow} FCFA
          </p>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="alert-section">
          <h3>Alertes et Notifications</h3>
          {alerts.stock.length > 0 && (
            <div className="alert-box warning">
              <p><strong>Ruptures de stock imminentes:</strong></p>
              <ul>
                {alerts.stock.map((s, i) => (
                  <li key={i}>{s.name}: {s.current_stock} restant (Seuil: {s.minimum_threshold})</li>
                ))}
              </ul>
            </div>
          )}
          {alerts.expiry.length > 0 && (
            <div className="alert-box danger">
              <p><strong>Produits approchant péremption:</strong></p>
              <ul>
                {alerts.expiry.map((e, i) => (
                  <li key={i}>{e.batch_number} - Expire le: {e.expiry_date}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="reports-section">
          <h3>Rapports Rapides</h3>
          <div className="report-buttons">
            <button onClick={() => window.open('/api/reports/export/transactions')}>Exporter Flux de Trésorerie (.CSV)</button>
            <button onClick={() => alert('Génération du rapport Excel en cours...')}>Rapport Mensuel de Production (Excel)</button>
            <button onClick={() => alert('Génération du bilan sanitaire en cours...')}>Bilan Sanitaire Hebdomadaire</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
