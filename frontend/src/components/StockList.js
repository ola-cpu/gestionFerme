import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

function StockList({ user }) {
  const [stocks, setStocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', category_id: 1, unit: 'kg', current_stock: 0,
    minimum_threshold: 10, maximum_threshold: 1000,
    code: '', qr_code: '', valuation_method: 'CMUP'
  });

  useEffect(() => {
    fetchStocks();
    fetchWarehouses();
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses', { headers: { 'X-User-ID': user?.id } });
      const data = await response.json();
      setWarehouses(data);
    } catch (err) { console.error(err); }
  };

  const fetchStocks = async () => {
    try {
      const url = selectedWarehouse ? `/api/stocks?warehouse_id=${selectedWarehouse}` : '/api/stocks';
      const response = await fetch(url, { headers: { 'X-User-ID': user?.id } });
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
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
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
        await fetch(`/api/stocks/${id}`, { headers: { 'X-User-ID': user?.id },  method: 'DELETE' });
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

      <div style={{ marginBottom: '15px' }}>
        <select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
          <option value="">Tous les magasins</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="module-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input type="text" placeholder="Code Article" value={newItem.code} onChange={e => setNewItem({...newItem, code: e.target.value})} />
          <input type="text" placeholder="Nom de l'article" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
          <input type="text" placeholder="QR Code" value={newItem.qr_code} onChange={e => setNewItem({...newItem, qr_code: e.target.value})} />
          <select value={newItem.category_id} onChange={e => setNewItem({...newItem, category_id: e.target.value})}>
             <option value="1">Aliments</option>
             <option value="2">Médicaments</option>
          </select>
          <input type="number" placeholder="Quantité Initiale" value={newItem.current_stock} onChange={e => setNewItem({...newItem, current_stock: e.target.value})} required />
          <input type="text" placeholder="Unité (kg, L...)" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} required />
          <input type="number" placeholder="Seuil Min" value={newItem.minimum_threshold} onChange={e => setNewItem({...newItem, minimum_threshold: e.target.value})} required />
          <input type="number" placeholder="Seuil Max" value={newItem.maximum_threshold} onChange={e => setNewItem({...newItem, maximum_threshold: e.target.value})} />
          <select value={newItem.valuation_method} onChange={e => setNewItem({...newItem, valuation_method: e.target.value})}>
             <option value="CMUP">CMUP</option>
             <option value="FIFO">FIFO</option>
          </select>
          <button type="submit" style={{ gridColumn: 'span 2' }}>Enregistrer</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Article / QR</th>
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
              <td style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div>
                   <QRCodeSVG value={item.qr_code || item.code || item.name} size={40} />
                </div>
                <div>
                    <strong>{item.name}</strong><br/>
                    <small style={{color: '#666'}}>Methode: {item.valuation_method}</small>
                </div>
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
