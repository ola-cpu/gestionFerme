import React, { useState, useEffect } from 'react';

function EmployeeList({ user }) {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [view, setView] = useState('employees'); // employees, attendance, payroll, planning, contracts, leaves, advances, performance
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await fetch('/api/personnel', { headers: { 'X-User-ID': user?.id } });
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : []);

        const attRes = await fetch('/api/personnel/attendance', { headers: { 'X-User-ID': user?.id } });
        const attData = await attRes.json();
        setAttendance(Array.isArray(attData) ? attData : []);

        const payRes = await fetch('/api/personnel/payrolls', { headers: { 'X-User-ID': user?.id } });
        const payData = await payRes.json();
        setPayrolls(Array.isArray(payData) ? payData : []);

        const schRes = await fetch('/api/personnel/schedules', { headers: { 'X-User-ID': user?.id } });
        const schData = await schRes.json();
        setSchedules(Array.isArray(schData) ? schData : []);

        const conRes = await fetch('/api/personnel/contracts', { headers: { 'X-User-ID': user?.id } });
        const conData = await conRes.json();
        setContracts(Array.isArray(conData) ? conData : []);

        const leaRes = await fetch('/api/personnel/leaves', { headers: { 'X-User-ID': user?.id } });
        const leaData = await leaRes.json();
        setLeaves(Array.isArray(leaData) ? leaData : []);

        const advRes = await fetch('/api/personnel/advances', { headers: { 'X-User-ID': user?.id } });
        const advData = await advRes.json();
        setAdvances(Array.isArray(advData) ? advData : []);

        const perRes = await fetch('/api/personnel/performance', { headers: { 'X-User-ID': user?.id } });
        const perData = await perRes.json();
        setPerformance(Array.isArray(perData) ? perData : []);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Chargement des données RH...</p>;

  return (
    <div>
      <h2>Module Personnel & Paie</h2>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setView('employees')}>Employés</button>
        <button onClick={() => setView('contracts')}>Contrats</button>
        <button onClick={() => setView('attendance')}>Pointage</button>
        <button onClick={() => setView('leaves')}>Congés</button>
        <button onClick={() => setView('payroll')}>Paie</button>
        <button onClick={() => setView('advances')}>Avances</button>
        <button onClick={() => setView('planning')}>Planning</button>
        <button onClick={() => setView('performance')}>Performance</button>
      </div>

      {view === 'employees' && (
        <div>
          <h3>Liste du Personnel</h3>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Poste</th>
                <th>Contrat</th>
                <th>Salaire Base</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id}>
                  <td>{e.last_name}</td>
                  <td>{e.first_name}</td>
                  <td>{e.position_title || e.position}</td>
                  <td>{e.contract_type}</td>
                  <td>{e.base_salary?.toLocaleString()} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'attendance' && (
        <div>
          <h3>Suivi des Présences</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employé</th>
                <th>Entrée</th>
                <th>Sortie</th>
                <th>H. Sup</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(a => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td>{a.last_name}</td>
                  <td>{a.check_in}</td>
                  <td>{a.check_out}</td>
                  <td>{a.overtime_hours}h</td>
                  <td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'payroll' && (
        <div>
          <h3>Gestion de la Paie</h3>
          <table>
            <thead>
              <tr>
                <th>Mois/Année</th>
                <th>Employé</th>
                <th>Salaire de Base</th>
                <th>Primes</th>
                <th>Retenues</th>
                <th>Net à Payer</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map(p => (
                <tr key={p.id}>
                  <td>{p.month}/{p.year}</td>
                  <td>{p.last_name}</td>
                  <td>{p.base_salary_paid?.toLocaleString()} FCFA</td>
                  <td>{p.bonuses?.toLocaleString()}</td>
                  <td>{p.deductions?.toLocaleString()}</td>
                  <td><strong>{p.net_salary?.toLocaleString()} FCFA</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'contracts' && (
        <div>
          <h3>Gestion des Contrats</h3>
          <table>
            <thead>
              <tr>
                <th>Employé</th>
                <th>Type</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.id}>
                  <td>{c.last_name}</td>
                  <td>{c.contract_type}</td>
                  <td>{c.start_date}</td>
                  <td>{c.end_date || 'N/A'}</td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'leaves' && (
        <div>
          <h3>Demandes de Congés</h3>
          <table>
            <thead>
              <tr>
                <th>Employé</th>
                <th>Type</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td>{l.last_name}</td>
                  <td>{l.leave_type}</td>
                  <td>{l.start_date}</td>
                  <td>{l.end_date}</td>
                  <td>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'advances' && (
        <div>
          <h3>Avances sur Salaire</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employé</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {advances.map(a => (
                <tr key={a.id}>
                  <td>{a.request_date}</td>
                  <td>{a.last_name}</td>
                  <td>{a.amount?.toLocaleString()} FCFA</td>
                  <td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'planning' && (
        <div>
          <h3>Planning des Équipes</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employé</th>
                <th>Shift</th>
                <th>Tâches</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.id}>
                  <td>{s.date}</td>
                  <td>{s.last_name}</td>
                  <td>{s.shift}</td>
                  <td>{s.tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'performance' && (
        <div>
          <h3>Évaluations de Performance</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employé</th>
                <th>Score</th>
                <th>Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {performance.map(p => (
                <tr key={p.id}>
                  <td>{p.evaluation_date}</td>
                  <td>{p.last_name}</td>
                  <td>{p.score}/100</td>
                  <td>{p.productivity_rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EmployeeList;
