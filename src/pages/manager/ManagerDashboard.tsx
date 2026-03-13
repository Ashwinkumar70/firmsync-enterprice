import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Workflow, LeaveRequest } from '../../lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, ClipboardCheck, Clock, TrendingUp, Zap } from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  created: { label: 'New', cls: 'badge-gray' },
  assigned: { label: 'Assigned', cls: 'badge-blue' },
  under_review: { label: 'In Review', cls: 'badge-yellow' },
  approved: { label: 'Approved', cls: 'badge-green' },
  rejected: { label: 'Rejected', cls: 'badge-red' },
  completed: { label: 'Completed', cls: 'badge-purple' },
};

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    pendingLeaves: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.department_id) return;
      
      const [
        wf, 
        lv,
        total,
        approved,
        pendingReview,
        pendingLeaves
      ] = await Promise.all([
        supabase.from('workflows')
          .select('*, creator:users!created_by(full_name, email)')
          .eq('department_id', user.department_id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('leave_requests')
          .select('*, employee:users!employee_id(full_name, department_id)')
          .eq('status', 'pending')
          .filter('employee.department_id', 'eq', user.department_id)
          .limit(5),
        supabase.from('workflows')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', user.department_id),
        supabase.from('workflows')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', user.department_id)
          .in('status', ['approved', 'completed']),
        supabase.from('workflows')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', user.department_id)
          .in('status', ['created', 'assigned', 'under_review']),
        supabase.from('leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .filter('employee.department_id', 'eq', user.department_id)
      ]);

      setWorkflows((wf.data ?? []) as Workflow[]);
      setTeamLeaves((lv.data ?? []) as any[]);
      setCounts({
        total: total.count ?? 0,
        approved: approved.count ?? 0,
        pending: pendingReview.count ?? 0,
        pendingLeaves: pendingLeaves.count ?? 0
      });
      setLoading(false);
    };
    load();
  }, [user]);


  // Build monthly chart data from workflows
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const wfs = workflows.filter(w => new Date(w.created_at).getMonth() === d.getMonth());
    return { month, total: wfs.length, approved: wfs.filter(w => w.status === 'approved').length };
  });

  // AI insight
  const aiInsight = counts.pending > 3
    ? `⚠️ ${counts.pending} workflows are awaiting your review. Addressing older requests first can reduce bottlenecks.`
    : counts.pending === 0
    ? '✅ Great job! No pending workflows. Your team is running smoothly.'
    : `📋 ${counts.pending} workflow${counts.pending > 1 ? 's' : ''} pending review. Consider prioritizing high-priority items.`;

  return (
    <PageWrapper pageTitle="Manager Dashboard">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Manager Dashboard</h1>
        <p className="page-subtitle">Overview of your team's workflow and performance</p>
      </div>

      {/* AI Insight */}
      <div className="ai-insight" style={{ marginBottom: 24 }}>
        <div className="ai-insight-header"><Zap size={14} />AI Workflow Insight</div>
        <div className="ai-insight-text">{aiInsight}</div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Workflows', value: counts.total, icon: <ClipboardCheck size={20} />, color: 'blue' },
          { label: 'Approved', value: counts.approved, icon: <TrendingUp size={20} />, color: 'green' },
          { label: 'Pending Review', value: counts.pending, icon: <Clock size={20} />, color: 'orange' },
          { label: 'Pending Leaves', value: counts.pendingLeaves, icon: <Users size={20} />, color: 'purple' },
        ].map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
            <div className="kpi-value">{loading ? '–' : k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Workflow chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Workflow Trends (6 Months)</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3B82F6" name="Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pending leaves */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pending Leave Requests</div>
            <span className="badge badge-yellow">{teamLeaves.length}</span>
          </div>
          {teamLeaves.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No pending leaves</div>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>Employee</th><th>Type</th><th>Days</th><th>Action</th></tr></thead>
                <tbody>
                  {teamLeaves.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{(l as LeaveRequest & { employee: { full_name: string } }).employee?.full_name ?? '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{l.type}</td>
                      <td>{l.days_count || '—'}d</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={async () => {
                            await supabase.from('leave_requests').update({ status: 'manager_approved' }).eq('id', l.id);
                            setTeamLeaves(prev => prev.filter(x => x.id !== l.id));
                          }}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={async () => {
                            await supabase.from('leave_requests').update({ status: 'rejected' }).eq('id', l.id);
                            setTeamLeaves(prev => prev.filter(x => x.id !== l.id));
                          }}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent workflows */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Department Workflows</div>
          <span className="badge badge-blue">{workflows.length}</span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>Request</th><th>Type</th><th>By</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {workflows.map(w => {
                  const badge = STATUS_BADGE[w.status] ?? { label: w.status, cls: 'badge-gray' };
                  const creator = (w as Workflow & { creator?: { full_name?: string; email?: string } }).creator;
                  return (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 600 }}>{w.title}</td>
                      <td style={{ textTransform: 'capitalize' }}>{w.type}</td>
                      <td>{creator?.full_name ?? creator?.email ?? '—'}</td>
                      <td>
                        <span className={`badge ${w.priority === 'urgent' ? 'badge-red' : w.priority === 'high' ? 'badge-orange' : 'badge-gray'}`}>
                          {w.priority}
                        </span>
                      </td>
                      <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(w.created_at).toLocaleDateString()}</td>
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
