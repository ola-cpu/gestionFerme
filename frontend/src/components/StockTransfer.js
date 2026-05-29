import React, { useState, useEffect } from 'react';

function StockTransfer({ user }) {
  const [warehouses, setWarehouses] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [transfer, setTransfer] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    stock_item_id: '',
    batch_id: '',
    quantity: 0
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (transfer.from_warehouse_id) {
        fetchStocks();
    }
  }, [transfer.from_warehouse_id]);

  useEffect(() => {
    if (transfer.stock_item_id) {
        fetchBatches();
    }
  }, [transfer.stock_item_id]);

  const fetchWarehouses = async () => {
    const res = await fetch('/api/warehouses', { headers: { 'X-User-ID': user?.id } });
    setWarehouses(await res.json());
  };

  const fetchStocks = async () => {
    const res = await fetch(`/api/stocks?warehouse_id=${transfer.from_warehouse_id}`, { headers: { 'X-User-ID': user?.id } });
    setStocks(await res.json());
  };

  const fetchBatches = async () => {
    const res = await fetch(`/api/stocks/${transfer.stock_item_id}/batches`, { headers: { 'X-User-ID': user?.id } });
    const allBatches = await res.json();
    // Filter batches by source warehouse
    setBatches(allBatches.filter(b => b.warehouse_id == transfer.from_warehouse_id));
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (transfer.from_warehouse_id === transfer.to_warehouse_id) {
        alert("Les magasins source et destination doivent être différents");
        return;
    }
    try {
      const response = await fetch('/api/stocks/transfers', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...transfer, user_id: user.id })
      });
      if (response.ok) {
        alert("Transfert réussi");
        setTransfer({ from_warehouse_id: '', to_warehouse_id: '', stock_item_id: '', batch_id: '', quantity: 0 });
      } else {
        const error = await response.json();
        alert("Erreur: " + error.error);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="stock-transfer">
      <h2>Transfert entre Magasins</h2>
      <form onSubmit={handleTransfer} className="module-form">
        <label>De (Magasin Source):</label>
        <select value={transfer.from_warehouse_id} onChange={e => setTransfer({...transfer, from_warehouse_id: e.target.value})} required>
          <option value="">Sélectionner source</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>

        <label>Article:</label>
        <select value={transfer.stock_item_id} onChange={e => setTransfer({...transfer, stock_item_id: e.target.value})} required disabled={!transfer.from_warehouse_id}>
          <option value="">Sélectionner article</option>
          {stocks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label>Lot:</label>
        <select value={transfer.batch_id} onChange={e => setTransfer({...transfer, batch_id: e.target.value})} required disabled={!transfer.stock_item_id}>
          <option value="">Sélectionner lot</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.batch_number} (Dispo: {b.current_quantity})</option>)}
        </select>

        <label>Vers (Magasin Destination):</label>
        <select value={transfer.to_warehouse_id} onChange={e => setTransfer({...transfer, to_warehouse_id: e.target.value})} required>
          <option value="">Sélectionner destination</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>

        <label>Quantité à transférer:</label>
        <input type="number" step="0.01" value={transfer.quantity} onChange={e => setTransfer({...transfer, quantity: e.target.value})} required />

        <button type="submit">Confirmer le Transfert</button>
      </form>
    </div>
  );
}

export default StockTransfer;
