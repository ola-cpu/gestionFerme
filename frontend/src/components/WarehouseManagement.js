import React, { useState, useEffect } from 'react';

function WarehouseManagement({ user }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', type: 'Magasin', location: '', capacity: 0, manager_id: user?.id, conditions: '' });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses', { headers: { 'X-User-ID': user?.id } });
      const data = await response.json();
      setWarehouses(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id, 'Content-Type': 'application/json' },
        body: JSON.stringify(newWarehouse)
      });
      if (response.ok) {
        fetchWarehouses();
        setShowForm(false);
        setNewWarehouse({ name: '', type: 'Magasin', location: '', capacity: 0, manager_id: user?.id, conditions: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Chargement des magasins...</p>;

  return (
    <div className="warehouse-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Gestion des Magasins et Entrepôts</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Ajouter un magasin'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="module-form">
          <input type="text" placeholder="Nom du magasin" value={newWarehouse.name} onChange={e => setNewWarehouse({ ...newWarehouse, name: e.target.value })} required />
          <select value={newWarehouse.type} onChange={e => setNewWarehouse({ ...newWarehouse, type: e.target.value })}>
            <option value="Magasin">Magasin</option>
            <option value="Entrepôt">Entrepôt</option>
            <option value="Dépôt">Dépôt</option>
          </select>
          <input type="text" placeholder="Localisation" value={newWarehouse.location} onChange={e => setNewWarehouse({ ...newWarehouse, location: e.target.value })} />
          <input type="number" placeholder="Capacité" value={newWarehouse.capacity} onChange={e => setNewWarehouse({ ...newWarehouse, capacity: e.target.value })} />
          <textarea placeholder="Conditions de stockage" value={newWarehouse.conditions} onChange={e => setNewWarehouse({ ...newWarehouse, conditions: e.target.value })} />
          <button type="submit">Enregistrer</button>
        </form>
      )}

      <div className="card-grid">
        {warehouses.map(w => (
          <div key={w.id} className="card">
            <h3>{w.name}</h3>
            <p><strong>Type:</strong> {w.type}</p>
            <p><strong>Localisation:</strong> {w.location}</p>
            <p><strong>Responsable:</strong> {w.manager_name || 'Non assigné'}</p>
            <p><strong>Capacité:</strong> {w.capacity} m³</p>
            <div style={{ marginTop: '10px' }}>
              <button size="small">Zones</button>
              <button size="small">Inventaire</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WarehouseManagement;
