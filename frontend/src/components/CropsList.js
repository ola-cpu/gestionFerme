import React, { useState, useEffect } from 'react';
import PlotMap from './PlotMap';

function CropsList({ user, onSelectCycle }) {
  const [cycles, setCycles] = useState([]);
  const [plots, setPlots] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showPlotForm, setShowPlotForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);

  const [newCycle, setNewCycle] = useState({ plot_id: '', campaign_id: '', crop_type_id: '', crop_name: '', season: '', planting_date: '', expected_yield: '' });
  const [newPlot, setNewPlot] = useState({ name: '', area_hectares: '', soil_type: '', latitude: '', longitude: '', fertility_level: '', water_availability: '', status: 'Disponible' });
  const [newCampaign, setNewCampaign] = useState({ name: '', start_date: '', end_date: '', status: 'En cours' });
  const [newType, setNewType] = useState({ name: '', variety: '', cycle_duration_days: '', water_needs: '', fertilizer_needs: '', expected_yield_per_ha: '' });

  useEffect(() => {
    fetchCycles();
    fetchPlots();
    fetchCampaigns();
    fetchCropTypes();
  }, []);

  const fetchCycles = async () => {
    try {
      const res = await fetch('/api/crops', { headers: { 'X-User-ID': user?.id } });
      const data = await res.json();
      setCycles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlots = async () => {
    try {
      const res = await fetch('/api/crops/plots', { headers: { 'X-User-ID': user?.id } });
      const data = await res.json();
      setPlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/crops/campaigns', { headers: { 'X-User-ID': user?.id } });
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCropTypes = async () => {
    try {
      const res = await fetch('/api/crops/types', { headers: { 'X-User-ID': user?.id } });
      const data = await res.json();
      setCropTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCycle = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/crops', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify(newCycle)
      });
      setShowCycleForm(false);
      fetchCycles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlot = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/crops/plots', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify(newPlot)
      });
      setShowPlotForm(false);
      fetchPlots();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/crops/campaigns', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign)
      });
      setShowCampaignForm(false);
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/crops/types', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify(newType)
      });
      setShowTypeForm(false);
      fetchCropTypes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="crops-module">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Suivi des Cultures</h2>
        <div>
          <button onClick={() => setShowCampaignForm(true)} style={{ marginRight: '10px' }}>+ Campagne</button>
          <button onClick={() => setShowTypeForm(true)} style={{ marginRight: '10px' }}>+ Type de Culture</button>
          <button onClick={() => setShowPlotForm(true)} style={{ marginRight: '10px' }}>+ Parcelle</button>
          <button onClick={() => setShowCycleForm(true)}>+ Cycle Cultural</button>
        </div>
      </div>

      {showCampaignForm && (
        <form onSubmit={handleAddCampaign} className="modal-form">
          <h3>Nouvelle Campagne Agricole</h3>
          <input type="text" placeholder="Nom (ex: Campagne 2024)" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} required />
          <input type="date" placeholder="Date de début" value={newCampaign.start_date} onChange={e => setNewCampaign({...newCampaign, start_date: e.target.value})} />
          <input type="date" placeholder="Date de fin" value={newCampaign.end_date} onChange={e => setNewCampaign({...newCampaign, end_date: e.target.value})} />
          <button type="submit">Créer</button>
          <button type="button" onClick={() => setShowCampaignForm(false)}>Annuler</button>
        </form>
      )}

      {showTypeForm && (
        <form onSubmit={handleAddType} className="modal-form">
          <h3>Nouveau Type de Culture</h3>
          <input type="text" placeholder="Nom (ex: Maïs)" value={newType.name} onChange={e => setNewType({...newType, name: e.target.value})} required />
          <input type="text" placeholder="Variété" value={newType.variety} onChange={e => setNewType({...newType, variety: e.target.value})} />
          <input type="number" placeholder="Durée cycle (jours)" value={newType.cycle_duration_days} onChange={e => setNewType({...newType, cycle_duration_days: e.target.value})} />
          <input type="text" placeholder="Besoins en eau" value={newType.water_needs} onChange={e => setNewType({...newType, water_needs: e.target.value})} />
          <input type="text" placeholder="Besoins en engrais" value={newType.fertilizer_needs} onChange={e => setNewType({...newType, fertilizer_needs: e.target.value})} />
          <input type="number" step="0.01" placeholder="Rendement attendu (t/ha)" value={newType.expected_yield_per_ha} onChange={e => setNewType({...newType, expected_yield_per_ha: e.target.value})} />
          <button type="submit">Enregistrer</button>
          <button type="button" onClick={() => setShowTypeForm(false)}>Annuler</button>
        </form>
      )}

      {showPlotForm && (
        <form onSubmit={handleAddPlot} className="modal-form">
          <h3>Nouvelle Parcelle</h3>
          <input type="text" placeholder="Nom de la parcelle" value={newPlot.name} onChange={e => setNewPlot({...newPlot, name: e.target.value})} required />
          <input type="number" step="0.01" placeholder="Surface (ha)" value={newPlot.area_hectares} onChange={e => setNewPlot({...newPlot, area_hectares: e.target.value})} required />
          <input type="text" placeholder="Type de sol" value={newPlot.soil_type} onChange={e => setNewPlot({...newPlot, soil_type: e.target.value})} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" step="0.000001" placeholder="Latitude" value={newPlot.latitude} onChange={e => setNewPlot({...newPlot, latitude: e.target.value})} />
            <input type="number" step="0.000001" placeholder="Longitude" value={newPlot.longitude} onChange={e => setNewPlot({...newPlot, longitude: e.target.value})} />
          </div>
          <input type="text" placeholder="Niveau de fertilité" value={newPlot.fertility_level} onChange={e => setNewPlot({...newPlot, fertility_level: e.target.value})} />
          <input type="text" placeholder="Disponibilité eau" value={newPlot.water_availability} onChange={e => setNewPlot({...newPlot, water_availability: e.target.value})} />
          <button type="submit">Créer</button>
          <button type="button" onClick={() => setShowPlotForm(false)}>Annuler</button>
        </form>
      )}

      {showCycleForm && (
        <form onSubmit={handleAddCycle} className="modal-form">
          <h3>Nouveau Cycle</h3>
          <select value={newCycle.plot_id} onChange={e => setNewCycle({...newCycle, plot_id: e.target.value})} required>
            <option value="">Sélectionner une parcelle</option>
            {plots.map(p => <option key={p.id} value={p.id}>{p.name} ({p.area_hectares} ha)</option>)}
          </select>
          <select value={newCycle.campaign_id} onChange={e => setNewCycle({...newCycle, campaign_id: e.target.value})}>
            <option value="">Sélectionner une campagne</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={newCycle.crop_type_id} onChange={e => setNewCycle({...newCycle, crop_type_id: e.target.value})} required>
            <option value="">Sélectionner un type de culture</option>
            {cropTypes.map(t => <option key={t.id} value={t.id}>{t.name} - {t.variety}</option>)}
          </select>
          <input type="text" placeholder="Nom du cycle (ex: Maïs 2024)" value={newCycle.crop_name} onChange={e => setNewCycle({...newCycle, crop_name: e.target.value})} required />
          <input type="text" placeholder="Saison" value={newCycle.season} onChange={e => setNewCycle({...newCycle, season: e.target.value})} />
          <input type="date" placeholder="Date de semis" value={newCycle.planting_date} onChange={e => setNewCycle({...newCycle, planting_date: e.target.value})} required />
          <input type="number" placeholder="Rendement attendu total (t)" value={newCycle.expected_yield} onChange={e => setNewCycle({...newCycle, expected_yield: e.target.value})} />
          <button type="submit">Démarrer le cycle</button>
          <button type="button" onClick={() => setShowCycleForm(false)}>Annuler</button>
        </form>
      )}

      <div className="cycles-table">
        <h3>Cycles en cours</h3>
        <table>
          <thead>
            <tr>
              <th>Parcelle</th>
              <th>Culture</th>
              <th>Variété</th>
              <th>Campagne</th>
              <th>Saison</th>
              <th>Date Semis</th>
              <th>Rendement Actuel</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map(c => (
              <tr key={c.id}>
                <td>{c.plot_name}</td>
                <td>{c.crop_type_name || c.crop_name}</td>
                <td>{c.variety || '-'}</td>
                <td>{c.campaign_name || '-'}</td>
                <td>{c.season}</td>
                <td>{new Date(c.planting_date).toLocaleDateString()}</td>
                <td>{c.actual_yield ? `${c.actual_yield} t` : 'En cours'}</td>
                <td>
                  <button onClick={() => onSelectCycle(c.id)}>Gérer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PlotMap plots={plots} />

      <div className="plots-grid" style={{ marginTop: '30px' }}>
        <h3>Parcelles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {plots.map(p => (
            <div key={p.id} className="plot-card" style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
              <strong>{p.name}</strong>
              <p>Surface: {p.area_hectares} ha</p>
              <p>Sol: {p.soil_type}</p>
              <p>Statut: <span className={`status-${p.status?.toLowerCase()}`}>{p.status}</span></p>
              {p.latitude && <p>GPS: {p.latitude}, {p.longitude}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CropsList;
