import React, { useState, useEffect } from 'react';
import {
  FileText, Users, Package, Truck, Plus,
  Search, Filter, ChevronRight, MoreVertical,
  Download, ExternalLink, CheckCircle2, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

function SaleList({ user }) {
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [view, setView] = useState('sales'); // sales, clients, catalog, deliveries

  useEffect(() => {
    fetch('/api/sales', { headers: { 'X-User-ID': user?.id } }).then(res => res.json()).then(setSales).catch(() => {});
    fetch('/api/sales/deliveries/all', { headers: { 'X-User-ID': user?.id } }).then(res => res.json()).then(setDeliveries).catch(() => {});
    fetch('/api/sales/clients', { headers: { 'X-User-ID': user?.id } }).then(res => res.json()).then(setClients).catch(() => {});
    fetch('/api/stocks', { headers: { 'X-User-ID': user?.id } }).then(res => res.json()).then(data => {
        setProducts(data.filter(i => i.is_product));
    }).catch(() => {});
  }, [user]);

  const tabs = [
    { id: 'sales', name: 'Ventes & Devis', icon: <FileText size={18} /> },
    { id: 'clients', name: 'Clients', icon: <Users size={18} /> },
    { id: 'catalog', name: 'Catalogue', icon: <Package size={18} /> },
    { id: 'deliveries', name: 'Livraisons', icon: <Truck size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Module Ventes</h2>
          <p className="text-slate-500 text-sm">Gestion commerciale, clients et logistique</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Nouveau Devis/Vente')}>
          <Plus size={18} /> Créer une opération
        </button>
      </div>

      <div className="flex border-b border-slate-200 gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex items-center gap-2 pb-4 text-sm font-medium transition-all relative ${
              view === tab.id ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.name}
            {view === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Rechercher..." className="input w-full pl-10 py-1.5 text-sm" />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary py-1.5 text-sm"><Filter size={16} /> Filtres</button>
            <button className="btn btn-secondary py-1.5 text-sm"><Download size={16} /> Export</button>
          </div>
        </div>

        {view === 'sales' && (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Réf</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Type</th>
                  <th>Paiement</th>
                  <th>Livraison</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id}>
                    <td className="font-semibold text-primary-700">{s.reference_number}</td>
                    <td>Client #{s.client_id}</td>
                    <td>{new Date(s.sale_date).toLocaleDateString()}</td>
                    <td className="font-bold">{s.total_amount?.toLocaleString()} FCFA</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.document_type === 'Facture' ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {s.document_type}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {s.payment_status === 'Paid' ? <CheckCircle2 size={14} className="text-success" /> : <Clock size={14} className="text-warning" />}
                        <span className="text-xs">{s.payment_status}</span>
                      </div>
                    </td>
                    <td><span className="text-xs">{s.delivery_status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        {s.document_type === 'Devis' && (
                          <button onClick={() => alert('Convertir Devis')} className="p-1 hover:bg-primary-50 text-primary-600 rounded" title="Convertir en Facture">
                            <ExternalLink size={16} />
                          </button>
                        )}
                        <button className="p-1 hover:bg-slate-100 text-slate-400 rounded">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400 italic">Aucune vente enregistrée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {view === 'clients' && (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Téléphone</th>
                  <th>Limite Crédit</th>
                  <th>Localisation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td className="font-medium text-slate-900">{c.name}</td>
                    <td><span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full">{c.type}</span></td>
                    <td className="text-slate-600">{c.phone}</td>
                    <td className="font-semibold text-slate-700">{c.credit_limit?.toLocaleString() || 0} FCFA</td>
                    <td className="max-w-[200px] truncate text-slate-500">{c.address}</td>
                    <td>
                      <button className="p-1 hover:bg-slate-100 text-slate-400 rounded">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'deliveries' && (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Vente</th>
                  <th>Client</th>
                  <th>Chauffeur</th>
                  <th>Véhicule</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id}>
                    <td className="font-semibold">{d.reference_number}</td>
                    <td>{d.client_name}</td>
                    <td>{d.driver_name}</td>
                    <td><span className="font-mono text-xs">{d.vehicle_plate}</span></td>
                    <td>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full">{d.status}</span>
                    </td>
                    <td>
                      <button className="text-primary-600 hover:underline text-xs font-medium">Suivre</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'catalog' && (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Unité</th>
                  <th>Prix de Vente</th>
                  <th>Stock Actuel</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-slate-500">{p.unit}</td>
                    <td className="font-bold text-slate-900">{p.sale_price?.toLocaleString()} FCFA</td>
                    <td>
                      <span className={`font-semibold ${p.current_stock < 10 ? 'text-danger' : 'text-slate-700'}`}>
                        {p.current_stock}
                      </span>
                    </td>
                    <td>
                      <span className={`w-2 h-2 rounded-full inline-block mr-2 ${p.current_stock > 0 ? 'bg-success' : 'bg-danger'}`} />
                      <span className="text-xs">{p.current_stock > 0 ? 'En stock' : 'Rupture'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SaleList;
