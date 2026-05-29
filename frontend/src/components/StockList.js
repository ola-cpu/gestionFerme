import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Package, Plus, Search, Filter, Warehouse,
  Trash2, BarChart3, History, ClipboardList,
  AlertTriangle, CheckCircle2, MoreVertical, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StockList({ user }) {
  const [stocks, setStocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState({
    name: '', category_id: 1, unit: 'kg', current_stock: 0,
    minimum_threshold: 10, maximum_threshold: 1000,
    code: '', qr_code: '', valuation_method: 'CMUP'
  });

  useEffect(() => {
    fetchStocks();
    fetchWarehouses();
  }, [selectedWarehouse, user]);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses', { headers: { 'X-User-ID': user?.id } });
      const data = await response.json();
      setWarehouses(data);
    } catch (err) { console.error(err); }
  };

  const fetchStocks = async () => {
    try {
      const url = selectedWarehouse ? `/api/stocks?warehouse_id=${selectedWarehouse}` : '/api/stocks';
      const response = await fetch(url, { headers: { 'X-User-ID': user?.id } });
      const data = await response.json();
      setStocks(data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error", err);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id,  'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (response.ok) {
        fetchStocks();
        setShowForm(false);
        setNewItem({ name: '', category_id: 1, unit: 'kg', current_stock: 0, minimum_threshold: 10 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cet article ?')) {
      try {
        await fetch(`/api/stocks/${id}`, { headers: { 'X-User-ID': user?.id },  method: 'DELETE' });
        fetchStocks();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">État des Stocks</h2>
          <p className="text-slate-500 text-sm">Vue d'ensemble de l'inventaire et des alertes</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary text-sm">
            <ClipboardList size={18} /> Inventaire
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Annuler' : 'Ajouter un article'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Warehouse size={20} className="text-slate-400" />
          <select
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
            className="input py-1.5 text-sm w-full md:w-64"
          >
            <option value="">Tous les magasins</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher un article..."
            className="input w-full pl-10 py-1.5 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="card p-0 overflow-hidden bg-slate-50/50"
          >
            <form onSubmit={handleAdd} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Code & Nom</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Code" value={newItem.code} onChange={e => setNewItem({...newItem, code: e.target.value})} className="input w-24 text-sm" />
                  <input type="text" placeholder="Désignation" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required className="input flex-1 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Catégorie & Unité</label>
                <div className="flex gap-2">
                  <select value={newItem.category_id} onChange={e => setNewItem({...newItem, category_id: e.target.value})} className="input flex-1 text-sm">
                    <option value="1">Aliments</option>
                    <option value="2">Médicaments</option>
                  </select>
                  <input type="text" placeholder="Unité" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} required className="input w-20 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Quantité & Seuils</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Init." value={newItem.current_stock} onChange={e => setNewItem({...newItem, current_stock: e.target.value})} required className="input flex-1 text-sm" />
                  <input type="number" placeholder="Min" value={newItem.minimum_threshold} onChange={e => setNewItem({...newItem, minimum_threshold: e.target.value})} required className="input flex-1 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <select value={newItem.valuation_method} onChange={e => setNewItem({...newItem, valuation_method: e.target.value})} className="input flex-1 text-sm">
                  <option value="CMUP">CMUP</option>
                  <option value="FIFO">FIFO</option>
                </select>
                <button type="submit" className="btn btn-primary px-6">Ajouter</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Article / Identification</th>
                <th>Catégorie</th>
                <th>Stock Actuel</th>
                <th>Unité</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocks.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.code?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="p-1 bg-white border border-slate-100 rounded shadow-sm">
                        <QRCodeSVG value={item.qr_code || item.code || item.name} size={32} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-medium">{item.code || 'SANS CODE'} • {item.valuation_method}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      {item.category_name}
                    </span>
                  </td>
                  <td className="font-bold text-slate-900">{item.current_stock?.toLocaleString()}</td>
                  <td className="text-slate-500">{item.unit}</td>
                  <td>
                    <div className="space-y-1">
                      {item.current_stock <= item.minimum_threshold ? (
                        <div className="flex items-center gap-1.5 text-danger font-bold text-xs">
                          <AlertTriangle size={14} /> Seuil Critique
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-success font-medium text-xs">
                          <CheckCircle2 size={14} /> Correct
                        </div>
                      )}
                      {item.near_expiry_count > 0 && (
                        <div className="flex items-center gap-1.5 text-warning font-medium text-[10px]">
                          <AlertTriangle size={12} /> {item.near_expiry_count} lot(s) exp.
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded transition-colors" title="Détails/Lots">
                        <BarChart3 size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded transition-colors" title="Historique">
                        <History size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-danger/10 text-slate-400 hover:text-danger rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {stocks.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 italic">Aucun article en stock</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StockList;
