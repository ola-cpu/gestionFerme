import React, { useState, useEffect } from 'react';

function MaintenanceModule({ user }) {
  const [assets, setAssets] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [view, setView] = useState('assets'); // assets or records

  useEffect(() => {
    fetch('/api/assets', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => setAssets(data));

    fetch('/api/maintenance', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => setMaintenance(data));
  }, []);

  return (
    <div className="maintenance-module">
      <div className="module-header">
        <h2>Maintenance et Actifs</h2>
        <div className="tab-buttons">
          <button onClick={() => setView('assets')} className={view === 'assets' ? 'active' : ''}>Inventaire des Actifs</button>
          <button onClick={() => setView('records')} className={view === 'records' ? 'active' : ''}>Historique Maintenance</button>
        </div>
      </div>

      {view === 'assets' ? (
        <div className="asset-list">
          <h3>Liste des Équipements, Véhicules et Bâtiments</h3>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Date d'achat</th>
                <th>Prix d'achat</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id}>
                  <td>{asset.name}</td>
                  <td>{asset.category}</td>
                  <td>{asset.purchase_date || 'N/A'}</td>
                  <td>{asset.purchase_price ? `${asset.purchase_price} FCFA` : 'N/A'}</td>
                  <td>{asset.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="maintenance-list">
          <h3>Rapports d'Entretien et Réparation</h3>
          <table>
            <thead>
              <tr>
                <th>Actif</th>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Coût</th>
                <th>Prochaine échéance</th>
              </tr>
            </thead>
            <tbody>
              {maintenance.map(record => (
                <tr key={record.id}>
                  <td>{record.asset_name}</td>
                  <td>{record.maintenance_date}</td>
                  <td>{record.description}</td>
                  <td>{record.task_type}</td>
                  <td>{record.cost} FCFA</td>
                  <td>{record.next_due_date || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MaintenanceModule;
