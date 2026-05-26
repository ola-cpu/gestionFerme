import React, { useState, useEffect } from 'react';

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [view, setView] = useState('daily'); // daily or budgets

  useEffect(() => {
    fetch('/api/finance')
      .then(res => res.json())
      .then(data => setTransactions(data));

    fetch('/api/finance/budgets')
      .then(res => res.json())
      .then(data => setBudgets(data));
  }, []);

  return (
    <div>
      <div className="module-header">
        <h2>Trésorerie et Comptabilité</h2>
        <div className="tab-buttons">
          <button onClick={() => setView('daily')} className={view === 'daily' ? 'active' : ''}>Caisse et Banque</button>
          <button onClick={() => setView('budgets')} className={view === 'budgets' ? 'active' : ''}>Budgets par Activité</button>
        </div>
      </div>

      {view === 'daily' ? (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Catégorie</th>
              <th>Activité</th>
              <th>Source</th>
              <th>Montant</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td style={{color: t.type === 'IN' || t.type === 'ENTRÉE' ? 'green' : 'red'}}>{t.type}</td>
                <td>{t.category}</td>
                <td>{t.activity || 'Général'}</td>
                <td>{t.source || 'Caisse'}</td>
                <td>{t.amount} FCFA</td>
                <td>{t.description || t.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="budget-list">
          <h3>Suivi Budgétaire</h3>
          <div className="budget-grid">
            {budgets.map(b => (
              <div key={b.id} className="budget-card">
                <h4>{b.activity}</h4>
                <p>Période: {b.period_start} au {b.period_end}</p>
                <div className="budget-bar-container">
                    <div
                        className="budget-bar-fill"
                        style={{
                            width: `${Math.min(100, (b.spent_amount / b.allocated_amount) * 100)}%`,
                            backgroundColor: (b.spent_amount / b.allocated_amount) > 0.9 ? 'red' : 'green'
                        }}
                    ></div>
                </div>
                <p>{b.spent_amount} / {b.allocated_amount} FCFA consommé</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="export-actions" style={{marginTop: '20px'}}>
        <button onClick={() => window.open('/api/reports/export/transactions')}>
            Exporter vers Logiciel Comptable (.CSV)
        </button>
      </div>
    </div>
  );
}

export default TransactionList;
