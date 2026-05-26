import React, { useState, useEffect } from 'react';

function EmployeeList({ user }) {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [view, setView] = useState('employees'); // employees, attendance, payroll, planning
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await fetch('/api/personnel', { headers: { 'X-User-ID': user?.id } });
        setEmployees(await empRes.json());

        const attRes = await fetch('/api/personnel/attendance', { headers: { 'X-User-ID': user?.id } });
        setAttendance(await attRes.json());

        const payRes = await fetch('/api/personnel/payrolls', { headers: { 'X-User-ID': user?.id } });
        setPayrolls(await payRes.json());

        const schRes = await fetch('/api/personnel/schedules', { headers: { 'X-User-ID': user?.id } });
        setSchedules(await schRes.json());

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

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setView('employees')}>Employés</button>
        <button onClick={() => setView('attendance')}>Pointage</button>
        <button onClick={() => setView('payroll')}>Paie</button>
        <button onClick={() => setView('planning')}>Planning</button>
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
                  <td>{e.position}</td>
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
    </div>
  );
}

export default EmployeeList;
