import React, { useState, useEffect } from 'react';

function SaleList({ user }) {
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [view, setView] = useState('sales'); // sales, clients, catalog, deliveries

  useEffect(() => {
    fetch('/api/sales', { headers: { 'X-User-ID': user?.id } }).then(res => res.json()).then(setSales).catch(() => {});
    fetch('/api/sales/deliveries/all', { headers: { 'X-User-ID': user?.id } }).then(res => res.json()).then(setDeliveries).catch(() => {});
    fetch('/api/sales/clients', { headers: { 'X-User-ID': user?.id } }).then(res => res.json()).then(setClients).catch(() => {});
    fetch('/api/stocks', { headers: { 'X-User-ID': user?.id } }).then(res => res.json()).then(data => {
        // Filter products using the is_product boolean from the new schema
        setProducts(data.filter(i => i.is_product));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Module Ventes</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setView('sales')}>Ventes & Devis</button>
        <button onClick={() => setView('clients')}>Clients</button>
        <button onClick={() => setView('catalog')}>Catalogue Produits</button>
        <button onClick={() => setView('deliveries')}>Livraisons</button>
      </div>

      {view === 'sales' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <h3>Historique des Ventes & Devis</h3>
            <button onClick={() => alert('Nouveau Devis/Vente')}>+ Créer</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Réf</th>
                <th>Client</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Type</th>
                <th>Paiement</th>
                <th>Livraison</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td>{s.reference_number}</td>
                  <td>Client #{s.client_id}</td>
                  <td>{s.sale_date}</td>
                  <td>{s.total_amount?.toLocaleString()} FCFA</td>
                  <td>{s.document_type}</td>
                  <td>{s.payment_status}</td>
                  <td>{s.delivery_status}</td>
                  <td>
                    {s.document_type === 'Devis' && <button size="small" onClick={() => alert('Convertir Devis')}>Convertir</button>}
                    {s.delivery_status === 'Pending' && s.document_type !== 'Devis' && <button size="small" onClick={() => alert('Planifier Livraison')}>Livrer</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'clients' && (
        <div>
          <h3>Gestion des Clients</h3>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Téléphone</th>
                <th>Limite Crédit</th>
                <th>Localisation</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.type}</td>
                  <td>{c.phone}</td>
                  <td>{c.credit_limit?.toLocaleString() || 0} FCFA</td>
                  <td>{c.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'deliveries' && (
        <div>
          <h3>Suivi des Livraisons</h3>
          <table>
            <thead>
              <tr>
                <th>Vente</th>
                <th>Client</th>
                <th>Chauffeur</th>
                <th>Véhicule</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(d => (
                <tr key={d.id}>
                  <td>{d.reference_number}</td>
                  <td>{d.client_name}</td>
                  <td>{d.driver_name}</td>
                  <td>{d.vehicle_plate}</td>
                  <td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'catalog' && (
        <div>
          <h3>Catalogue Produits (Prix de Vente)</h3>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Unité</th>
                <th>Prix de Vente</th>
                <th>Stock Actuel</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.unit}</td>
                  <td>{p.sale_price?.toLocaleString()} FCFA</td>
                  <td>{p.current_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SaleList;
