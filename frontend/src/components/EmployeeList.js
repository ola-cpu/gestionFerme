import React, { useState, useEffect } from 'react';

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/personnel')
      .then(res => res.json())
      .then(data => {
        setEmployees(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setEmployees([{ id: 1, first_name: 'Koffi', last_name: 'Mensah', position: 'Chef d’élevage', base_salary: 150000 }]);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement du personnel...</p>;

  return (
    <div>
      <h2>Gestion du Personnel</h2>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Poste</th>
            <th>Salaire Base (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(e => (
            <tr key={e.id}>
              <td>{e.last_name}</td>
              <td>{e.first_name}</td>
              <td>{e.position}</td>
              <td>{e.base_salary?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeList;
