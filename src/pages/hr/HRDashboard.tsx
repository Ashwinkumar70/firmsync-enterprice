import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { LeaveRequest, UserProfile } from '../../lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Calendar, CheckCircle, TrendingUp, Zap } from 'lucide-react';

type LeaveWithEmployee = LeaveRequest & { employee?: { full_name?: string; email?: string } };

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const HRDashboard: React.FC = () => {
  const { } = useAuth();
  const [pendingLeaves, setPendingLeaves] = useState<LeaveWithEmployee[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [counts, setCounts] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingHR: 0,
    approvedLeaves: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        pl, 
        al, 
        emp,
        totalEmp,
        activeEmp,
        penHR,
        appLv
      ] = await Promise.all([
        supabase.from('leave_requests').select('*, employee:users!employee_id(full_name, email)').eq('status', 'manager_approved').order('created_at', { ascending: false }),
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'manager_approved'),
        supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      ]);
      
      setPendingLeaves((pl.data ?? []) as LeaveWithEmployee[]);
      setAllLeaves((al.data ?? []) as LeaveRequest[]);
      setEmployees((emp.data ?? []) as UserProfile[]);
      setCounts({
        totalEmployees: totalEmp.count ?? 0,
        activeEmployees: activeEmp.count ?? 0,
        pendingHR: penHR.count ?? 0,
        approvedLeaves: appLv.count ?? 0
      });
      setLoading(false);
    };
    load();
  }, []);

  const approveLeave = async (id: string) => {
    await supabase.from('leave_requests').update({ status: 'approved' }).eq('id', id);
    setPendingLeaves(prev => prev.filter(l => l.id !== id));
  };

  const rejectLeave = async (id: string) => {
    await supabase.from('leave_requests').update({ status: 'rejected' }).eq('id', id);
    setPendingLeaves(prev => prev.filter(l => l.id !== id));
  };

  // Chart data
  const leaveByType = ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other'].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: allLeaves.filter(l => l.type === type).length,
  })).filter(d => d.value > 0);

  const roleDistrib = ['employee', 'manager', 'hr', 'admin'].map(role => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
    value: employees.filter(e => e.role === role).length,
  }));

  /* Aggregates are now handled via the counts object */

  return (
    <PageWrapper pageTitle="HR Dashboard">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">HR Dashboard</h1>
        <p className="page-subtitle">Manage employee records, leave approvals, and development</p>
      </div>

      {/* AI Insight */}
      <div className="ai-insight" style={{ marginBottom: 24 }}>
        <div className="ai-insight-header"><Zap size={14} />HR Insight</div>
        <div className="ai-insight-text">
          {counts.pendingHR > 0
            ? `${counts.pendingHR} leave request${counts.pendingHR > 1 ? 's' : ''} approved by managers and awaiting your final approval.`
            : 'All manager-approved leaves have been processed. No pending final approvals.'}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Employees', value: counts.totalEmployees, icon: <Users size={20} />, color: 'blue' },
          { label: 'Active Employees', value: counts.activeEmployees, icon: <CheckCircle size={20} />, color: 'green' },
          { label: 'Pending HR Approval', value: counts.pendingHR, icon: <Calendar size={20} />, color: 'orange' },
          { label: 'Approved Leaves', value: counts.approvedLeaves, icon: <TrendingUp size={20} />, color: 'purple' },
        ].map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
            <div className="kpi-value">{loading ? '–' : k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Leave by type pie */}
        <div className="card">
          <div className="card-header"><div className="card-title">Leave Types Distribution</div></div>
          <div className="card-body">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leaveByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {leaveByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Role distribution */}
        <div className="card">
          <div className="card-header"><div className="card-title">Employee Role Distribution</div></div>
          <div className="card-body">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleDistrib}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366F1" name="Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Pending final leave approvals */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Pending Final Leave Approvals</div>
          <span className="badge badge-yellow">{pendingLeaves.length}</span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : pendingLeaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No pending approvals</div>
            <div className="empty-state-text">Leaves approved by managers will appear here for final sign-off</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Action</th></tr></thead>
              <tbody>
                {pendingLeaves.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.employee?.full_name ?? l.employee?.email ?? '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{l.type}</td>
                    <td>{new Date(l.start_date).toLocaleDateString()}</td>
                    <td>{new Date(l.end_date).toLocaleDateString()}</td>
                    <td>{l.days_count}d</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => approveLeave(l.id)}>Final Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => rejectLeave(l.id)}>Reject</button>
                      </div>
                    </td>
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
