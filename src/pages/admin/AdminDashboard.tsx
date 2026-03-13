import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { supabase } from '../../lib/supabase';
import type { UserProfile, Department } from '../../lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Users, Workflow, CheckCircle, TrendingUp, Zap, Settings } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [workflows, setWorkflows] = useState<{ status: string; created_at: string }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [u, w, d] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('workflows').select('status, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('departments').select('*'),
      ]);
      setUsers((u.data ?? []) as UserProfile[]);
      setWorkflows(w.data ?? []);
      setDepartments((d.data ?? []) as Department[]);
      setLoading(false);
    };
    load();
  }, []);

  // Monthly workflow trend
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i) * 5);
    const slice = workflows.slice(i * 10, i * 10 + 10);
    return {
      day: d.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
      total: slice.length,
      approved: slice.filter(w => w.status === 'approved').length,
    };
  });

  // Role breakdown
  const roleData = ['admin', 'manager', 'hr', 'employee'].map(role => ({
    role: role.charAt(0).toUpperCase() + role.slice(1),
    count: users.filter(u => u.role === role).length,
  }));

  const activeUsers = users.filter(u => u.is_active).length;
  const totalWorkflows = workflows.length;
  const approvedWf = workflows.filter(w => w.status === 'approved' || w.status === 'completed').length;
  const approvalRate = totalWorkflows > 0 ? Math.round((approvedWf / totalWorkflows) * 100) : 0;

  return (
    <PageWrapper pageTitle="Admin Dashboard">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Full system control and overview</p>
      </div>

      {/* AI Insight */}
      <div className="ai-insight" style={{ marginBottom: 24 }}>
        <div className="ai-insight-header"><Zap size={14} />System Intelligence</div>
        <div className="ai-insight-text">
          System approval rate is <strong>{approvalRate}%</strong> across {totalWorkflows} total workflows.
          {approvalRate < 60 ? ' ⚠️ Consider reviewing workflow routing rules to improve approval efficiency.' : ' ✅ System is operating at healthy approval rates.'}
          {' '}Active users: <strong>{activeUsers}</strong> of <strong>{users.length}</strong> total accounts.
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Users', value: users.length, icon: <Users size={20} />, color: 'blue' },
          { label: 'Active Users', value: activeUsers, icon: <CheckCircle size={20} />, color: 'green' },
          { label: 'Total Workflows', value: totalWorkflows, icon: <Workflow size={20} />, color: 'purple' },
          { label: 'Approval Rate', value: `${approvalRate}%`, icon: <TrendingUp size={20} />, color: 'orange' },
          { label: 'Departments', value: departments.length, icon: <Settings size={20} />, color: 'red' },
        ].map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
            <div className="kpi-value">{loading ? '–' : k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Workflow trend line */}
        <div className="card">
          <div className="card-header"><div className="card-title">Workflow Activity Trend</div></div>
          <div className="card-body">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={false} name="Total" />
                  <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} dot={false} name="Approved" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Role distribution */}
        <div className="card">
          <div className="card-header"><div className="card-title">User Role Distribution</div></div>
          <div className="card-body">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" name="Users" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* User table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Users</div>
          <span className="badge badge-blue">{users.length} total</span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {users.slice(0, 10).map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'manager' ? 'badge-blue' : u.role === 'hr' ? 'badge-purple' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
