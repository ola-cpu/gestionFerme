import React, { useState } from 'react';
import './App.css';
import StockList from './components/StockList';
import CropsList from './components/CropsList';
import CropDetail from './components/CropDetail';
import PurchaseList from './components/PurchaseList';
import SaleList from './components/SaleList';
import EmployeeList from './components/EmployeeList';
import TransactionList from './components/TransactionList';
import LivestockList from './components/LivestockList';
import LivestockDetail from './components/LivestockDetail';
import MaintenanceModule from './components/MaintenanceModule';
import Dashboard from './components/Dashboard';

function App() {
  const [activeModule, setActiveModule] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);

  const modules = [
    { id: 'elevage', name: 'Élevage', icon: '🐄' },
    { id: 'cultures', name: 'Cultures', icon: '🌾' },
    { id: 'stocks', name: 'Stocks', icon: '📦' },
    { id: 'achats', name: 'Achats', icon: '🛒' },
    { id: 'ventes', name: 'Ventes', icon: '💰' },
    { id: 'personnel', name: 'Personnel', icon: '👥' },
    { id: 'tresorerie', name: 'Trésorerie', icon: '🏦' },
    { id: 'maintenance', name: 'Maintenance', icon: '🛠️' },
    { id: 'dashboard', name: 'Tableaux de bord', icon: '📊' }
  ];

  const handleSelectBatch = (batch) => {
    setSelectedBatch(batch);
  };

  const renderContent = () => {
    if (activeModule === 'elevage') {
      if (selectedBatch) {
        return <LivestockDetail batch={selectedBatch} onBack={() => setSelectedBatch(null)} />;
      }
      return <LivestockList onSelectBatch={handleSelectBatch} />;
    }

    if (activeModule === 'cultures') {
      if (selectedCycle) {
        return <CropDetail cycleId={selectedCycle} onBack={() => setSelectedCycle(null)} />;
      }
      return <CropsList onSelectCycle={(id) => setSelectedCycle(id)} />;
    }

    switch (activeModule) {
      case 'stocks':
        return <StockList />;
      case 'achats':
        return <PurchaseList />;
      case 'ventes':
        return <SaleList />;
      case 'personnel':
        return <EmployeeList />;
      case 'tresorerie':
        return <TransactionList />;
      case 'maintenance':
        return <MaintenanceModule />;
      case 'dashboard':
        return <Dashboard />;
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

  const resetNav = () => {
    setActiveModule(null);
    setSelectedBatch(null);
    setSelectedCycle(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 onClick={resetNav} style={{cursor: 'pointer'}}>Gestock-Ferme</h1>
        <p>Gestion Intégrée de Ferme</p>
        {activeModule && (
          <button onClick={resetNav}>
            Retour au tableau de bord
          </button>
        )}
      </header>
      <main className="App-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
