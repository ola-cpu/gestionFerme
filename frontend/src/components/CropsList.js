import React from 'react';

function CropsList() {
  const crops = [
    { id: 1, plot: 'Parcelle Nord', crop: 'Maïs', planted: '2023-10-01', yield: '2.5t' },
    { id: 2, plot: 'Parcelle Est', crop: 'Manioc', planted: '2023-11-15', yield: 'TBD' }
  ];

  return (
    <div>
      <h2>Suivi des Cultures</h2>
      <table>
        <thead>
          <tr>
            <th>Parcelle</th>
            <th>Culture</th>
            <th>Date Semis</th>
            <th>Rendement</th>
          </tr>
        </thead>
        <tbody>
          {crops.map(c => (
            <tr key={c.id}>
              <td>{c.plot}</td>
              <td>{c.crop}</td>
              <td>{c.planted}</td>
              <td>{c.yield}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CropsList;
