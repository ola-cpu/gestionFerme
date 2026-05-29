import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Package,
  Wrench, FileText, Download, Beef, DollarSign,
  BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  PieChart, Cell, Pie
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function Dashboard({ user }) {
  const [kpis, setKpis] = useState({});
  const [alerts, setAlerts] = useState({ stock: [], expiry: [], maintenance: [], health: [], finance: [] });

  useEffect(() => {
    const headers = { 'X-User-ID': user?.id };
    fetch('/api/reports/kpis', { headers })
      .then(res => res.json())
      .then(data => setKpis(data));

    fetch('/api/reports/alerts', { headers })
      .then(res => res.json())
      .then(data => setAlerts(data));
  }, [user]);

  const handleExport = (module, type = 'csv') => {
    if (type === 'excel') {
      window.open(`/api/reports/export/excel/${module}`);
    } else if (type === 'pdf') {
      window.open(`/api/reports/export/pdf/performance`);
    } else {
      window.open(`/api/reports/export/${module}`);
    }
  };

  // Mock data for charts if none exists from API
  const salesData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  const mortalityData = [
    { name: 'S1', value: 2 },
    { name: 'S2', value: 5 },
    { name: 'S3', value: 3 },
    { name: 'S4', value: 1 },
    { name: 'S5', value: 4 },
  ];

  const stockDistribution = [
    { name: 'Aliments', value: 400 },
    { name: 'Vaccins', value: 300 },
    { name: 'Semences', value: 300 },
    { name: 'Engrais', value: 200 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tableau de Bord</h2>
          <p className="text-slate-500 text-sm">Aperçu en temps réel de vos activités</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary text-sm py-1.5">
            <BarChart3 size={16} /> Rapport Complet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="ROI Moyen"
          value={`${kpis.roi || '0'}%`}
          trend="+2.4%"
          up={true}
          icon={<TrendingUp size={20} />}
          color="bg-primary-50 text-primary-600"
        />
        <KPICard
          title="Productivité Labor"
          value={`${(parseInt(kpis.labor_productivity) || 0).toLocaleString()} FCFA`}
          trend="+5.1%"
          up={true}
          icon={<Package size={20} />}
          color="bg-success/10 text-success"
        />
        <KPICard
          title="Chiffre d'Affaires"
          value={`${(parseInt(kpis.total_sales) || 0).toLocaleString()} FCFA`}
          trend="+12.5%"
          up={true}
          icon={<DollarSign size={20} />}
          color="bg-primary-50 text-primary-600"
        />
        <KPICard
          title="Taux de Mortalité"
          value={kpis.mortality_rate || '0%'}
          trend="-2.1%"
          up={false}
          icon={<Beef size={20} />}
          color="bg-danger/10 text-danger"
        />
        <KPICard
          title="Disponibilité Actifs"
          value={kpis.asset_availability || '0%'}
          trend="+0.5%"
          up={true}
          icon={<Wrench size={20} />}
          color="bg-success/10 text-success"
        />
        <KPICard
          title="Coûts Maintenance"
          value={`${(parseInt(kpis.maintenance_costs) || 0).toLocaleString()} FCFA`}
          trend="+5%"
          up={true}
          icon={<AlertTriangle size={20} />}
          color="bg-warning/10 text-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Évolution des Ventes</h3>
            <select className="text-sm border-none bg-slate-50 rounded-lg py-1 px-2 focus:ring-0">
              <option>6 derniers mois</option>
              <option>Cette année</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Répartition du Stock</h3>
            <PieChartIcon size={20} className="text-slate-400" />
          </div>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 pr-8">
              {stockDistribution.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                  <span className="text-xs text-slate-600 font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Alertes Critiques</h3>
            <span className="px-2 py-1 bg-danger/10 text-danger rounded text-[10px] font-bold uppercase tracking-wider">
              { (alerts.maintenance?.length || 0) + (alerts.stock?.length || 0) + (alerts.expiry?.length || 0) } Total
            </span>
          </div>
          <div className="space-y-3">
            {alerts.maintenance?.slice(0, 2).map((m, i) => (
              <AlertItem key={i} type="info" title="Maintenance" desc={m.message} date={new Date(m.created_at).toLocaleDateString()} />
            ))}
            {alerts.stock?.slice(0, 2).map((s, i) => (
              <AlertItem key={i} type="warning" title="Stock" desc={s.message} date={new Date(s.created_at).toLocaleDateString()} />
            ))}
            {alerts.expiry?.slice(0, 2).map((e, i) => (
              <AlertItem key={i} type="danger" title="Péremption" desc={e.message} date={new Date(e.created_at).toLocaleDateString()} />
            ))}
            {alerts.health?.slice(0, 2).map((h, i) => (
              <AlertItem key={i} type="info" title="Sanitaire" desc={h.message} date={new Date(h.created_at).toLocaleDateString()} />
            ))}
            {alerts.finance?.slice(0, 2).map((f, i) => (
              <AlertItem key={i} type="danger" title="Finance" desc={f.message} date={new Date(f.created_at).toLocaleDateString()} />
            ))}
            {(!alerts.maintenance?.length && !alerts.stock?.length && !alerts.expiry?.length && !alerts.health?.length && !alerts.finance?.length) && (
              <p className="text-center py-8 text-slate-400 text-sm italic">Aucune alerte pour le moment</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Export de Rapports</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Standards (CSV)</p>
              <div className="space-y-1">
                <ExportBtn label="Ventes" onClick={() => handleExport('transactions')} />
                <ExportBtn label="Stocks" onClick={() => handleExport('stock')} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professionnels (Excel)</p>
              <div className="space-y-1">
                <ExportBtn label="Rapport Ventes Excel" onClick={() => handleExport('sales', 'excel')} />
                <ExportBtn label="Rapport Inventaire Excel" onClick={() => handleExport('stock', 'excel')} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Synthèse (PDF)</p>
              <div className="space-y-1">
                <ExportBtn label="Performance Globale PDF" onClick={() => handleExport('performance', 'pdf')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, up, icon, color }) {
  return (
    <div className="card p-5">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${color}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${up ? 'text-success' : 'text-danger'}`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
      </div>
    </div>
  );
}

function AlertItem({ type, title, desc, date }) {
  const styles = {
    info: 'bg-primary-50 text-primary-600 border-primary-100',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20'
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${styles[type]}`}>
      <div className="flex gap-3 items-center">
        <div className="hidden sm:block"><AlertTriangle size={18} /></div>
        <div>
          <p className="text-xs font-bold leading-none">{title}</p>
          <p className="text-[11px] mt-1 opacity-80">{desc}</p>
        </div>
      </div>
      <span className="text-[10px] font-medium whitespace-nowrap">{date}</span>
    </div>
  );
}

function ExportBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-white rounded-md border border-slate-200 text-slate-400 group-hover:text-primary-600 group-hover:border-primary-100 transition-colors">
          <FileText size={16} />
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <Download size={14} className="text-slate-400 group-hover:text-primary-600" />
    </button>
  );
}

export default Dashboard;
