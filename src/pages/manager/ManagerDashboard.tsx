import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, ClipboardCheck, Clock, TrendingUp, Zap, ShoppingCart, CheckCircle } from 'lucide-react';
import type { Workflow, LeaveRequest } from '../../lib/types';

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
    pendingLeaves: 0,
    pendingPurchases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      if (!user.department_id) {
        setLoading(false);
        return;
      }
      
      const [
        wf, 
        lv,
        total,
        approved,
        pendingReview,
        pendingLeaves,
        pendingPurchases
      ] = await Promise.all([
        supabase.from('workflows')
          .select('*, creator:users!created_by(full_name, email)')
          .eq('company_id', user.company_id)
          .eq('department_id', user.department_id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('leave_requests')
          .select('*, employee:users!employee_id(full_name, department_id)')
          .eq('company_id', user.company_id)
          .eq('status', 'pending')
          .filter('employee.department_id', 'eq', user.department_id)
          .limit(5),
        supabase.from('workflows')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', user.company_id)
          .eq('department_id', user.department_id),
        supabase.from('workflows')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', user.company_id)
          .eq('department_id', user.department_id)
          .in('status', ['approved', 'completed']),
        supabase.from('workflows')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', user.company_id)
          .eq('department_id', user.department_id)
          .in('status', ['created', 'assigned', 'under_review', 'pending']),
        supabase.from('leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', user.company_id)
          .eq('status', 'pending')
          .filter('employee.department_id', 'eq', user.department_id),
        supabase.from('purchase_requests')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', user.company_id)
          .eq('status', 'pending'),
      ]);

      setWorkflows((wf.data ?? []) as Workflow[]);
      setTeamLeaves((lv.data ?? []) as any[]);
      setCounts({
        total: total.count ?? 0,
        approved: approved.count ?? 0,
        pending: pendingReview.count ?? 0,
        pendingLeaves: pendingLeaves.count ?? 0,
        pendingPurchases: pendingPurchases.count ?? 0
      });
      setLoading(false);
    };
    load();
  }, [user]);


  // Build monthly chart data from workflows
  const chartData = React.useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const wfs = workflows.filter(w => new Date(w.created_at).getMonth() === d.getMonth());
    return { month, total: wfs.length, approved: wfs.filter(w => w.status === 'approved').length };
  }), [workflows]);

  // AI insight
  const aiInsight = React.useMemo(() => (counts.pending > 3
    ? `⚠️ ${counts.pending} workflows are awaiting your review. Addressing older requests first can reduce bottlenecks.`
    : counts.pendingPurchases > 0 
    ? `💰 There are ${counts.pendingPurchases} pending purchase requests that need your approval.`
    : counts.pending === 0
    ? '✅ Great job! No pending workflows. Your team is running smoothly.'
    : `📋 ${counts.pending} workflow${counts.pending > 1 ? 's' : ''} pending review. Consider prioritizing high-priority items.`), [counts]);

  const kpis = React.useMemo(() => [
    { label: 'Total Workflows', value: counts.total, icon: <ClipboardCheck size={20} />, color: 'blue', to: '/manager/workflows' },
    { label: 'Approved', value: counts.approved, icon: <TrendingUp size={20} />, color: 'green' },
    { label: 'New Purchases', value: counts.pendingPurchases, icon: <ShoppingCart size={20} />, color: 'red', to: '/manager/purchases' },
    { label: 'Pending Leaves', value: counts.pendingLeaves, icon: <Users size={20} />, color: 'purple', to: '/manager/leave' },
  ], [counts]);

  return (
    <PageWrapper pageTitle="Manager Dashboard">
      {/* Premium Hero Section */}
      <div style={{ marginBottom: 32, animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: '20px', 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            fontSize: 28, fontWeight: 800, 
            boxShadow: '0 12px 24px -6px rgba(79, 70, 229, 0.4)',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            {user?.full_name?.charAt(0) || 'M'}
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: 34, marginBottom: 4, letterSpacing: '-0.02em' }}>
              Manager Overview
            </h1>
            <p className="page-subtitle" style={{ fontSize: 16 }}>
              Supervising <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{user?.department_id || 'System'}</span> Department • {counts.total} Total Workflows
            </p>
          </div>
        </div>
      </div>

      {!user?.department_id && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          ⚠ <strong>No department assigned.</strong> You are not currently assigned to a department. 
          Please ask your admin to assign you to a department to see your team's metrics and workflows.
        </div>
      )}

      {/* Premium AI Insight */}
      <div className="ai-insight hover-lift" style={{ marginBottom: 32, animation: 'fadeInUp 0.6s ease-out 0.2s forwards', opacity: 0 }}>
        <div className="ai-insight-header" style={{ color: 'var(--primary)', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 10, marginBottom: 10 }}>
          <Zap size={16} fill="var(--primary)" /> Smart Management Assistant
        </div>
        <div className="ai-insight-text" style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>{aiInsight}</div>
      </div>

      {/* Glowing KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 32 }}>
        {kpis.map((k, i) => {
          const Card = k.to ? (props: any) => <Link to={k.to!} {...props} /> : (props: any) => <div {...props} />;
          return (
            <Card 
              key={k.label} 
              className={`kpi-card ${k.color}`} 
              style={{ 
                textDecoration: 'none', 
                animation: `fadeInUp 0.5s ease-out forwards ${i * 0.1 + 0.3}s`,
                opacity: 0,
                padding: '28px'
              }}
            >
              <div className={`kpi-icon ${k.color}`} style={{ 
                width: 52, height: 52,
                background: `linear-gradient(135deg, var(--${k.color}) 0%, #fff 250%)`,
                color: 'white',
                boxShadow: `0 10px 20px -5px rgba(0,0,0,0.15)`,
                marginBottom: 20
              }}>
                {k.icon}
              </div>
              <div className="kpi-value" style={{ fontSize: 40, fontWeight: 900, marginBottom: 4 }}>
                {loading ? '–' : k.value}
              </div>
              <div className="kpi-label" style={{ fontSize: 13, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>{k.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        {/* Workflow Trend Chart */}
        <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s forwards', opacity: 0 }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
            <div className="card-title" style={{ fontSize: 18, fontWeight: 700 }}>Workflow Velocity</div>
          </div>
          <div className="card-body" style={{ padding: '28px' }}>
            <div className="chart-wrap" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={8}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)' }} 
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Bar dataKey="total" fill="url(#colorTotal)" name="Volume" radius={[8, 8, 0, 0]} barSize={24} />
                  <Bar dataKey="approved" fill="url(#colorApproved)" name="Success" radius={[8, 8, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pending Actions Table */}
        <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.7s forwards', opacity: 0 }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
            <div className="card-title" style={{ fontSize: 18, fontWeight: 700 }}>Critical Approvals</div>
            <span className="badge badge-yellow" style={{ padding: '6px 14px' }}>{teamLeaves.length} Priority</span>
          </div>
          <div className="card-body" style={{ padding: '12px' }}>
            {teamLeaves.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <CheckCircle size={40} style={{ color: 'var(--success)', opacity: 0.3, marginBottom: 16 }} />
                <div style={{ fontWeight: 700, fontSize: 18 }}>Queue Clear</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All team requests have been processed.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead><tr><th>Entity</th><th>Category</th><th>Period</th><th>Actions</th></tr></thead>
                  <tbody>
                    {teamLeaves.map(l => (
                      <tr key={l.id} className="hover-lift" style={{ transition: 'all 0.2s ease' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                              {(l as any).employee?.full_name?.charAt(0) || 'U'}
                            </div>
                            <span style={{ fontWeight: 700 }}>{(l as any).employee?.full_name ?? '—'}</span>
                          </div>
                        </td>
                        <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l.type}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{l.days_count || '—'}d</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }} onClick={async () => {
                              await supabase.from('leave_requests').update({ status: 'manager_approved' }).eq('id', l.id);
                              if (l.workflow_id) {
                                await supabase.from('workflows').update({ status: 'under_review', updated_at: new Date().toISOString() }).eq('id', l.workflow_id);
                                await supabase.from('workflow_steps').insert({
                                  workflow_id: l.workflow_id,
                                  company_id: user?.company_id,
                                  step_order: 1,
                                  step_name: 'Manager Review (Quick)',
                                  approver_role: 'manager',
                                  approver_id: user?.id,
                                  status: 'approved',
                                  timestamp: new Date().toISOString()
                                });
                              }
                              setTeamLeaves(prev => prev.filter(x => x.id !== l.id));
                            }}>Approve</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={async () => {
                              await supabase.from('leave_requests').update({ status: 'rejected' }).eq('id', l.id);
                              if (l.workflow_id) {
                                await supabase.from('workflows').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', l.workflow_id);
                                await supabase.from('workflow_steps').insert({
                                  workflow_id: l.workflow_id,
                                  company_id: user?.company_id,
                                  step_order: 1,
                                  step_name: 'Manager Review (Quick)',
                                  approver_role: 'manager',
                                  approver_id: user?.id,
                                  status: 'rejected',
                                  timestamp: new Date().toISOString()
                                });
                              }
                              setTeamLeaves(prev => prev.filter(x => x.id !== l.id));
                            }}>Deny</button>
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
      </div>

      {/* Intelligence Table */}
      <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.8s forwards', opacity: 0 }}>
        <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
          <div className="card-title" style={{ fontSize: 20, fontWeight: 700 }}>Active Intelligence Directory</div>
          <span className="badge badge-blue" style={{ padding: '6px 14px' }}>{workflows.length} Operations</span>
        </div>
        <div className="card-body" style={{ padding: '12px' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" /></div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr style={{ background: 'rgba(0,0,0,0.02)' }}><th>Intelligence Unit</th><th>Category</th><th>Owner</th><th>Priority</th><th>Status</th><th>Updated</th></tr></thead>
                <tbody>
                  {workflows.map(w => {
                    const badge = STATUS_BADGE[w.status] ?? { label: w.status, cls: 'badge-gray' };
                    const creator = (w as any).creator;
                    return (
                      <tr key={w.id} className="hover-lift" style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                        <td style={{ fontWeight: 800, color: 'var(--text-primary)', padding: '18px 24px' }}>{w.title}</td>
                        <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{w.type}</td>
                        <td style={{ fontWeight: 600, opacity: 0.8 }}>{creator?.full_name ?? creator?.email ?? '—'}</td>
                        <td>
                          <span className={`badge ${w.priority === 'urgent' ? 'badge-red' : w.priority === 'high' ? 'badge-orange' : 'badge-gray'}`} style={{ minWidth: 70, textAlign: 'center', justifyContent: 'center' }}>
                            {w.priority}
                          </span>
                        </td>
                        <td><span className={`badge ${badge.cls}`} style={{ padding: '6px 14px' }}>{badge.label}</span></td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
