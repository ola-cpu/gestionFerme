import React, { useState, useEffect } from 'react';
import {
  Beef, Sprout, Package, Warehouse, Truck, ClipboardList,
  ShoppingCart, DollarSign, Users, Landmark, Wrench,
  LayoutDashboard, History, Search, LogOut, Menu, X,
  Bell, User as UserIcon, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import './App.css';
import StockList from './components/StockList';
import WarehouseManagement from './components/WarehouseManagement';
import StockTransfer from './components/StockTransfer';
import InventoryModule from './components/InventoryModule';
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
import UserManagement from './components/UserManagement';
import Login from './components/Login';

function App() {
  const [activeModule, setActiveModule] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      const socket = io();
      socket.on('new_alert', (alert) => {
        setNotifications(prev => [alert, ...prev]);
        // Optional: show a temporary browser notification or toast
        console.log('New system alert:', alert.message);
      });
      return () => socket.disconnect();
    }
  }, [user]);

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
    { id: 'dashboard', name: 'Tableau de bord', icon: <LayoutDashboard size={20} />, roles: ['Admin'] },
    { id: 'elevage', name: 'Élevage', icon: <Beef size={20} />, roles: ['Chef d’élevage', 'Vétérinaire/technicien'] },
    { id: 'cultures', name: 'Cultures', icon: <Sprout size={20} />, roles: ['Chef d’élevage', 'Magasinier'] },
    { id: 'stocks', name: 'Stocks', icon: <Package size={20} />, roles: ['Magasinier', 'Chef d’élevage'] },
    { id: 'warehouses', name: 'Magasins', icon: <Warehouse size={20} />, roles: ['Magasinier', 'Admin'] },
    { id: 'transfers', name: 'Transferts', icon: <Truck size={20} />, roles: ['Magasinier'] },
    { id: 'inventory', name: 'Inventaire', icon: <ClipboardList size={20} />, roles: ['Magasinier'] },
    { id: 'achats', name: 'Achats', icon: <ShoppingCart size={20} />, roles: ['Magasinier', 'Chef d’élevage'] },
    { id: 'ventes', name: 'Ventes', icon: <DollarSign size={20} />, roles: ['Commercial'] },
    { id: 'personnel', name: 'Personnel', icon: <Users size={20} />, roles: ['RH/Comptable'] },
    { id: 'tresorerie', name: 'Trésorerie', icon: <Landmark size={20} />, roles: ['RH/Comptable'] },
    { id: 'maintenance', name: 'Maintenance', icon: <Wrench size={20} />, roles: ['Chef d’élevage', 'Magasinier'] },
    { id: 'audit', name: 'Audit', icon: <History size={20} />, roles: ['Admin', 'Super Admin'] },
    { id: 'users', name: 'Utilisateurs', icon: <Users size={20} />, roles: ['Admin', 'Super Admin'] },
    { id: 'traceabilite', name: 'Traçabilité', icon: <Search size={20} />, roles: ['Admin', 'Super Admin', 'Commercial', 'Chef d’élevage'] }
  ];

  const authorizedModules = (user?.role === 'Admin' || user?.role === 'Super Admin')
    ? modules
    : modules.filter(m => m.roles.includes(user?.role));

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/reports/search?q=${searchQuery}`, { headers: { 'X-User-ID': user?.id } });
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleSelectBatch = (batch) => {
    setSelectedBatch(batch);
  };

  const renderContent = () => {
    let content;
    if (activeModule === 'elevage') {
      if (selectedBatch) {
        content = <LivestockDetail batch={selectedBatch} onBack={() => setSelectedBatch(null)} user={user} />;
      } else {
        content = <LivestockList onSelectBatch={handleSelectBatch} user={user} />;
      }
    } else if (activeModule === 'cultures') {
      if (selectedCycle) {
        content = <CropDetail cycleId={selectedCycle} onBack={() => setSelectedCycle(null)} user={user} />;
      } else {
        content = <CropsList onSelectCycle={(id) => setSelectedCycle(id)} user={user} />;
      }
    } else {
      switch (activeModule) {
        case 'stocks': content = <StockList user={user} />; break;
        case 'warehouses': content = <WarehouseManagement user={user} />; break;
        case 'transfers': content = <StockTransfer user={user} />; break;
        case 'inventory': content = <InventoryModule user={user} />; break;
        case 'achats': content = <PurchaseList user={user} />; break;
        case 'ventes': content = <SaleList user={user} />; break;
        case 'personnel': content = <EmployeeList user={user} />; break;
        case 'tresorerie': content = <TransactionList user={user} />; break;
        case 'maintenance': content = <MaintenanceModule user={user} />; break;
        case 'dashboard': content = <Dashboard user={user} />; break;
        case 'audit': content = <AuditLog user={user} />; break;
        case 'users': content = <UserManagement user={user} />; break;
        case 'traceabilite': content = <TraceabilityReport user={user} />; break;
        default:
          content = (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {authorizedModules.map(module => (
                <motion.div
                  key={module.id}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="card cursor-pointer hover:border-primary-500 hover:shadow-md transition-all group"
                  onClick={() => setActiveModule(module.id)}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    {module.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800">{module.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">Gérer le module {module.name.toLowerCase()}</p>
                </motion.div>
              ))}
            </div>
          );
      }
    }

    return (
      <motion.div
        key={activeModule || 'grid'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    );
  };

  const resetNav = () => {
    setActiveModule(null);
    setSelectedBatch(null);
    setSelectedCycle(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-slate-300 w-64 flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-0' : '-ml-64'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
            <Sprout size={20} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Gestock-Ferme</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 py-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Menu Principal</p>
          <button
            onClick={resetNav}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${!activeModule ? 'bg-primary-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={18} />
            <span className="text-sm font-medium">Accueil</span>
          </button>

          <div className="my-4 border-t border-slate-800 pt-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Modules</p>
            {authorizedModules.map(module => (
              <button
                key={module.id}
                onClick={() => {
                  setActiveModule(module.id);
                  setSelectedBatch(null);
                  setSelectedCycle(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors mb-1 ${activeModule === module.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-3">
                  {module.icon}
                  <span className="text-sm font-medium">{module.name}</span>
                </div>
                {activeModule === module.id && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              aria-label={sidebarOpen ? "Réduire la barre latérale" : "Développer la barre latérale"}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="hover:text-primary-600 cursor-pointer" onClick={resetNav}>Accueil</span>
              {activeModule && (
                <>
                  <ChevronRight size={14} />
                  <span className="font-medium text-slate-900 capitalize">{activeModule}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Recherche globale..."
                aria-label="Recherche globale"
                className="bg-slate-50 border-none rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500/20 w-64"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
              />
              {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {searchResults.map((res, i) => (
                          <div
                            key={i}
                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                            onClick={() => {
                                if (res.type === 'Livestock') {
                                    setActiveModule('elevage');
                                    setSelectedBatch({ id: res.id, batch_name: res.title });
                                } else if (res.type === 'Crop') {
                                    setActiveModule('cultures');
                                    setSelectedCycle(res.id);
                                }
                                setShowSearch(false);
                                setSearchQuery('');
                            }}
                          >
                              <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-slate-800">{res.title}</span>
                                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase">{res.type}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{res.subtitle}</p>
                          </div>
                      ))}
                  </div>
              )}
            </div>

            <button
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative group"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-white" />
              )}

              {/* Notification Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 hidden group-focus-within:block group-hover:block overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-sm">Notifications</span>
                  <button onClick={() => setNotifications([])} className="text-[10px] text-primary-600 hover:underline">Tout marquer comme lu</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400 italic">Aucune nouvelle notification</p>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 mt-1 rounded-full bg-primary-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{n.type}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">{user.username}</p>
                <p className="text-[11px] text-slate-500 mt-1">{user.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                <UserIcon size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
