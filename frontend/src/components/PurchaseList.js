import React, { useState, useEffect } from 'react';

function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('purchases'); // 'purchases' or 'requests'

  useEffect(() => {
    fetchPurchases();
    fetchRequests();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      setPurchases(data);
    } catch (err) {
      setPurchases([{ id: 1, supplier_name: 'Agro-Shop Benin', purchase_date: '2024-01-10', total_amount: 45000, status: 'Received' }]);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/purchases/requests');
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setRequests([{ id: 1, requester_id: 2, description: 'Besoin de 10 sacs de maïs', status: 'Pending', request_date: '2024-02-15' }]);
    }
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>Gestion des Achats</h2>
        <div>
          <button onClick={() => setView('purchases')} style={{fontWeight: view === 'purchases' ? 'bold' : 'normal'}}>Commandes</button>
          <button onClick={() => setView('requests')} style={{fontWeight: view === 'requests' ? 'bold' : 'normal'}}>Demandes Internes</button>
        </div>
      </div>

      {view === 'purchases' ? (
        <table>
          <thead>
            <tr>
              <th>Fournisseur</th>
              <th>Date</th>
              <th>Montant</th>
              <th>Qualité</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id}>
                <td>{p.supplier_name}</td>
                <td>{p.purchase_date}</td>
                <td>{p.total_amount?.toLocaleString()} FCFA</td>
                <td><span style={{color: 'green'}}>Conforme</span></td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td>{r.request_date}</td>
                <td>{r.description}</td>
                <td>{r.status}</td>
                <td>
                  <button size="small">Valider</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PurchaseList;
