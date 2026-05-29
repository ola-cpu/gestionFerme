import React, { useState, useEffect } from 'react';
import {
  Plus, Settings2, X, Info, ChevronRight,
  Trash2, AlertCircle, Beef, Calendar, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showConfig, setShowConfig] = useState(false);

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

  const [newSpecies, setNewSpecies] = useState({
    name: '',
    gestation_duration_days: '',
    adult_age_months: '',
    feed_type: '',
    avg_weight_kg: ''
  });
  const [newBreed, setNewBreed] = useState({ species_id: '', name: '' });

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestion de l'Élevage</h2>
          <p className="text-slate-500 text-sm">Suivi des lots d'animaux et configuration</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`btn ${showConfig ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Settings2 size={18} />
            {showConfig ? 'Fermer Config' : 'Configuration'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Annuler' : 'Nouveau Lot'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-warning/10 border border-warning/20 rounded-xl p-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertCircle size={18} />
              <span className="font-bold text-sm">Alertes Élevage</span>
            </div>
            <ul className="space-y-1">
              {alerts.map(a => (
                <li key={a.id} className="text-sm text-warning/90 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-warning" />
                  {a.message}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="card bg-slate-50 border-slate-200"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-6">Configuration Espèces et Races</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-700">Espèces</h4>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">{species.length} total</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                  {species.map(s => (
                    <div key={s.id} className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{s.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{s.feed_type || 'Alim. non spécifiée'}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if(window.confirm('Supprimer cette espèce ?')) {
                            await fetch(`/api/livestock/species/${s.id}`, { method: 'DELETE', headers: { 'X-User-ID': user?.id } });
                            fetchSpecies();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddSpecies} className="space-y-2 pt-2 border-t border-slate-200">
                  <input type="text" placeholder="Nom espèce" value={newSpecies.name} onChange={e => setNewSpecies({...newSpecies, name: e.target.value})} required className="input w-full text-sm py-1.5" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Gestation (j)" value={newSpecies.gestation_duration_days} onChange={e => setNewSpecies({...newSpecies, gestation_duration_days: e.target.value})} className="input w-full text-xs py-1.5" />
                    <input type="number" placeholder="Poids moy. (kg)" value={newSpecies.avg_weight_kg} onChange={e => setNewSpecies({...newSpecies, avg_weight_kg: e.target.value})} className="input w-full text-xs py-1.5" />
                  </div>
                  <button type="submit" className="btn btn-secondary w-full py-1.5 text-xs">Ajouter l'espèce</button>
                </form>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-700">Races</h4>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">{breeds.length} total</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                  {breeds.map(b => (
                    <div key={b.id} className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{b.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{b.species_name}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if(window.confirm('Supprimer cette race ?')) {
                            await fetch(`/api/livestock/breeds/${b.id}`, { method: 'DELETE', headers: { 'X-User-ID': user?.id } });
                            fetchBreeds();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddBreed} className="space-y-2 pt-2 border-t border-slate-200">
                  <select value={newBreed.species_id} onChange={e => setNewBreed({...newBreed, species_id: e.target.value})} required className="input w-full text-sm py-1.5">
                    <option value="">Sélectionner espèce</option>
                    {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input type="text" placeholder="Nom race" value={newBreed.name} onChange={e => setNewBreed({...newBreed, name: e.target.value})} required className="input w-full text-sm py-1.5" />
                  <button type="submit" className="btn btn-secondary w-full py-1.5 text-xs">Ajouter la race</button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="card p-0 overflow-hidden"
          >
            <form onSubmit={handleAdd} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50/50">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Espèce</label>
                <select
                  value={newBatch.species_id}
                  onChange={e => setNewBatch({...newBatch, species_id: e.target.value})}
                  required
                  className="input w-full text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {species.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Nom du lot</label>
                <input
                  type="text"
                  placeholder="ex: Poulets Chair A1"
                  value={newBatch.batch_name}
                  onChange={e => setNewBatch({...newBatch, batch_name: e.target.value})}
                  required
                  className="input w-full text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Date d'arrivée</label>
                <input
                  type="date"
                  value={newBatch.arrival_date}
                  onChange={e => setNewBatch({...newBatch, arrival_date: e.target.value})}
                  required
                  className="input w-full text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Nombre initial</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0"
                    value={newBatch.initial_count}
                    onChange={e => setNewBatch({...newBatch, initial_count: e.target.value, current_count: e.target.value})}
                    required
                    className="input w-full text-sm"
                  />
                  <button type="submit" className="btn btn-primary whitespace-nowrap">Enregistrer</button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {batches.map(batch => (
          <motion.div
            key={batch.id}
            whileHover={{ y: -5 }}
            className="card cursor-pointer group border-slate-100 hover:border-primary-200 hover:shadow-md transition-all"
            onClick={() => onSelectBatch(batch)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                <Beef size={24} />
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                batch.status === 'Actif' ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'
              }`}>
                {batch.status}
              </span>
            </div>

            <h4 className="font-bold text-slate-800 text-lg mb-1">{batch.batch_name}</h4>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
              <span className="font-medium text-slate-700">{batch.species_name}</span>
            </p>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Effectif</p>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{batch.current_count}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Arrivée</p>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{new Date(batch.arrival_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Voir les détails
              <ChevronRight size={16} />
            </div>
          </motion.div>
        ))}
      </div>

      {batches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Beef size={48} strokeWidth={1} className="mb-4" />
          <p>Aucun lot d'élevage trouvé</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-primary-600 font-medium hover:underline text-sm">
            Ajouter votre premier lot
          </button>
        </div>
      )}
    </div>
  );
}

export default LivestockList;
