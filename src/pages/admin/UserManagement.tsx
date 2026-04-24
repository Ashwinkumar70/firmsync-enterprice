import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile, Department } from '../../lib/types';
import { Edit2, ToggleLeft, ToggleRight, Search, Trash2 } from 'lucide-react';

type UserRole = 'admin' | 'manager' | 'hr' | 'employee';

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ email: '', full_name: '', role: 'employee' as UserRole, department_id: '' });
  const [message, setMessage] = useState('');

  const fetchAll = async () => {
    if (!user) return;
    const [u, d] = await Promise.all([
      supabase.from('users').select('*').eq('company_id', user.company_id).order('created_at', { ascending: false }),
      supabase.from('departments').select('*').eq('company_id', user.company_id).order('name'),
    ]);
    setUsers((u.data ?? []) as UserProfile[]);
    setDepartments((d.data ?? []) as Department[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const updateUser = async () => {
    if (!editUser) return;
    
    // Convert empty string to null for database
    const finalDeptId = form.department_id && form.department_id.trim() !== '' ? form.department_id : null;
    
    const { error } = await supabase.from('users').update({
      full_name: form.full_name,
      role: form.role,
      department_id: finalDeptId,
    }).eq('id', editUser.id).eq('company_id', user.company_id);
    
    if (error) {
      alert(`Error updating user: ${error.message}`);
      return;
    }
    
    setEditUser(null);
    setMessage('User updated successfully!');
    setTimeout(() => setMessage(''), 3000);
    fetchAll();
  };

  const toggleActive = async (u: UserProfile) => {
    if (!user) return;
    await supabase.from('users').update({ is_active: !u.is_active }).eq('id', u.id).eq('company_id', user.company_id);
    fetchAll();
  };

  const deleteUser = async (u: UserProfile) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${u.full_name || u.email}? This action cannot be undone.`) || !user) return;
    
    const { error } = await supabase.from('users').delete().eq('id', u.id).eq('company_id', user.company_id);
    if (error) {
      alert(`Error deleting user: ${error.message}`);
    } else {
      setMessage('User deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      fetchAll();
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search.toLowerCase())
  );

  const ROLE_BADGE: Record<string, string> = { admin: 'badge-red', manager: 'badge-blue', hr: 'badge-purple', employee: 'badge-gray' };

  return (
    <PageWrapper pageTitle="User Management">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage accounts, roles, and departments</p>
        </div>
      </div>

      {message && <div className="alert alert-success">✓ {message}</div>}

      {/* Edit modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit User</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                    {['admin', 'manager', 'hr', 'employee'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                    <option value="">No Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={updateUser}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Users</div>
          <div className="search-input-wrap" style={{ width: 240 }}>
            <Search size={15} />
            <input className="form-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading && users.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(u => {
                  const dept = departments.find(d => d.id === u.department_id);
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.full_name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td><span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                      <td>{dept?.name ?? '—'}</td>
                      <td><span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => {
                            setEditUser(u);
                            setForm({ email: u.email, full_name: u.full_name, role: u.role, department_id: u.department_id ?? '' });
                          }}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" title={u.is_active ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(u)}>
                            {u.is_active ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} color="var(--text-muted)" />}
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Delete Account" onClick={() => deleteUser(u)}>
                            <Trash2 size={14} color="var(--danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
