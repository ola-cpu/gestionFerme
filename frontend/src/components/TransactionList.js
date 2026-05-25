import React from 'react';

function TransactionList() {
  const transactions = [
    { id: 1, date: '2024-02-15', type: 'ENTRÉE', category: 'Vente', amount: '50.000 FCFA', desc: 'Vente Oeufs' },
    { id: 2, date: '2024-02-16', type: 'SORTIE', category: 'Salaire', amount: '150.000 FCFA', desc: 'Paye Janvier Koffi' }
  ];

  return (
    <div>
      <h2>Trésorerie</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Catégorie</th>
            <th>Montant</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td style={{color: t.type === 'ENTRÉE' ? 'green' : 'red'}}>{t.type}</td>
              <td>{t.category}</td>
              <td>{t.amount}</td>
              <td>{t.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionList;
