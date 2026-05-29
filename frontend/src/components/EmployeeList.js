import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Save, X, Calendar, DollarSign, Briefcase } from 'lucide-react';

function EmployeeList({ user }) {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  const [view, setView] = useState('employees');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [formData, setFormData] = useState({
    matricule: '', first_name: '', last_name: '', email: '', phone: '', address: '',
    department_id: '', position_id: '', hire_date: '', base_salary: '', contract_type: 'CDI',
    status: 'Actif'
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-User-ID': user?.id };

      const fetchJson = async (url) => {
        const res = await fetch(url, { headers });
        return res.json();
      };

      const [emp, att, pay, sch, con, lea, adv, per, dep, pos] = await Promise.all([
        fetchJson('/api/personnel'),
        fetchJson('/api/personnel/attendance'),
        fetchJson('/api/personnel/payrolls'),
        fetchJson('/api/personnel/schedules'),
        fetchJson('/api/personnel/contracts'),
        fetchJson('/api/personnel/leaves'),
        fetchJson('/api/personnel/advances'),
        fetchJson('/api/personnel/performance'),
        fetchJson('/api/personnel/departments'),
        fetchJson('/api/personnel/positions')
      ]);

      setEmployees(Array.isArray(emp) ? emp : []);
      setAttendance(Array.isArray(att) ? att : []);
      setPayrolls(Array.isArray(pay) ? pay : []);
      setSchedules(Array.isArray(sch) ? sch : []);
      setContracts(Array.isArray(con) ? con : []);
      setLeaves(Array.isArray(lea) ? lea : []);
      setAdvances(Array.isArray(adv) ? adv : []);
      setPerformance(Array.isArray(per) ? per : []);
      setDepartments(Array.isArray(dep) ? dep : []);
      setPositions(Array.isArray(pos) ? pos : []);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingEmployee ? 'PUT' : 'POST';
    const url = editingEmployee ? `/api/personnel/${editingEmployee.id}` : '/api/personnel';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.id
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setEditingEmployee(null);
        setFormData({
          matricule: '', first_name: '', last_name: '', email: '', phone: '', address: '',
          department_id: '', position_id: '', hire_date: '', base_salary: '', contract_type: 'CDI',
          status: 'Actif'
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      matricule: emp.matricule || '',
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      address: emp.address || '',
      department_id: emp.department_id || '',
      position_id: emp.position_id || '',
      hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
      base_salary: emp.base_salary || '',
      contract_type: emp.contract_type || 'CDI',
      status: emp.status || 'Actif'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    try {
      await fetch(`/api/personnel/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-ID': user?.id }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="p-8 text-center text-slate-500">Chargement des données RH...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Module Personnel & Paie</h2>
        <button
          onClick={() => { setShowForm(true); setEditingEmployee(null); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} /> Nouvel Employé
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'employees', label: 'Employés' },
          { id: 'contracts', label: 'Contrats' },
          { id: 'attendance', label: 'Pointage' },
          { id: 'leaves', label: 'Congés' },
          { id: 'payroll', label: 'Paie' },
          { id: 'advances', label: 'Avances' },
          { id: 'planning', label: 'Planning' },
          { id: 'performance', label: 'Performance' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${view === t.id ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">
                {editingEmployee ? 'Modifier Employé' : 'Ajouter un Employé'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Matricule</label>
                  <input type="text" className="input w-full" value={formData.matricule} onChange={e => setFormData({...formData, matricule: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input type="email" className="input w-full" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Nom</label>
                  <input type="text" className="input w-full" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Prénom</label>
                  <input type="text" className="input w-full" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Téléphone</label>
                  <input type="text" className="input w-full" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Date d'embauche</label>
                  <input type="date" className="input w-full" value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Département</label>
                  <select className="input w-full" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}>
                    <option value="">Sélectionner...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Poste</label>
                  <select className="input w-full" value={formData.position_id} onChange={e => setFormData({...formData, position_id: e.target.value})}>
                    <option value="">Sélectionner...</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Salaire de Base</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="number" className="input w-full pl-10" value={formData.base_salary} onChange={e => setFormData({...formData, base_salary: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Type de Contrat</label>
                  <select className="input w-full" value={formData.contract_type} onChange={e => setFormData({...formData, contract_type: e.target.value})}>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Journalier">Journalier</option>
                    <option value="Saisonnier">Saisonnier</option>
                    <option value="Stage">Stage</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Adresse</label>
                <textarea className="input w-full" rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                <button type="submit" className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                  <Save size={18} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {view === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Employé</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Poste / Dép.</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Contrat</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Salaire Base</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{e.last_name} {e.first_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Briefcase size={12} /> {e.matricule}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{e.position_title || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{e.department_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${e.contract_type === 'CDI' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                        {e.contract_type}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={10} /> {e.hire_date ? new Date(e.hire_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-bold text-slate-900">{e.base_salary?.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">FCFA</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(e)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="p-2 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">Employé</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">Entrée</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">Sortie</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">H. Sup</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium">{a.last_name}</td>
                    <td className="px-6 py-4 text-sm">{a.check_in}</td>
                    <td className="px-6 py-4 text-sm">{a.check_out}</td>
                    <td className="px-6 py-4 text-sm">{a.overtime_hours}h</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${a.status === 'Present' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ... Other views similarly styled ... */}
        {['payroll', 'contracts', 'leaves', 'advances', 'planning', 'performance'].includes(view) && (
          <div className="p-12 text-center">
            <p className="text-slate-400 italic">Interface de gestion avancée pour {view} en cours de chargement...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeList;
