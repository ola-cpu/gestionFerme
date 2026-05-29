import React, { useState, useEffect } from 'react';

function TransactionList({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [cashflow, setCashflow] = useState([]);
  const [view, setView] = useState('daily'); // daily, budgets, accounts, debts, cashflow

  useEffect(() => {
    fetch('/api/finance', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => setTransactions(Array.isArray(data) ? data : []));

    fetch('/api/finance/budgets', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => setBudgets(Array.isArray(data) ? data : []));

    fetch('/api/finance/accounts', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => setAccounts(Array.isArray(data) ? data : []));

    fetch('/api/finance/debts-receivables', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => setDebts(Array.isArray(data) ? data : []));

    fetch('/api/finance/reports/cashflow', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => setCashflow(Array.isArray(data) ? data : []));
  }, [user]);

  return (
    <div>
      <div className="module-header">
        <h2>Trésorerie et Comptabilité</h2>
        <div className="tab-buttons" style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
          <button onClick={() => setView('daily')} className={view === 'daily' ? 'active' : ''}>Transactions</button>
          <button onClick={() => setView('accounts')} className={view === 'accounts' ? 'active' : ''}>Comptes</button>
          <button onClick={() => setView('budgets')} className={view === 'budgets' ? 'active' : ''}>Budgets</button>
          <button onClick={() => setView('debts')} className={view === 'debts' ? 'active' : ''}>Dettes/Créances</button>
          <button onClick={() => setView('cashflow')} className={view === 'cashflow' ? 'active' : ''}>Flux de Trésorerie</button>
        </div>
      </div>

      {view === 'daily' && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Catégorie</th>
              <th>Activité</th>
              <th>Compte</th>
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
                <td>{t.activity || 'Général'}</td>
                <td>{t.account_name || 'N/A'}</td>
                <td>{t.amount?.toLocaleString()} FCFA</td>
                <td>{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === 'accounts' && (
        <div className="account-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {accounts.map(a => (
            <div key={a.id} className="budget-card" style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
              <h4>{a.account_name}</h4>
              <p>Type: {a.account_type}</p>
              <p>Banque: {a.bank_name || 'N/A'}</p>
              <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Solde: {a.current_balance?.toLocaleString()} {a.currency}</p>
            </div>
          ))}
        </div>
      )}

      {view === 'debts' && (
        <table>
          <thead>
            <tr>
              <th>Entité</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Échéance</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {debts.map(d => (
              <tr key={d.id}>
                <td>{d.entity_name}</td>
                <td style={{ color: d.type === 'DETTE' ? 'red' : 'green' }}>{d.type}</td>
                <td>{d.amount?.toLocaleString()} FCFA</td>
                <td>{d.due_date}</td>
                <td>{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === 'cashflow' && (
        <div className="cashflow-report">
          <h3>Evolution Mensuelle</h3>
          <table>
            <thead>
              <tr>
                <th>Mois</th>
                <th>Entrées</th>
                <th>Sorties</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {cashflow.map(cf => (
                <tr key={cf.month}>
                  <td>{cf.month}</td>
                  <td style={{ color: 'green' }}>{parseFloat(cf.income).toLocaleString()} FCFA</td>
                  <td style={{ color: 'red' }}>{parseFloat(cf.expenses).toLocaleString()} FCFA</td>
                  <td><strong>{(cf.income - cf.expenses).toLocaleString()} FCFA</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'budgets' && (
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
