import React, { useState, useEffect } from 'react';

function CropsList({ onSelectCycle }) {
  const [cycles, setCycles] = useState([]);
  const [plots, setPlots] = useState([]);
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showPlotForm, setShowPlotForm] = useState(false);

  const [newCycle, setNewCycle] = useState({ plot_id: '', crop_name: '', season: '', planting_date: '', expected_yield: '' });
  const [newPlot, setNewPlot] = useState({ name: '', area_hectares: '', soil_type: '' });

  useEffect(() => {
    fetchCycles();
    fetchPlots();
  }, []);

  const fetchCycles = async () => {
    try {
      const res = await fetch('/api/crops');
      const data = await res.json();
      setCycles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlots = async () => {
    try {
      const res = await fetch('/api/crops/plots');
      const data = await res.json();
      setPlots(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCycle = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlot)
      });
      setShowPlotForm(false);
      fetchPlots();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="crops-module">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Suivi des Cultures</h2>
        <div>
          <button onClick={() => setShowPlotForm(true)} style={{ marginRight: '10px' }}>+ Nouvelle Parcelle</button>
          <button onClick={() => setShowCycleForm(true)}>+ Nouveau Cycle Cultural</button>
        </div>
      </div>

      {showPlotForm && (
        <form onSubmit={handleAddPlot} className="modal-form">
          <h3>Nouvelle Parcelle</h3>
          <input type="text" placeholder="Nom de la parcelle" value={newPlot.name} onChange={e => setNewPlot({...newPlot, name: e.target.value})} required />
          <input type="number" step="0.01" placeholder="Surface (ha)" value={newPlot.area_hectares} onChange={e => setNewPlot({...newPlot, area_hectares: e.target.value})} required />
          <input type="text" placeholder="Type de sol" value={newPlot.soil_type} onChange={e => setNewPlot({...newPlot, soil_type: e.target.value})} />
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
          <input type="text" placeholder="Culture (ex: Maïs)" value={newCycle.crop_name} onChange={e => setNewCycle({...newCycle, crop_name: e.target.value})} required />
          <input type="text" placeholder="Saison" value={newCycle.season} onChange={e => setNewCycle({...newCycle, season: e.target.value})} />
          <input type="date" placeholder="Date de semis" value={newCycle.planting_date} onChange={e => setNewCycle({...newCycle, planting_date: e.target.value})} required />
          <input type="number" placeholder="Rendement attendu (t)" value={newCycle.expected_yield} onChange={e => setNewCycle({...newCycle, expected_yield: e.target.value})} />
          <button type="submit">Démarrer le cycle</button>
          <button type="button" onClick={() => setShowCycleForm(false)}>Annuler</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Parcelle</th>
            <th>Culture</th>
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
              <td>{c.crop_name}</td>
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
  );
}

export default CropsList;
