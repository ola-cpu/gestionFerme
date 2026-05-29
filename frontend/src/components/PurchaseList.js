import React, { useState, useEffect } from 'react';

function PurchaseList({ user }) {
  const [purchases, setPurchases] = useState([]);
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('purchases'); // 'purchases' or 'requests'

  useEffect(() => {
    fetchPurchases();
    fetchRequests();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/purchases', { headers: { 'X-User-ID': user?.id } });
      const data = await res.json();
      setPurchases(data);
    } catch (err) {
      setPurchases([{ id: 1, supplier_name: 'Agro-Shop Benin', purchase_date: '2024-01-10', total_amount: 45000, status: 'Received' }]);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/purchases/requests', { headers: { 'X-User-ID': user?.id } });
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
        <div>
          <div style={{marginBottom: '10px'}}>
            <button onClick={() => alert('Nouvelle Commande')}>+ Nouvelle Commande</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fournisseur</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>{p.supplier_name}</td>
                  <td>{p.purchase_date}</td>
                  <td>{p.total_amount?.toLocaleString()} FCFA</td>
                  <td>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: p.status === 'Received' ? '#d4edda' : '#fff3cd'
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {p.status === 'Ordered' && <button onClick={() => alert('Enregistrer Réception')}>Réceptionner</button>}
                    <button>Détails</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div style={{marginBottom: '10px'}}>
            <button onClick={() => alert('Nouvelle Demande')}>+ Nouvelle Demande d'Achat</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Département</th>
                <th>Urgence</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td>{r.request_date}</td>
                  <td>{r.department || 'Général'}</td>
                  <td>
                    <span style={{color: r.urgency === 'Critique' ? 'red' : 'inherit'}}>
                      {r.urgency || 'Normale'}
                    </span>
                  </td>
                  <td>{r.description}</td>
                  <td>{r.status}</td>
                  <td>
                    {r.status === 'Soumis' && <button size="small">Valider</button>}
                    <button size="small">Détails</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PurchaseList;
