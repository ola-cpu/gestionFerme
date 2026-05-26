import React, { useState, useEffect } from 'react';
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
import AuditLog from './components/AuditLog';
import TraceabilityReport from './components/TraceabilityReport';
import Login from './components/Login';

function App() {
  const [activeModule, setActiveModule] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setActiveModule(null);
  };

  const modules = [
    { id: 'elevage', name: 'Élevage', icon: '🐄', roles: ['Chef d’élevage', 'Vétérinaire/technicien'] },
    { id: 'cultures', name: 'Cultures', icon: '🌾', roles: ['Chef d’élevage', 'Magasinier'] },
    { id: 'stocks', name: 'Stocks', icon: '📦', roles: ['Magasinier', 'Chef d’élevage'] },
    { id: 'achats', name: 'Achats', icon: '🛒', roles: ['Magasinier', 'Chef d’élevage'] },
    { id: 'ventes', name: 'Ventes', icon: '💰', roles: ['Commercial'] },
    { id: 'personnel', name: 'Personnel', icon: '👥', roles: ['RH/Comptable'] },
    { id: 'tresorerie', name: 'Trésorerie', icon: '🏦', roles: ['RH/Comptable'] },
    { id: 'maintenance', name: 'Maintenance', icon: '🛠️', roles: ['Chef d’élevage', 'Magasinier'] },
    { id: 'dashboard', name: 'Tableaux de bord', icon: '📊', roles: ['Admin'] },
    { id: 'audit', name: 'Audit', icon: '📜', roles: ['Admin'] },
    { id: 'traceabilite', name: 'Traçabilité', icon: '🔍', roles: ['Admin', 'Commercial', 'Chef d’élevage'] }
  ];

  const authorizedModules = user?.role === 'Admin'
    ? modules
    : modules.filter(m => m.roles.includes(user?.role));

  const handleSelectBatch = (batch) => {
    setSelectedBatch(batch);
  };

  const renderContent = () => {
    if (activeModule === 'elevage') {
      if (selectedBatch) {
        return <LivestockDetail batch={selectedBatch} onBack={() => setSelectedBatch(null)} user={user} />;
      }
      return <LivestockList onSelectBatch={handleSelectBatch} user={user} />;
    }

    if (activeModule === 'cultures') {
      if (selectedCycle) {
        return <CropDetail cycleId={selectedCycle} onBack={() => setSelectedCycle(null)} user={user} />;
      }
      return <CropsList onSelectCycle={(id) => setSelectedCycle(id)} user={user} />;
    }

    switch (activeModule) {
      case 'stocks':
        return <StockList user={user} />;
      case 'achats':
        return <PurchaseList user={user} />;
      case 'ventes':
        return <SaleList user={user} />;
      case 'personnel':
        return <EmployeeList user={user} />;
      case 'tresorerie':
        return <TransactionList user={user} />;
      case 'maintenance':
        return <MaintenanceModule user={user} />;
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'audit':
        return <AuditLog user={user} />;
      case 'traceabilite':
        return <TraceabilityReport user={user} />;
      default:
        return (
          <div className="module-grid">
            {authorizedModules.map(module => (
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

  if (!user) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Gestock-Ferme</h1>
          <p>Gestion Intégrée de Ferme</p>
        </header>
        <main className="App-main">
          <Login onLogin={handleLogin} />
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1 onClick={resetNav} style={{cursor: 'pointer'}}>Gestock-Ferme</h1>
        <div className="user-info">
          <span>Connecté en tant que: <strong>{user.username}</strong> ({user.role})</span>
          <button onClick={handleLogout} style={{marginLeft: '10px'}}>Déconnexion</button>
        </div>
        <p>Gestion Intégrée de Ferme</p>
        {activeModule && (
          <button onClick={resetNav}>
            Retour au menu principal
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
