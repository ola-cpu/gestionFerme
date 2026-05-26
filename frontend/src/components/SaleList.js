import React, { useState, useEffect } from 'react';

function SaleList() {
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('sales'); // sales, clients, catalog

  useEffect(() => {
    fetch('/api/sales').then(res => res.json()).then(setSales).catch(() => {});
    fetch('/api/sales/clients').then(res => res.json()).then(setClients).catch(() => {});
    fetch('/api/stocks').then(res => res.json()).then(data => {
        // Filter products using the is_product boolean from the new schema
        setProducts(data.filter(i => i.is_product));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Module Ventes</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setView('sales')}>Ventes & Factures</button>
        <button onClick={() => setView('clients')}>Clients</button>
        <button onClick={() => setView('catalog')}>Catalogue Produits</button>
      </div>

      {view === 'sales' && (
        <div>
          <h3>Historique des Ventes</h3>
          <table>
            <thead>
              <tr>
                <th>Réf</th>
                <th>Client</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Type</th>
                <th>Statut Paiement</th>
                <th>Livraison</th>
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
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.type}</td>
                  <td>{c.phone}</td>
                  <td>{c.email}</td>
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
