import React, { useState, useEffect } from 'react';
import { Users, Shield, UserPlus, Key, Ban, CheckCircle, XCircle, Save, Edit, Trash2 } from 'lucide-react';

function UserManagement({ user }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({
    username: '', password: '', first_name: '', last_name: '', email: '', role_id: '', employee_id: ''
  });
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-User-ID': user?.id };

      const usersRes = await fetch('/api/users', { headers });
      setUsers(await usersRes.json());

      const rolesRes = await fetch('/api/users/roles', { headers });
      setRoles(await rolesRes.json());

      const empRes = await fetch('/api/personnel', { headers });
      setEmployees(await empRes.json());

      const permRes = await fetch('/api/users/permissions', { headers });
      setPermissions(await permRes.json());

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const method = editingUserId ? 'PUT' : 'POST';
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.id
        },
        body: JSON.stringify(userForm)
      });

      if (res.ok) {
        setMessage(editingUserId ? 'Utilisateur mis à jour' : 'Utilisateur créé');
        setUserForm({ username: '', password: '', first_name: '', last_name: '', email: '', role_id: '', employee_id: '' });
        setEditingUserId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuspendUser = async (userId, currentlySuspended) => {
    try {
      const res = await fetch(`/api/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.id
        },
        body: JSON.stringify({ suspend: !currentlySuspended })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    setSelectedRole(roleId);
    try {
      const res = await fetch(`/api/users/roles/${roleId}/permissions`, {
        headers: { 'X-User-ID': user?.id }
      });
      const data = await res.json();
      setRolePermissions(data.map(p => p.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePermission = (permId) => {
    setRolePermissions(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const saveRolePermissions = async () => {
    try {
      const res = await fetch(`/api/users/roles/${selectedRole}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.id
        },
        body: JSON.stringify({ permissionIds: rolePermissions })
      });
      if (res.ok) setMessage('Permissions mises à jour');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Gestion des Utilisateurs & Accès</h1>
        {message && (
          <div className="bg-success-50 text-success-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle size={16} /> {message}
          </div>
        )}
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-4 text-sm font-medium transition-colors relative ${activeTab === 'users' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Utilisateurs
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-2 px-4 text-sm font-medium transition-colors relative ${activeTab === 'roles' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Rôles & Permissions
          {activeTab === 'roles' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Utilisateur</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Rôle</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Statut</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-slate-500">@{u.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                          {u.role_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.suspended_at ? (
                          <span className="flex items-center gap-1 text-danger text-xs font-medium">
                            <XCircle size={14} /> Suspendu
                          </span>
                        ) : u.is_active ? (
                          <span className="flex items-center gap-1 text-success text-xs font-medium">
                            <CheckCircle size={14} /> Actif
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Inactif</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingUserId(u.id);
                            setUserForm({
                              username: u.username,
                              first_name: u.first_name || '',
                              last_name: u.last_name || '',
                              email: u.email || '',
                              role_id: u.role_id || '',
                              employee_id: u.employee_id || '',
                              is_active: u.is_active
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleSuspendUser(u.id, !!u.suspended_at)}
                          className={`p-1 transition-colors ${u.suspended_at ? 'text-success hover:text-success-600' : 'text-danger hover:text-danger-600'}`}
                          title={u.suspended_at ? "Réactiver" : "Suspendre"}
                        >
                          <Ban size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-primary-600" />
              {editingUserId ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Nom</label>
                  <input
                    type="text"
                    className="w-full text-sm border-slate-200 rounded-lg"
                    value={userForm.last_name}
                    onChange={e => setUserForm({...userForm, last_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Prénom</label>
                  <input
                    type="text"
                    className="w-full text-sm border-slate-200 rounded-lg"
                    value={userForm.first_name}
                    onChange={e => setUserForm({...userForm, first_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Email</label>
                <input
                  type="email"
                  className="w-full text-sm border-slate-200 rounded-lg"
                  value={userForm.email}
                  onChange={e => setUserForm({...userForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Nom d'utilisateur</label>
                <input
                  type="text"
                  required
                  className="w-full text-sm border-slate-200 rounded-lg"
                  value={userForm.username}
                  onChange={e => setUserForm({...userForm, username: e.target.value})}
                />
              </div>
              {!editingUserId && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Mot de passe</label>
                  <input
                    type="password"
                    required
                    className="w-full text-sm border-slate-200 rounded-lg"
                    value={userForm.password}
                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Rôle</label>
                <select
                  required
                  className="w-full text-sm border-slate-200 rounded-lg"
                  value={userForm.role_id}
                  onChange={e => setUserForm({...userForm, role_id: e.target.value})}
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Lier à un employé</label>
                <select
                  className="w-full text-sm border-slate-200 rounded-lg"
                  value={userForm.employee_id}
                  onChange={e => setUserForm({...userForm, employee_id: e.target.value})}
                >
                  <option value="">Aucun</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="submit" className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                  <Save size={16} /> {editingUserId ? 'Mettre à jour' : 'Créer le compte'}
                </button>
                {editingUserId && (
                  <button
                    type="button"
                    onClick={() => { setEditingUserId(null); setUserForm({username: '', password: '', first_name: '', last_name: '', email: '', role_id: '', employee_id: ''}); }}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rôles</h3>
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => fetchRolePermissions(r.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedRole === r.id ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
              >
                <div className="font-bold">{r.name}</div>
                <div className={`text-[10px] ${selectedRole === r.id ? 'text-primary-100' : 'text-slate-500'}`}>{r.description}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selectedRole ? (
              <div className="card space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Permissions pour : {roles.find(r => r.id === selectedRole)?.name}</h2>
                    <p className="text-sm text-slate-500">Cochez les actions autorisées pour ce rôle.</p>
                  </div>
                  <button onClick={saveRolePermissions} className="btn btn-primary flex items-center gap-2">
                    <Save size={18} /> Enregistrer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {['élevage', 'agriculture', 'stock', 'ventes', 'achats', 'comptabilité', 'maintenance'].map(module => (
                    <div key={module} className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 border-l-4 border-primary-500 pl-3 capitalize">{module}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {permissions.filter(p => p.module === module).map(perm => (
                          <label key={perm.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                            <input
                              type="checkbox"
                              className="rounded text-primary-600 focus:ring-primary-500"
                              checked={rolePermissions.includes(perm.id)}
                              onChange={() => handleTogglePermission(perm.id)}
                            />
                            <span className="text-sm text-slate-600 capitalize">{perm.action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card h-64 flex flex-col items-center justify-center text-slate-400">
                <Shield size={48} className="mb-4 opacity-20" />
                <p>Sélectionnez un rôle pour gérer ses permissions</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
