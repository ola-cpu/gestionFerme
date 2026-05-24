import React, { useState } from 'react';
import './App.css';
import StockList from './components/StockList';

function App() {
  const [activeModule, setActiveModule] = useState(null);

  const modules = [
    { id: 'elevage', name: 'Élevage', icon: '🐄' },
    { id: 'cultures', name: 'Cultures', icon: '🌾' },
    { id: 'stocks', name: 'Stocks', icon: '📦' },
    { id: 'achats', name: 'Achats', icon: '🛒' },
    { id: 'ventes', name: 'Ventes', icon: '💰' },
    { id: 'personnel', name: 'Personnel', icon: '👥' },
    { id: 'tresorerie', name: 'Trésorerie', icon: '🏦' }
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'stocks':
        return <StockList />;
      case 'elevage':
        return <p>Interface Élevage en cours de développement...</p>;
      default:
        return (
          <div className="module-grid">
            {modules.map(module => (
              <div key={module.id} className="module-card" onClick={() => setActiveModule(module.id)}>
                <span className="module-icon">{module.icon}</span>
                <h3>{module.name}</h3>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 onClick={() => setActiveModule(null)} style={{cursor: 'pointer'}}>Gestock-Ferme</h1>
        <p>Gestion Intégrée de Ferme</p>
        {activeModule && <button onClick={() => setActiveModule(null)}>Retour au tableau de bord</button>}
      </header>
      <main className="App-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
