import React, { useState, useEffect } from 'react';

function StockList() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category_id: 1, unit: 'kg', current_stock: 0, minimum_threshold: 10 });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch('/api/stocks');
      const data = await response.json();
      setStocks(data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error, using mock data", err);
      setStocks([
        { id: 1, name: 'Maïs Concassé', category_id: 1, unit: 'kg', current_stock: 500, minimum_threshold: 100 }
      ]);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (response.ok) {
        fetchStocks();
        setShowForm(false);
        setNewItem({ name: '', category_id: 1, unit: 'kg', current_stock: 0, minimum_threshold: 10 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cet article ?')) {
      try {
        await fetch(`/api/stocks/${id}`, { method: 'DELETE' });
        fetchStocks();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <p>Chargement des stocks...</p>;

  return (
    <div className="stock-list">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>État des Stocks</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Ajouter un article'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="module-form">
          <input type="text" placeholder="Nom de l'article" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
          <input type="number" placeholder="Quantité" value={newItem.current_stock} onChange={e => setNewItem({...newItem, current_stock: e.target.value})} required />
          <input type="text" placeholder="Unité (kg, L...)" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} required />
          <input type="number" placeholder="Seuil alerte" value={newItem.minimum_threshold} onChange={e => setNewItem({...newItem, minimum_threshold: e.target.value})} required />
          <button type="submit">Enregistrer</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th>Catégorie</th>
            <th>Quantité</th>
            <th>Unité</th>
            <th>Status / Alertes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(item => (
            <tr key={item.id}>
              <td>
                <strong>{item.name}</strong><br/>
                <small style={{color: '#666'}}>Methode: {item.valuation_method}</small>
              </td>
              <td>{item.category_name}</td>
              <td>{item.current_stock}</td>
              <td>{item.unit}</td>
              <td>
                {item.current_stock <= item.minimum_threshold &&
                  <div style={{color: 'red', fontWeight: 'bold'}}>⚠️ Seuil Critique</div>
                }
                {item.near_expiry_count > 0 &&
                  <div style={{color: 'orange'}}>📅 {item.near_expiry_count} lot(s) proche expiration</div>
                }
                {item.current_stock > item.minimum_threshold && item.near_expiry_count === 0 &&
                  <span style={{color: 'green'}}>Correct</span>
                }
              </td>
              <td>
                <button onClick={() => {}} title="Détails/Lots">Lots</button>
                <button onClick={() => {}} title="Mouvements">Mvts</button>
                <button onClick={() => handleDelete(item.id)} style={{color: 'red'}}>Suppr.</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
        <h3>Inventaire Périodique</h3>
        <p>Enregistrer les écarts constatés lors du comptage physique.</p>
        <button disabled>Démarrer un inventaire</button>
      </div>
    </div>
  );
}

export default StockList;
