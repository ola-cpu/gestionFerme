import React, { useState, useEffect } from 'react';

function LivestockList({ user, onSelectBatch }) {
  const [batches, setBatches] = useState([]);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newBatch, setNewBatch] = useState({
    species_id: '',
    batch_name: '',
    arrival_date: new Date().toISOString().split('T')[0],
    initial_count: 0,
    current_count: 0
  });
  const [breeds, setBreeds] = useState([]);
  const [locations, setLocations] = useState({ buildings: [], pens: [] });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchBatches();
    fetchSpecies();
    fetchBreeds();
    fetchLocations();
    fetchAlerts();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/livestock', { headers: { 'X-User-ID': user?.id } });
      const data = await response.json();
      setBatches(data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error", err);
      setLoading(false);
    }
  };

  const fetchSpecies = async () => {
    try {
      const response = await fetch('/api/livestock/species', { headers: { 'X-User-ID': user?.id } });
      const data = await response.json();
      setSpecies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  const fetchBreeds = async () => {
    try {
      const response = await fetch('/api/livestock/breeds', { headers: { 'X-User-ID': user?.id } });
      const data = await response.json();
      setBreeds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/livestock/alerts', { headers: { 'X-User-ID': user?.id } });
      const data = await response.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/livestock/locations', { headers: { 'X-User-ID': user?.id } });
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/livestock', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify(newBatch)
      });
      if (response.ok) {
        fetchBatches();
        setShowForm(false);
        setNewBatch({
          species_id: '',
          batch_name: '',
          arrival_date: new Date().toISOString().split('T')[0],
          initial_count: 0,
          current_count: 0
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [showConfig, setShowConfig] = useState(false);
  const [newSpecies, setNewSpecies] = useState({
    name: '',
    gestation_duration_days: '',
    adult_age_months: '',
    feed_type: '',
    avg_weight_kg: ''
  });
  const [newBreed, setNewBreed] = useState({ species_id: '', name: '' });

  if (loading) return <p>Chargement de l'élevage...</p>;

  const handleAddSpecies = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/livestock/species', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id, 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpecies)
      });
      if (response.ok) {
        fetchSpecies();
        setNewSpecies({
          name: '',
          gestation_duration_days: '',
          adult_age_months: '',
          feed_type: '',
          avg_weight_kg: ''
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleAddBreed = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/livestock/breeds', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id, 'Content-Type': 'application/json' },
        body: JSON.stringify(newBreed)
      });
      if (response.ok) {
        fetchBreeds();
        setNewBreed({ species_id: '', name: '' });
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="livestock-list">
      {alerts.length > 0 && (
          <div className="alerts-banner" style={{background: '#fff3cd', padding: '10px', marginBottom: '20px', border: '1px solid #ffeeba', borderRadius: '4px'}}>
              <strong>Alertes Élevage:</strong>
              <ul style={{margin: '5px 0 0 20px'}}>
                  {alerts.map(a => <li key={a.id}>{a.message}</li>)}
              </ul>
          </div>
      )}

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>Gestion de l'Élevage</h2>
        <div>
            <button onClick={() => setShowConfig(!showConfig)} style={{marginRight: '10px'}}>
              {showConfig ? 'Fermer Config' : 'Configuration'}
            </button>
            <button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Annuler' : 'Nouveau Lot'}
            </button>
        </div>
      </div>

      {showConfig && (
          <div className="config-section" style={{padding: '20px', background: '#f9f9f9', marginBottom: '20px', borderRadius: '8px'}}>
              <h3>Configuration Espèces et Races</h3>
              <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                  <div style={{flex: '1', minWidth: '300px'}}>
                      <h4>Espèces</h4>
                      <ul style={{marginBottom: '10px', maxHeight: '150px', overflowY: 'auto'}}>
                          {species.map(s => (
                              <li key={s.id} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                                  {s.name}
                                  <button onClick={async () => {
                                      if(window.confirm('Supprimer cette espèce ?')) {
                                          await fetch(`/api/livestock/species/${s.id}`, { method: 'DELETE', headers: { 'X-User-ID': user?.id } });
                                          fetchSpecies();
                                      }
                                  }} style={{color: 'red', fontSize: '0.8em'}}>Suppr.</button>
                              </li>
                          ))}
                      </ul>
                      <form onSubmit={handleAddSpecies}>
                      <h5>Ajouter Espèce</h5>
                      <input type="text" placeholder="Nom espèce" value={newSpecies.name} onChange={e => setNewSpecies({...newSpecies, name: e.target.value})} required style={{display: 'block', marginBottom: '5px', width: '100%'}} />
                      <input type="number" placeholder="Gestation (jours)" value={newSpecies.gestation_duration_days} onChange={e => setNewSpecies({...newSpecies, gestation_duration_days: e.target.value})} style={{display: 'block', marginBottom: '5px', width: '100%'}} />
                      <input type="number" placeholder="Âge adulte (mois)" value={newSpecies.adult_age_months} onChange={e => setNewSpecies({...newSpecies, adult_age_months: e.target.value})} style={{display: 'block', marginBottom: '5px', width: '100%'}} />
                      <input type="text" placeholder="Type d'alimentation" value={newSpecies.feed_type} onChange={e => setNewSpecies({...newSpecies, feed_type: e.target.value})} style={{display: 'block', marginBottom: '5px', width: '100%'}} />
                      <input type="number" placeholder="Poids moyen (kg)" value={newSpecies.avg_weight_kg} onChange={e => setNewSpecies({...newSpecies, avg_weight_kg: e.target.value})} style={{display: 'block', marginBottom: '5px', width: '100%'}} />
                      <button type="submit">Ajouter</button>
                      </form>
                  </div>
                  <div style={{flex: '1', minWidth: '300px'}}>
                      <h4>Races</h4>
                      <ul style={{marginBottom: '10px', maxHeight: '150px', overflowY: 'auto'}}>
                          {breeds.map(b => (
                              <li key={b.id} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                                  <span>{b.name} <small>({b.species_name})</small></span>
                                  <button onClick={async () => {
                                      if(window.confirm('Supprimer cette race ?')) {
                                          await fetch(`/api/livestock/breeds/${b.id}`, { method: 'DELETE', headers: { 'X-User-ID': user?.id } });
                                          fetchBreeds();
                                      }
                                  }} style={{color: 'red', fontSize: '0.8em'}}>Suppr.</button>
                              </li>
                          ))}
                      </ul>
                      <form onSubmit={handleAddBreed}>
                      <h5>Ajouter Race</h5>
                      <select value={newBreed.species_id} onChange={e => setNewBreed({...newBreed, species_id: e.target.value})} required>
                          <option value="">Espèce</option>
                          {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <input type="text" placeholder="Nom race" value={newBreed.name} onChange={e => setNewBreed({...newBreed, name: e.target.value})} required />
                      <button type="submit">Ajouter</button>
                    </form>
                  </div>
              </div>
          </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="module-form">
          <select
            value={newBatch.species_id}
            onChange={e => setNewBatch({...newBatch, species_id: e.target.value})}
            required
          >
            <option value="">Sélectionner une espèce</option>
            {species.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nom du lot"
            value={newBatch.batch_name}
            onChange={e => setNewBatch({...newBatch, batch_name: e.target.value})}
            required
          />
          <input
            type="date"
            value={newBatch.arrival_date}
            onChange={e => setNewBatch({...newBatch, arrival_date: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Nombre initial"
            value={newBatch.initial_count}
            onChange={e => setNewBatch({...newBatch, initial_count: e.target.value, current_count: e.target.value})}
            required
          />
          <button type="submit">Enregistrer</button>
        </form>
      )}

      <div className="module-grid">
        {batches.map(batch => (
          <div key={batch.id} className="module-card" onClick={() => onSelectBatch(batch)}>
            <h4>{batch.batch_name}</h4>
            <p>Espèce: {batch.species_name}</p>
            <p>Effectif: {batch.current_count}</p>
            <p>Status: {batch.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LivestockList;
