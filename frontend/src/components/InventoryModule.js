import React, { useState, useEffect } from 'react';

function InventoryModule({ user }) {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState({}); // stock_item_id -> actual_quantity

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    const res = await fetch('/api/warehouses', { headers: { 'X-User-ID': user?.id } });
    setWarehouses(await res.json());
  };

  const startInventory = async () => {
    if (!selectedWarehouse) return;
    const res = await fetch(`/api/stocks?warehouse_id=${selectedWarehouse}`, { headers: { 'X-User-ID': user?.id } });
    const data = await res.json();
    setItems(data);
    const initialInv = {};
    data.forEach(item => {
        initialInv[item.id] = item.current_stock;
    });
    setInventory(initialInv);
  };

  const handleQuantityChange = (id, val) => {
    setInventory({ ...inventory, [id]: val });
  };

  const submitInventory = async () => {
    if (!window.confirm("Valider l'inventaire ? Les stocks seront ajustés.")) return;

    try {
        const adjustments = items.map(item => ({
            stock_item_id: item.id,
            theoretical: parseFloat(item.current_stock),
            actual: parseFloat(inventory[item.id])
        })).filter(adj => adj.theoretical !== adj.actual);

        if (adjustments.length === 0) {
            alert("Aucun écart constaté.");
            setItems([]);
            return;
        }

        const response = await fetch('/api/stocks/bulk-adjust', {
            method: 'POST',
            headers: { 'X-User-ID': user?.id, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                warehouse_id: selectedWarehouse,
                adjustments
            })
        });

        if (response.ok) {
            alert("Inventaire terminé et stocks mis à jour.");
            setItems([]);
        } else {
            const error = await response.json();
            alert("Erreur: " + error.error);
        }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="inventory-module">
      <h2>Inventaire de Magasin</h2>
      <div style={{ marginBottom: '20px' }}>
        <select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
          <option value="">Sélectionner un magasin</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <button onClick={startInventory} disabled={!selectedWarehouse}>Lancer l'inventaire</button>
      </div>

      {items.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th>Théorique</th>
                <th>Physique (Réel)</th>
                <th>Écart</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.current_stock} {item.unit}</td>
                  <td>
                    <input
                        type="number"
                        value={inventory[item.id]}
                        onChange={e => handleQuantityChange(item.id, e.target.value)}
                    />
                  </td>
                  <td style={{ color: (inventory[item.id] - item.current_stock) === 0 ? 'green' : 'red' }}>
                    {(inventory[item.id] - item.current_stock).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={submitInventory} style={{ marginTop: '20px', backgroundColor: '#2ecc71', color: 'white' }}>
            Valider et Ajuster les Stocks
          </button>
        </>
      )}
    </div>
  );
}

export default InventoryModule;
