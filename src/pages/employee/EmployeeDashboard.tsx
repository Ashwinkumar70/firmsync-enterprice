import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import {
  Calendar, FolderOpen, Ticket, ShoppingCart, Star, TrendingUp,
  Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, Zap, Workflow, ClipboardList
} from 'lucide-react';
import type { Workflow as WorkflowType } from '../../lib/types';

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
  { label: 'Request Leave', icon: <Calendar size={20} />, to: '/employee/leave', color: 'blue' },
  { label: 'Submit Project', icon: <FolderOpen size={20} />, to: '/employee/projects', color: 'purple' },
  { label: 'Create Ticket', icon: <Ticket size={20} />, to: '/employee/tickets', color: 'orange' },
  { label: 'Purchase Request', icon: <ShoppingCart size={20} />, to: '/employee/purchases', color: 'green' },
  { label: 'Skill Profile', icon: <Star size={20} />, to: '/employee/skills', color: 'red' },
];

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    openLeave: 0,
    openTickets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      
      const [
        wf, 
        total, 
        approved, 
        pending, 
        rejected, 
        lv, 
        tc
      ] = await Promise.all([
        supabase.from('workflows').select('*').eq('created_by', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('created_by', user.id).in('status', ['approved', 'completed']),
        supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('created_by', user.id).in('status', ['created', 'assigned', 'under_review', 'pending']),
        supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('created_by', user.id).eq('status', 'rejected'),
        supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('employee_id', user.id).in('status', ['pending', 'manager_approved', 'hr_approved']),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('reporter_id', user.id).eq('status', 'open'),
      ]);

      setWorkflows((wf.data ?? []) as WorkflowType[]);
      setCounts({
        total: total.count ?? 0,
        approved: approved.count ?? 0,
        pending: pending.count ?? 0,
        rejected: rejected.count ?? 0,
        openLeave: lv.count ?? 0,
        openTickets: tc.count ?? 0
      });
      setLoading(false);
    };
    load();
  }, [user]);

  const kpis = React.useMemo(() => [
    { label: '⚡ Active Tasks', value: counts.pending, icon: <Zap size={20} />, color: 'blue' },
    { label: '✅ Approved', value: counts.approved, icon: <CheckCircle size={20} />, color: 'green' },
    { label: '⏳ Pending', value: counts.pending, icon: <Clock size={20} />, color: 'orange' },
    { label: '❌ Rejected', value: counts.rejected, icon: <XCircle size={20} />, color: 'red' },
    { label: '🌴 Leave Balance', value: counts.openLeave, icon: <Calendar size={20} />, color: 'purple', to: '/employee/leave' },
    { label: '🎫 Open Tickets', value: counts.openTickets, icon: <AlertCircle size={20} />, color: 'orange', to: '/employee/tickets' },
  ], [counts]);

  return (
    <PageWrapper pageTitle="Employee Dashboard">
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
            {user?.full_name?.charAt(0) || 'E'}
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: 34, marginBottom: 4, letterSpacing: '-0.02em' }}>
              Welcome back, {user?.full_name?.split(' ')[0] || 'Employee'}
            </h1>
            <p className="page-subtitle" style={{ fontSize: 16 }}>
              You have {counts.pending > 0 ? (
                <><span style={{ color: 'var(--primary)', fontWeight: 700 }}>{counts.pending} pending requests</span> under review.</>
              ) : (
                'Your dashboard is clear. Every request has been processed.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Redesign */}
      <div className="kpi-grid" style={{ marginBottom: 32 }}>
        {kpis.map((k, i) => {
          const CardComp = k.to ? (props: any) => <Link to={k.to!} {...props} /> : (props: any) => <div {...props} />;
          return (
            <CardComp 
              key={k.label} 
              className={`kpi-card ${k.color}`} 
              style={{ 
                textDecoration: 'none', 
                animation: `fadeInUp 0.5s ease-out forwards ${i * 0.1}s`,
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
              <div className="kpi-label" style={{ fontSize: 13, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {k.label}
              </div>
            </CardComp>
          )
        })}
      </div>

      <div className="grid-2">
        {/* Quick Actions Module */}
        <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s forwards', opacity: 0 }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
            <div>
              <div className="card-title" style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Zap size={20} style={{ color: 'var(--primary)' }} />
                Smart Actions
              </div>
              <div className="card-subtitle">One-click workflow submissions</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {quickActions.map(a => (
                <Link
                  key={a.to}
                  to={a.to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                    background: 'rgba(255,255,255,0.4)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)',
                    textDecoration: 'none', color: 'inherit', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="hover-lift"
                >
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 12, 
                    background: `rgba(var(--${a.color}-rgb, 99, 102, 241), 0.1)`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--${a.color})` 
                  }}>
                    {a.icon}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{a.label}</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                </Link>
              ))}
              <div style={{ gridColumn: 'span 2', padding: '12px', background: 'rgba(79, 70, 229, 0.04)', borderRadius: 12, border: '1px dashed var(--primary)', textAlign: 'center', color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>
                Request additional access via HR Support
              </div>
            </div>
          </div>
        </div>

        {/* Activity Intelligence */}
        <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.5s forwards', opacity: 0 }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
            <div>
              <div className="card-title" style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Workflow size={20} style={{ color: 'var(--primary)' }} />
                Recent Intelligence
              </div>
              <div className="card-subtitle">Live status tracking</div>
            </div>
            <Link to="/employee/leave" className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }}>History</Link>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" /></div>
            ) : workflows.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ marginBottom: 12, opacity: 0.3 }}><ClipboardList size={40} /></div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>No Active Intel</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Start a new request to see live tracking.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {workflows.map(w => {
                  const badge = STATUS_BADGE[w.status] ?? { label: w.status, cls: 'badge-gray' };
                  return (
                    <div key={w.id} style={{ 
                      padding: '16px', borderRadius: '16px', 
                      background: 'rgba(255,255,255,0.4)', 
                      border: '1px solid rgba(0,0,0,0.03)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }} className="hover-lift">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ 
                          width: 44, height: 44, borderRadius: 12, 
                          background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: 'var(--primary)'
                        }}>
                          <ClipboardList size={22} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{w.title || (w.type.charAt(0).toUpperCase() + w.type.slice(1) + ' Request')}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                      </div>
                      <span className={`badge ${badge.cls}`} style={{ padding: '6px 14px' }}>{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
