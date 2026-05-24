import React, { useState, useEffect } from 'react';

function StockList() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be a fetch to /api/stocks
    // Using mock data for now
    const mockStocks = [
      { id: 1, category: 'Aliments', name: 'Maïs Concassé', unit: 'kg', stock: 500, min: 100 },
      { id: 2, category: 'Santé', name: 'Vaccin Newcastle', unit: 'flacon', stock: 15, min: 5 },
      { id: 3, category: 'Intrants', name: 'Engrais NPK', unit: 'sac', stock: 20, min: 10 }
    ];
    setStocks(mockStocks);
    setLoading(false);
  }, []);

  if (loading) return <p>Chargement des stocks...</p>;

  return (
    <div className="stock-list">
      <h2>État des Stocks</h2>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th>Catégorie</th>
            <th>Quantité</th>
            <th>Unité</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.stock}</td>
              <td>{item.unit}</td>
              <td>
                {item.stock <= item.min ?
                  <span style={{color: 'red'}}>Alerte Seuil</span> :
                  <span style={{color: 'green'}}>Correct</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StockList;
