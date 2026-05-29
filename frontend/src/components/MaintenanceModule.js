import React, { useState, useEffect } from 'react';

function MaintenanceModule({ user }) {
  const [assets, setAssets] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [plans, setPlans] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [view, setView] = useState('assets'); // assets, records, plans, interventions, usage
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'asset', 'intervention', 'usage'

  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedAsset]);

  const fetchData = async () => {
    setLoading(true);
    const headers = { 'X-User-ID': user?.id };
    try {
      if (view === 'assets') {
        const res = await fetch('/api/assets', { headers });
        setAssets(await res.json());
      } else if (view === 'records') {
        const res = await fetch('/api/maintenance', { headers });
        setMaintenance(await res.json());
      } else if (view === 'plans') {
        const res = await fetch('/api/maintenance/plans', { headers });
        setPlans(await res.json());
      } else if (view === 'interventions') {
        const res = await fetch('/api/maintenance/interventions', { headers });
        setInterventions(await res.json());
      } else if (view === 'usage' && selectedAsset) {
        const res = await fetch(`/api/maintenance/usage/${selectedAsset}`, { headers });
        setUsageLogs(await res.json());
      }
    } catch (err) {
      console.error('Error fetching maintenance data:', err);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const headers = {
      'Content-Type': 'application/json',
      'X-User-ID': user?.id
    };

    let url = '';
    if (modalType === 'asset') url = '/api/assets';
    if (modalType === 'intervention') url = '/api/maintenance/interventions';
    if (modalType === 'usage') url = '/api/maintenance/usage';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({});
        fetchData();
      }
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const openModal = (type) => {
    setModalType(type);
    if (type === 'usage' && selectedAsset) {
      setFormData({ asset_id: selectedAsset, record_date: new Date().toISOString().split('T')[0] });
    } else {
      setFormData({});
    }
    setShowModal(true);
  };

  const handleFetchData = () => {
    fetchData();
  };

  return (
    <div className="maintenance-module">
      <div className="module-header">
        <h2>🛠️ Maintenance et Actifs</h2>
        <div className="tab-buttons">
          <button onClick={() => setView('assets')} className={view === 'assets' ? 'active' : ''}>Inventaire</button>
          <button onClick={() => setView('plans')} className={view === 'plans' ? 'active' : ''}>Plans Préventifs</button>
          <button onClick={() => setView('interventions')} className={view === 'interventions' ? 'active' : ''}>Pannes & Correctif</button>
          <button onClick={() => setView('usage')} className={view === 'usage' ? 'active' : ''}>Utilisation</button>
          <button onClick={() => setView('records')} className={view === 'records' ? 'active' : ''}>Historique</button>
        </div>
      </div>

      {loading ? <p>Chargement...</p> : (
        <div className="module-content">
          {view === 'assets' && (
            <div className="asset-list">
              <div className="section-header">
                <h3>Liste des Actifs (Équipements, Véhicules, Bâtiments)</h3>
                <button className="btn-add" onClick={() => openModal('asset')}>+ Nouvel Actif</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Marque/Modèle</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(asset => (
                    <tr key={asset.id}>
                      <td><strong>{asset.code_actif}</strong></td>
                      <td>{asset.name}</td>
                      <td>{asset.category}</td>
                      <td>{asset.brand} {asset.model}</td>
                      <td>
                        <span className={`status-badge ${asset.status.toLowerCase().replace(' ', '-')}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => { setSelectedAsset(asset.id); setView('usage'); }}>📊 Suivi</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === 'usage' && (
            <div className="usage-tracking">
              <div className="section-header">
                <h3>Suivi d'Utilisation et Consommation</h3>
                <select value={selectedAsset || ''} onChange={(e) => setSelectedAsset(e.target.value)}>
                  <option value="">Choisir un actif...</option>
                  {assets.filter(a => a.category !== 'Bâtiment').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.code_actif})</option>
                  ))}
                </select>
                <button className="btn-add" onClick={() => openModal('usage')} disabled={!selectedAsset}>+ Relever Utilisation</button>
              </div>

              {selectedAsset ? (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Valeur (km/h)</th>
                      <th>Carburant (L)</th>
                      <th>Opérateur</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageLogs.map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.record_date).toLocaleDateString()}</td>
                        <td>{log.usage_value}</td>
                        <td>{log.fuel_liters}</td>
                        <td>{log.operator_name}</td>
                        <td>{log.notes}</td>
                      </tr>
                    ))}
                    {usageLogs.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center'}}>Aucun relevé trouvé</td></tr>}
                  </tbody>
                </table>
              ) : (
                <p style={{padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9'}}>Sélectionnez un véhicule ou un équipement pour voir son historique d'utilisation.</p>
              )}
            </div>
          )}

          {view === 'plans' && (
            <div className="plans-list">
              <div className="section-header">
                <h3>Programmes de Maintenance Préventive</h3>
                <button className="btn-add">+ Nouveau Plan</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Actif</th>
                    <th>Tâche</th>
                    <th>Fréquence</th>
                    <th>Dernière maintenance</th>
                    <th>Prochaine échéance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan.id}>
                      <td>{plan.asset_name}</td>
                      <td>{plan.task_name}</td>
                      <td>{plan.frequency_days ? `${plan.frequency_days} jours` : `${plan.frequency_usage} ${plan.exploitation_type}`}</td>
                      <td>{plan.last_maintenance_date || 'N/A'}</td>
                      <td>{plan.next_due_date || 'N/A'}</td>
                      <td>{plan.is_active ? '✅ Actif' : '❌ Inactif'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === 'interventions' && (
            <div className="interventions-list">
              <div className="section-header">
                <h3>Demandes d'Intervention (Pannes)</h3>
                <button className="btn-danger" style={{backgroundColor: '#e74c3c', color: 'white'}} onClick={() => openModal('intervention')}>⚠️ Déclarer une Panne</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Actif</th>
                    <th>Description</th>
                    <th>Urgence</th>
                    <th>Technicien</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {interventions.map(i => (
                    <tr key={i.id}>
                      <td>{new Date(i.report_date).toLocaleDateString()}</td>
                      <td>{i.asset_name}</td>
                      <td>{i.fault_description}</td>
                      <td>
                        <span className={`priority-badge ${i.urgency.toLowerCase()}`}>
                          {i.urgency}
                        </span>
                      </td>
                      <td>{i.technician_name || 'En attente'}</td>
                      <td>{i.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === 'records' && (
            <div className="maintenance-list">
              <div className="section-header">
                <h3>Journal des Interventions Réalisées</h3>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Actif</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Coût Total</th>
                    <th>Technicien</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map(record => (
                    <tr key={record.id}>
                      <td>{record.maintenance_date}</td>
                      <td>{record.asset_name}</td>
                      <td>{record.task_type}</td>
                      <td>{record.description}</td>
                      <td>{record.total_cost} FCFA</td>
                      <td>{record.technician_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div className="modal-content" style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px', width: '100%'}}>
            <h3>{modalType === 'asset' ? 'Nouvel Actif' : modalType === 'intervention' ? 'Déclarer une Panne' : 'Relever Utilisation'}</h3>
            <form onSubmit={handleSubmit}>
              {modalType === 'asset' && (
                <>
                  <input type="text" name="name" placeholder="Nom de l'actif" onChange={handleInputChange} required style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  <input type="text" name="code_actif" placeholder="Code (ex: TRAC-01)" onChange={handleInputChange} required style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  <select name="category" onChange={handleInputChange} required style={{width: '100%', padding: '8px', marginBottom: '10px'}}>
                    <option value="">Catégorie...</option>
                    <option value="Équipement agricole">Équipement agricole</option>
                    <option value="Tracteur">Tracteur</option>
                    <option value="Véhicule">Véhicule</option>
                    <option value="Bâtiment">Bâtiment</option>
                  </select>
                  <input type="text" name="brand" placeholder="Marque" onChange={handleInputChange} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  <input type="text" name="model" placeholder="Modèle" onChange={handleInputChange} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                </>
              )}
              {modalType === 'intervention' && (
                <>
                  <select name="asset_id" onChange={handleInputChange} required style={{width: '100%', padding: '8px', marginBottom: '10px'}}>
                    <option value="">Choisir l'actif...</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code_actif})</option>)}
                  </select>
                  <textarea name="fault_description" placeholder="Description de la panne" onChange={handleInputChange} required style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  <select name="urgency" onChange={handleInputChange} style={{width: '100%', padding: '8px', marginBottom: '10px'}}>
                    <option value="Normale">Urgence...</option>
                    <option value="Basse">Basse</option>
                    <option value="Normale">Normale</option>
                    <option value="Haute">Haute</option>
                    <option value="Critique">Critique</option>
                  </select>
                </>
              )}
              {modalType === 'usage' && (
                <>
                  <input type="date" name="record_date" value={formData.record_date} onChange={handleInputChange} required style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  <input type="number" name="usage_value" placeholder="Valeur (Cumulative km ou heures)" onChange={handleInputChange} required style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  <input type="number" name="fuel_liters" placeholder="Carburant ajouté (L)" onChange={handleInputChange} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  <textarea name="notes" placeholder="Notes..." onChange={handleInputChange} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                </>
              )}
              <div className="modal-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <button type="button" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={{backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px'}}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintenanceModule;
