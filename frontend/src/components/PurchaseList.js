import React from 'react';

function PurchaseList() {
  const purchases = [
    { id: 1, supplier: 'Agro-Shop Benin', item: 'Semences', date: '2024-01-10', amount: '45.000 FCFA', status: 'Reçu' }
  ];

  return (
    <div>
      <h2>Gestion des Achats</h2>
      <table>
        <thead>
          <tr>
            <th>Fournisseur</th>
            <th>Article</th>
            <th>Date</th>
            <th>Montant</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map(p => (
            <tr key={p.id}>
              <td>{p.supplier}</td>
              <td>{p.item}</td>
              <td>{p.date}</td>
              <td>{p.amount}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PurchaseList;
