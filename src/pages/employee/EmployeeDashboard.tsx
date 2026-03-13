import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import {
  Calendar, FolderOpen, Ticket, ShoppingCart, Star, TrendingUp,
  Clock, CheckCircle, XCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import type { Workflow } from '../../lib/types';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  created:      { label: 'Submitted',   cls: 'badge-gray'   },
  assigned:     { label: 'Assigned',    cls: 'badge-blue'   },
  under_review: { label: 'In Review',   cls: 'badge-yellow' },
  approved:     { label: 'Approved',    cls: 'badge-green'  },
  rejected:     { label: 'Rejected',    cls: 'badge-red'    },
  completed:    { label: 'Completed',   cls: 'badge-purple' },
  pending:      { label: 'Pending',     cls: 'badge-yellow' },
  open:         { label: 'Open',        cls: 'badge-blue'   },
  in_progress:  { label: 'In Progress', cls: 'badge-orange' },
  resolved:     { label: 'Resolved',    cls: 'badge-green'  },
};

const quickActions = [
  { label: 'Request Leave', icon: <Calendar size={22} />, to: '/employee/leave', color: 'blue' },
  { label: 'Submit Project', icon: <FolderOpen size={22} />, to: '/employee/projects', color: 'purple' },
  { label: 'Create Ticket', icon: <Ticket size={22} />, to: '/employee/tickets', color: 'orange' },
  { label: 'Purchase Request', icon: <ShoppingCart size={22} />, to: '/employee/purchases', color: 'green' },
  { label: 'Skill Profile', icon: <Star size={22} />, to: '/employee/skills', color: 'red' },
];

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [leaveCount, setLeaveCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [wf, lv, tc] = await Promise.all([
        supabase.from('workflows').select('*').eq('created_by', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('leave_requests').select('id', { count: 'exact' }).eq('employee_id', user.id).neq('status', 'approved'),
        supabase.from('support_tickets').select('id', { count: 'exact' }).eq('reporter_id', user.id).eq('status', 'open'),
      ]);
      setWorkflows((wf.data ?? []) as Workflow[]);
      setLeaveCount(lv.count ?? 0);
      setTicketCount(tc.count ?? 0);
      setLoading(false);
    };
    load();
  }, [user]);

  const approved = workflows.filter(w => w.status === 'approved' || w.status === 'completed').length;
  const pending = workflows.filter(w => ['created','assigned','under_review'].includes(w.status)).length;
  const rejected = workflows.filter(w => w.status === 'rejected').length;

  return (
    <PageWrapper pageTitle="Employee Dashboard">
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Good day, {user?.full_name?.split(' ')[0] || 'Employee'} 👋</h1>
        <p className="page-subtitle">Here's an overview of your current workflows and activity.</p>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        {[
          { label: 'Total Requests', value: workflows.length, icon: <TrendingUp size={20} />, color: 'blue' },
          { label: 'Approved', value: approved, icon: <CheckCircle size={20} />, color: 'green' },
          { label: 'Pending', value: pending, icon: <Clock size={20} />, color: 'orange' },
          { label: 'Rejected', value: rejected, icon: <XCircle size={20} />, color: 'red' },
          { label: 'Open Leave', value: leaveCount, icon: <Calendar size={20} />, color: 'purple' },
          { label: 'Open Tickets', value: ticketCount, icon: <AlertCircle size={20} />, color: 'blue' },
        ].map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
            <div className="kpi-value">{loading ? '–' : k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Actions</div>
              <div className="card-subtitle">Submit a new request</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map(a => (
              <Link
                key={a.to}
                to={a.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  textDecoration: 'none', color: 'inherit', transition: 'all 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className={`kpi-icon ${a.color}`} style={{ width: 38, height: 38, marginBottom: 0 }}>{a.icon}</div>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.label}</span>
                <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Workflows */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Requests</div>
              <div className="card-subtitle">Latest workflow submissions</div>
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
          ) : workflows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><TrendingUp size={28} /></div>
              <div className="empty-state-title">No requests yet</div>
              <div className="empty-state-text">Use Quick Actions to submit your first request</div>
            </div>
          ) : (
            <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>Request</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {workflows.map(w => {
                    const badge = STATUS_BADGE[w.status] ?? { label: w.status, cls: 'badge-gray' };
                    return (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 600 }}>{w.title}</td>
                        <td style={{ textTransform: 'capitalize' }}>{w.type}</td>
                        <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {new Date(w.created_at).toLocaleDateString()}
                        </td>
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
