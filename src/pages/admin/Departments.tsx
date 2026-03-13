import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { supabase } from '../../lib/supabase';
import type { Department, UserProfile } from '../../lib/types';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', manager_id: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchAll = async () => {
    const [d, m] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('users').select('id, full_name, email').eq('role', 'manager'),
    ]);
    setDepartments((d.data ?? []) as Department[]);
    setManagers((m.data ?? []) as UserProfile[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    if (editId) {
      await supabase.from('departments').update({ name: form.name, manager_id: form.manager_id || null }).eq('id', editId);
    } else {
      await supabase.from('departments').insert({ name: form.name, manager_id: form.manager_id || null });
    }
    setForm({ name: '', manager_id: '' });
    setEditId(null);
    setShowForm(false);
    setMessage(editId ? 'Department updated!' : 'Department created!');
    setTimeout(() => setMessage(''), 3000);
    fetchAll();
  };

  const deleteDept = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    await supabase.from('departments').delete().eq('id', id);
    fetchAll();
  };

  return (
    <PageWrapper pageTitle="Departments">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage organizational structure</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', manager_id: '' }); }}>
          <Plus size={16} />Add Department
        </button>
      </div>

      {message && <div className="alert alert-success">✓ {message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">{editId ? 'Edit' : 'New'} Department</div></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department Name <span className="required">*</span></label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Engineering" />
              </div>
              <div className="form-group">
                <label className="form-label">Manager</label>
                <select className="form-input" value={form.manager_id} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}>
                  <option value="">No Manager</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={save}>Save</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Departments</div>
          <span className="badge badge-blue">{departments.length}</span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={28} /></div>
            <div className="empty-state-title">No departments</div>
            <div className="empty-state-text">Add your first department above</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Manager</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {departments.map(d => {
                  const mgr = managers.find(m => m.id === d.manager_id);
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 700 }}>{d.name}</td>
                      <td>{mgr?.full_name ?? mgr?.email ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(d.id); setForm({ name: d.name, manager_id: d.manager_id ?? '' }); setShowForm(true); }}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteDept(d.id)}>
                            <Trash2 size={14} />
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
