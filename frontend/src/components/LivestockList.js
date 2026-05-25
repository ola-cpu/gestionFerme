import React, { useState, useEffect } from 'react';

function LivestockList({ onSelectBatch }) {
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

  useEffect(() => {
    fetchBatches();
    fetchSpecies();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/livestock');
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
      const response = await fetch('/api/livestock/species');
      const data = await response.json();
      setSpecies(data);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/livestock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (loading) return <p>Chargement de l'élevage...</p>;

  return (
    <div className="livestock-list">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>Gestion de l'Élevage</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Nouveau Lot'}
        </button>
      </div>

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
