import React, { useState, useEffect } from 'react';

function CropDetail({ cycleId, onBack }) {
  const [cycle, setCycle] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [stockItems, setStockItems] = useState([]);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ task_type: '', task_date: '', description: '', cost: 0 });

  const [showInputForm, setShowInputForm] = useState(null); // taskId
  const [newInput, setNewInput] = useState({ stock_item_id: '', quantity: 0, unit: '', cost: 0 });

  useEffect(() => {
    fetchData();
    fetchStockItems();
  }, [cycleId]);

  const fetchData = async () => {
    try {
      const cycleRes = await fetch(`/api/crops/${cycleId}`);
      const cycleData = await cycleRes.json();
      setCycle(cycleData);

      const tasksRes = await fetch(`/api/crops/${cycleId}/tasks`);
      const tasksData = await tasksRes.json();

      // Fetch inputs for each task
      const tasksWithInputs = await Promise.all(tasksData.map(async (task) => {
        const inputsRes = await fetch(`/api/crops/tasks/${task.id}/inputs`);
        const inputsData = await inputsRes.json();
        return { ...task, inputs: inputsData };
      }));
      setTasks(tasksWithInputs);

      const perfRes = await fetch(`/api/crops/${cycleId}/performance`);
      const perfData = await perfRes.json();
      setPerformance(perfData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockItems = async () => {
    try {
      const res = await fetch('/api/stocks');
      const data = await res.json();
      setStockItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/crops/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, crop_cycle_id: cycleId })
      });
      setShowTaskForm(false);
      setNewTask({ task_type: '', task_date: '', description: '', cost: 0 });
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
        headers: { 'Content-Type': 'application/json' },
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
      <button onClick={onBack}>← Retour à la liste</button>
      <h2>{cycle.crop_name} - {cycle.plot_name} ({cycle.season})</h2>

      <div className="performance-summary">
        <h3>Performance</h3>
        {performance && (
          <div className="metrics-grid">
            <div className="metric-card">
              <label>Coût Total</label>
              <span>{performance.total_cost} FCFA</span>
            </div>
            <div className="metric-card">
              <label>Rendement/ha</label>
              <span>{performance.yield_per_ha} t/ha</span>
            </div>
            <div className="metric-card">
              <label>Coût/ha</label>
              <span>{performance.cost_per_ha} FCFA/ha</span>
            </div>
          </div>
        )}
      </div>

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
            <div key={task.id} className="task-card">
              <div className="task-header">
                <strong>{task.task_date} - {task.task_type}</strong>
                <span>{task.cost} FCFA</span>
              </div>
              <p>{task.description}</p>

              <div className="task-inputs">
                <h5>Intrants utilisés</h5>
                <ul>
                  {task.inputs && task.inputs.map(input => (
                    <li key={input.id}>{input.item_name}: {input.quantity} {input.unit} ({input.cost} FCFA)</li>
                  ))}
                </ul>
                <button size="small" onClick={() => setShowInputForm(task.id)}>+ Ajouter intrant</button>
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
    </div>
  );
}

export default CropDetail;
