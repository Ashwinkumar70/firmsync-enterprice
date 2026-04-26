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

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', role: 'manager' as UserRole, department_id: '' });
  const [creating, setCreating] = useState(false);

  const createNewUser = async () => {
    if (!user) return;
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      alert("Please fill in all required fields (Name, Email, Password).");
      return;
    }

    setCreating(true);
    
    // Call the Edge Function to provision the user
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        ...createForm,
        company_id: user.company_id,
        department_id: createForm.department_id || null
      }
    });

    if (error || data?.error) {
      alert(`Error creating user: ${error?.message || data?.error}`);
      setCreating(false);
      return;
    }

    setShowCreate(false);
    setCreateForm({ email: '', password: '', full_name: '', role: 'manager', department_id: '' });
    setMessage(`${createForm.role.toUpperCase()} account created successfully!`);
    setTimeout(() => setMessage(''), 3000);
    fetchAll();
    setCreating(false);
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search.toLowerCase())
  );

  const ROLE_BADGE: Record<string, string> = { admin: 'badge-red', manager: 'badge-blue', hr: 'badge-purple', employee: 'badge-gray' };

  return (
    <PageWrapper pageTitle="User Management">
      <div className="page-header-row" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 28, fontWeight: 800 }}>User Management</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>
            Provision staff accounts and manage organizational access
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={fetchAll}>
             Refresh List
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
            + Add Staff Member
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success">✓ {message}</div>}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay active">
          <div className="modal" style={{ maxWidth: 500, borderRadius: 20, overflow: 'hidden' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)', color: 'white', padding: '24px' }}>
              <div>
                <div className="modal-title" style={{ color: 'white', fontSize: 20 }}>Create Staff Member</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Assign roles and departments within your workspace</div>
              </div>
              <button className="btn btn-icon" onClick={() => setShowCreate(false)} style={{ color: 'white' }}>✕</button>
            </div>
            
            <div className="modal-body" style={{ padding: '32px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="e.g. John Doe" value={createForm.full_name} onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Work Email</label>
                  <input className="form-input" type="email" placeholder="staff@company.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Assign Role</label>
                  <select className="form-input" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                    <option value="manager">Team Manager</option>
                    <option value="hr">HR Personnel</option>
                    <option value="admin">Secondary Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" value={createForm.department_id} onChange={e => setCreateForm(f => ({ ...f, department_id: e.target.value }))}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {departments.length === 0 && (
                    <p style={{ fontSize: 10, color: '#EF4444', marginTop: 4 }}>⚠️ No departments found in this workspace.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#F8FAFC', padding: '20px 32px' }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createNewUser} disabled={creating} style={{ minWidth: 140 }}>
                {creating ? <div className="spinner small" /> : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

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
