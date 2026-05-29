import React, { useState, useEffect } from 'react';

function CropDetail({ user, cycleId, onBack }) {
  const [cycle, setCycle] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [observations, setObservations] = useState([]);
  const [irrigation, setIrrigation] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ task_type: '', task_date: '', description: '', cost: 0 });

  const [showInputForm, setShowInputForm] = useState(null); // taskId
  const [newInput, setNewInput] = useState({ stock_item_id: '', quantity: 0, unit: '', cost: 0 });

  const [showObservationForm, setShowObservationForm] = useState(false);
  const [newObservation, setNewObservation] = useState({ observation_date: '', growth_stage: '', health_status: '', pests_observations: '', diseases_observations: '', recommendations: '' });

  const [showIrrigationForm, setShowIrrigationForm] = useState(false);
  const [newIrrigation, setNewIrrigation] = useState({ irrigation_date: '', water_quantity_m3: '', duration_minutes: '', cost: 0, method: '' });

  useEffect(() => {
    fetchData();
    fetchStockItems();
  }, [cycleId]);

  const fetchData = async () => {
    try {
      const cycleRes = await fetch(`/api/crops/${cycleId}`, { headers: { 'X-User-ID': user?.id } });
      const cycleData = await cycleRes.json();
      setCycle(cycleData);

      const tasksRes = await fetch(`/api/crops/${cycleId}/tasks`, { headers: { 'X-User-ID': user?.id } });
      const tasksData = await tasksRes.json();
      const tasksWithInputs = await Promise.all(tasksData.map(async (task) => {
        const inputsRes = await fetch(`/api/crops/tasks/${task.id}/inputs`, { headers: { 'X-User-ID': user?.id } });
        const inputsData = await inputsRes.json();
        return { ...task, inputs: Array.isArray(inputsData) ? inputsData : [] };
      }));
      setTasks(tasksWithInputs);

      const obsRes = await fetch(`/api/crops/${cycleId}/observations`, { headers: { 'X-User-ID': user?.id } });
      const obsData = await obsRes.json();
      setObservations(Array.isArray(obsData) ? obsData : []);

      const irrRes = await fetch(`/api/crops/${cycleId}/irrigation`, { headers: { 'X-User-ID': user?.id } });
      const irrData = await irrRes.json();
      setIrrigation(Array.isArray(irrData) ? irrData : []);

      const perfRes = await fetch(`/api/crops/${cycleId}/performance`, { headers: { 'X-User-ID': user?.id } });
      const perfData = await perfRes.json();
      setPerformance(perfData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockItems = async () => {
    try {
      const res = await fetch('/api/stocks', { headers: { 'X-User-ID': user?.id } });
      const data = await res.json();
      setStockItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/crops/tasks', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, crop_cycle_id: cycleId })
      });
      setShowTaskForm(false);
      setNewTask({ task_type: '', task_date: '', description: '', cost: 0 });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddObservation = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/crops/observations', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newObservation, crop_cycle_id: cycleId, recorded_by: user?.id })
      });
      setShowObservationForm(false);
      setNewObservation({ observation_date: '', growth_stage: '', health_status: '', pests_observations: '', diseases_observations: '', recommendations: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddIrrigation = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/crops/irrigation', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newIrrigation, crop_cycle_id: cycleId })
      });
      setShowIrrigationForm(false);
      setNewIrrigation({ irrigation_date: '', water_quantity_m3: '', duration_minutes: '', cost: 0, method: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInput = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crops/inputs', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newInput, crop_task_id: showInputForm })
      });
      if (res.ok) {
        setShowInputForm(null);
        setNewInput({ stock_item_id: '', quantity: 0, unit: '', cost: 0 });
        fetchData();
      } else {
          const error = await res.json();
          alert(error.error || 'Erreur lors de l\'ajout de l\'intrant');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!cycle) return <div>Chargement...</div>;

  return (
    <div className="crop-detail">
      <button onClick={onBack} style={{ marginBottom: '20px' }}>← Retour à la liste</button>
      <h2>{cycle.crop_name} - {cycle.plot_name} ({cycle.season})</h2>
      <p>Campagne: {cycle.campaign_name || 'N/A'} | Type: {cycle.crop_type_name || 'N/A'}</p>

      <div className="performance-summary">
        <h3>Performance</h3>
        {performance && (
          <div className="metrics-grid" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="metric-card" style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.9em', color: '#666' }}>Coût Total</label>
              <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{performance.total_cost} FCFA</span>
            </div>
            <div className="metric-card" style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.9em', color: '#666' }}>Rendement/ha</label>
              <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{performance.yield_per_ha} t/ha</span>
              <small style={{ display: 'block' }}>Objectif: {performance.expected_yield_per_ha} t/ha</small>
            </div>
            <div className="metric-card" style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.9em', color: '#666' }}>Coût/ha</label>
              <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{performance.cost_per_ha} FCFA/ha</span>
            </div>
          </div>
        )}
      </div>

      <div className="tabs" style={{ marginTop: '30px', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => setActiveTab('tasks')} style={{ padding: '10px 20px', border: 'none', background: activeTab === 'tasks' ? '#eee' : 'transparent', borderBottom: activeTab === 'tasks' ? '2px solid #333' : 'none' }}>Travaux</button>
        <button onClick={() => setActiveTab('observations')} style={{ padding: '10px 20px', border: 'none', background: activeTab === 'observations' ? '#eee' : 'transparent', borderBottom: activeTab === 'observations' ? '2px solid #333' : 'none' }}>Observations</button>
        <button onClick={() => setActiveTab('irrigation')} style={{ padding: '10px 20px', border: 'none', background: activeTab === 'irrigation' ? '#eee' : 'transparent', borderBottom: activeTab === 'irrigation' ? '2px solid #333' : 'none' }}>Irrigation</button>
      </div>

      <div className="tab-content" style={{ marginTop: '20px' }}>
        {activeTab === 'tasks' && (
          <div className="tasks-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Travaux & Suivi</h3>
              <button onClick={() => setShowTaskForm(true)}>+ Ajouter un travail</button>
            </div>

            {showTaskForm && (
              <form onSubmit={handleAddTask} className="modal-form">
                <h4>Nouveau Travail</h4>
                <input type="text" placeholder="Type (Labour, Semis...)" value={newTask.task_type} onChange={e => setNewTask({...newTask, task_type: e.target.value})} required />
                <input type="date" value={newTask.task_date} onChange={e => setNewTask({...newTask, task_date: e.target.value})} required />
                <textarea placeholder="Description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                <input type="number" placeholder="Coût Main d'oeuvre" value={newTask.cost} onChange={e => setNewTask({...newTask, cost: e.target.value})} />
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={() => setShowTaskForm(false)}>Annuler</button>
              </form>
            )}

            <div className="task-list">
              {tasks.map(task => (
                <div key={task.id} className="task-card" style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '4px' }}>
                  <div className="task-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{new Date(task.task_date).toLocaleDateString()} - {task.task_type}</strong>
                    <span>{task.cost} FCFA</span>
                  </div>
                  <p>{task.description}</p>

                  <div className="task-inputs" style={{ marginTop: '10px', background: '#f9f9f9', padding: '10px' }}>
                    <h5>Intrants utilisés</h5>
                    <ul>
                      {task.inputs && task.inputs.map(input => (
                        <li key={input.id}>{input.item_name}: {input.quantity} {input.unit} ({input.cost} FCFA)</li>
                      ))}
                    </ul>
                    <button onClick={() => setShowInputForm(task.id)}>+ Ajouter intrant</button>
                  </div>

                  {showInputForm === task.id && (
                    <form onSubmit={handleAddInput} className="mini-form">
                      <select value={newInput.stock_item_id} onChange={e => setNewInput({...newInput, stock_item_id: e.target.value})} required>
                        <option value="">Sélectionner un article</option>
                        {stockItems.map(item => (
                          <option key={item.id} value={item.id}>{item.name} (Dispo: {item.current_stock} {item.unit})</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Quantité" value={newInput.quantity} onChange={e => setNewInput({...newInput, quantity: e.target.value})} required />
                      <input type="text" placeholder="Unité" value={newInput.unit} onChange={e => setNewInput({...newInput, unit: e.target.value})} required />
                      <input type="number" placeholder="Coût" value={newInput.cost} onChange={e => setNewInput({...newInput, cost: e.target.value})} required />
                      <button type="submit">Ajouter</button>
                      <button type="button" onClick={() => setShowInputForm(null)}>X</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'observations' && (
          <div className="observations-section">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Suivi Agronomique</h3>
              <button onClick={() => setShowObservationForm(true)}>+ Nouvelle Observation</button>
            </div>

            {showObservationForm && (
              <form onSubmit={handleAddObservation} className="modal-form">
                <h4>Observation Terrain</h4>
                <input type="date" value={newObservation.observation_date} onChange={e => setNewObservation({...newObservation, observation_date: e.target.value})} required />
                <input type="text" placeholder="Stade de croissance" value={newObservation.growth_stage} onChange={e => setNewObservation({...newObservation, growth_stage: e.target.value})} />
                <input type="text" placeholder="État sanitaire" value={newObservation.health_status} onChange={e => setNewObservation({...newObservation, health_status: e.target.value})} />
                <textarea placeholder="Ravageurs observés" value={newObservation.pests_observations} onChange={e => setNewObservation({...newObservation, pests_observations: e.target.value})} />
                <textarea placeholder="Maladies observées" value={newObservation.diseases_observations} onChange={e => setNewObservation({...newObservation, diseases_observations: e.target.value})} />
                <textarea placeholder="Recommandations" value={newObservation.recommendations} onChange={e => setNewObservation({...newObservation, recommendations: e.target.value})} />
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={() => setShowObservationForm(false)}>Annuler</button>
              </form>
            )}

            <div className="observation-list">
              {observations.map(obs => (
                <div key={obs.id} className="obs-card" style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '4px' }}>
                  <strong>{new Date(obs.observation_date).toLocaleDateString()} - {obs.growth_stage}</strong>
                  <p>Santé: {obs.health_status}</p>
                  <p>Observations: {obs.pests_observations} {obs.diseases_observations}</p>
                  {obs.recommendations && <p style={{ color: 'green' }}>Rec: {obs.recommendations}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'irrigation' && (
          <div className="irrigation-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Irrigation</h3>
              <button onClick={() => setShowIrrigationForm(true)}>+ Enregistrer Irrigation</button>
            </div>

            {showIrrigationForm && (
              <form onSubmit={handleAddIrrigation} className="modal-form">
                <input type="date" value={newIrrigation.irrigation_date} onChange={e => setNewIrrigation({...newIrrigation, irrigation_date: e.target.value})} required />
                <input type="number" placeholder="Quantité (m3)" value={newIrrigation.water_quantity_m3} onChange={e => setNewIrrigation({...newIrrigation, water_quantity_m3: e.target.value})} />
                <input type="number" placeholder="Durée (min)" value={newIrrigation.duration_minutes} onChange={e => setNewIrrigation({...newIrrigation, duration_minutes: e.target.value})} />
                <input type="number" placeholder="Coût" value={newIrrigation.cost} onChange={e => setNewIrrigation({...newIrrigation, cost: e.target.value})} />
                <input type="text" placeholder="Méthode" value={newIrrigation.method} onChange={e => setNewIrrigation({...newIrrigation, method: e.target.value})} />
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={() => setShowIrrigationForm(false)}>Annuler</button>
              </form>
            )}

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Quantité (m3)</th>
                  <th>Durée (min)</th>
                  <th>Méthode</th>
                  <th>Coût</th>
                </tr>
              </thead>
              <tbody>
                {irrigation.map(i => (
                  <tr key={i.id}>
                    <td>{new Date(i.irrigation_date).toLocaleDateString()}</td>
                    <td>{i.water_quantity_m3}</td>
                    <td>{i.duration_minutes}</td>
                    <td>{i.method}</td>
                    <td>{i.cost} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CropDetail;
