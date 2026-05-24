import React from 'react';

function SaleList() {
  const sales = [
    { id: 1, client: 'Restaurant Le Gourmand', product: 'Poulets', date: '2024-02-01', amount: '120.000 FCFA', status: 'Payé' }
  ];

  return (
    <div>
      <h2>Gestion des Ventes</h2>
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Produit</th>
            <th>Date</th>
            <th>Montant</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(s => (
            <tr key={s.id}>
              <td>{s.client}</td>
              <td>{s.product}</td>
              <td>{s.date}</td>
              <td>{s.amount}</td>
              <td>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SaleList;
