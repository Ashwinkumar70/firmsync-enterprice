import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { UserProfile, Department } from '../../lib/types';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Users, Workflow, CheckCircle, TrendingUp, Zap, Settings, Ticket, ShoppingCart, Activity } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [workflows, setWorkflows] = useState<{ status: string; created_at: string }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [counts, setCounts] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalWorkflows: 0,
    approvedWorkflows: 0,
    totalTickets: 0,
    totalPurchases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [u, w, d, totalU, activeU, totalW, approvedW, totalT, totalP] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('workflows').select('status, created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('departments').select('*'),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('workflows').select('id', { count: 'exact', head: true }),
        supabase.from('workflows').select('id', { count: 'exact', head: true }).in('status', ['approved', 'completed']),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }),
        supabase.from('purchase_requests').select('id', { count: 'exact', head: true }),
      ]);
      setUsers((u.data ?? []) as UserProfile[]);
      setWorkflows(w.data ?? []);
      setDepartments((d.data ?? []) as Department[]);
      setCounts({
        totalUsers: totalU.count ?? 0,
        activeUsers: activeU.count ?? 0,
        totalWorkflows: totalW.count ?? 0,
        approvedWorkflows: approvedW.count ?? 0,
        totalTickets: totalT.count ?? 0,
        totalPurchases: totalP.count ?? 0
      });
      setLoading(false);
    };
    load();
  }, []);

  // Monthly workflow trend
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (6 - i));
    const dayStr = targetDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    
    const dayWorkflows = workflows.filter(w => {
      const d = new Date(w.created_at);
      return d.getDate() === targetDate.getDate() && d.getMonth() === targetDate.getMonth();
    });

    return {
      day: dayStr,
      total: dayWorkflows.length,
      approved: dayWorkflows.filter(w => w.status === 'approved' || w.status === 'completed').length,
    };
  });

  const approvalRate = counts.totalWorkflows > 0 ? Math.round((counts.approvedWorkflows / counts.totalWorkflows) * 100) : 0;

  return (
    <PageWrapper pageTitle="Admin Dashboard">
      {/* Premium Hero Section */}
      <div style={{ marginBottom: 32, animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: '20px', 
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            fontSize: 28, fontWeight: 800, 
            boxShadow: '0 12px 24px -6px rgba(15, 23, 42, 0.4)',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            <Settings size={32} />
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: 34, marginBottom: 4, letterSpacing: '-0.02em' }}>
              {user?.company?.name || 'System Command'}
            </h1>
            <p className="page-subtitle" style={{ fontSize: 16 }}>
              Enterprise Infrastructure <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Active</span> • Workspace: {user?.company?.name || 'Default'}
            </p>
          </div>
        </div>
      </div>

      {/* Premium System Intelligence */}
      <div className="ai-insight hover-lift" style={{ marginBottom: 32, animation: 'fadeInUp 0.6s ease-out 0.2s forwards', opacity: 0 }}>
        <div className="ai-insight-header" style={{ color: 'var(--text-primary)', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 10, marginBottom: 10 }}>
          <Activity size={16} style={{ color: 'var(--primary)' }} /> System Core Intelligence
        </div>
        <div className="ai-insight-text" style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>
          Global throughput is optimized with an approval rate of <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{approvalRate}%</span>. 
          System status: {approvalRate < 60 ? (
            <span style={{ color: 'var(--danger)' }}> ⚠️ Performance Degradation Detected. Review routing rules.</span>
          ) : (
            <span style={{ color: 'var(--success)' }}> ✅ Nominal Performance across all nodes.</span>
          )}
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>Total Tickets: {counts.totalTickets} | Active Purchases: {counts.totalPurchases} | Database Latency: 12ms</span>
            {user?.company?.join_code && (
              <div style={{ 
                background: 'rgba(99, 102, 241, 0.1)', 
                padding: '4px 12px', 
                borderRadius: '8px', 
                border: '1px solid rgba(99, 102, 241, 0.2)',
                color: 'var(--primary)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Shield size={14} /> Join Code: <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{user.company.join_code}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Glowing KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Accounts', value: counts.totalUsers, icon: <Users size={20} />, color: 'blue', to: '/admin/users' },
          { label: 'Live Operations', value: counts.totalWorkflows, icon: <Workflow size={20} />, color: 'purple', to: '/admin/workflows' },
          { label: 'Critical Tickets', value: counts.totalTickets, icon: <Ticket size={20} />, color: 'red' },
          { label: 'Budget Requests', value: counts.totalPurchases, icon: <ShoppingCart size={20} />, color: 'orange' },
          { label: 'Service Units', value: departments.length, icon: <Settings size={20} />, color: 'blue', to: '/admin/departments' },
        ].map((k, i) => {
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
              <div className="kpi-label" style={{ fontSize: 13, fontWeight: 700, opacity: 0.7 }}>{k.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        {/* Workflow Trend Area Chart */}
        <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s forwards', opacity: 0 }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
            <div className="card-title" style={{ fontSize: 18, fontWeight: 700 }}>Mission Throughput</div>
          </div>
          <div className="card-body" style={{ padding: '28px' }}>
            <div className="chart-wrap" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAdminTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAdminTotal)" name="Volume" />
                  <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} fillOpacity={0} name="Finalized" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Management Grid */}
        <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.7s forwards', opacity: 0 }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
            <div className="card-title" style={{ fontSize: 18, fontWeight: 700 }}>System Shortcuts</div>
          </div>
          <div className="card-body" style={{ padding: '28px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Link to="/admin/users" className="btn btn-secondary" style={{ padding: '16px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.05)', color: 'var(--primary)', fontWeight: 700, border: '1px solid rgba(99, 102, 241, 0.1)', flexDirection: 'column', gap: 8, height: 'auto' }}>
              <Users size={18} />
              Personnel
            </Link>
            <Link to="/admin/departments" className="btn btn-secondary" style={{ padding: '16px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.05)', color: 'var(--primary)', fontWeight: 700, border: '1px solid rgba(99, 102, 241, 0.1)', flexDirection: 'column', gap: 8, height: 'auto' }}>
              <Settings size={18} />
              Structure
            </Link>
            <Link to="/admin/workflows" className="btn btn-secondary" style={{ padding: '16px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.1)', flexDirection: 'column', gap: 8, height: 'auto' }}>
              <Workflow size={18} />
              Routing
            </Link>
            <Link to="/admin/system-monitor" className="btn btn-secondary" style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.1)', flexDirection: 'column', gap: 8, height: 'auto' }}>
              <Activity size={18} />
              Telemetry
            </Link>
            <Link to="/admin/settings" className="btn btn-primary" style={{ gridColumn: 'span 2', padding: '18px', borderRadius: '16px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', border: 'none', fontWeight: 700, fontSize: 16, boxShadow: '0 10px 20px -5px rgba(0,0,0,0.2)' }}>
              Master Configuration
            </Link>
          </div>
        </div>
      </div>

      {/* Account Telemetry Table */}
      <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.8s forwards', opacity: 0 }}>
        <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
          <div className="card-title" style={{ fontSize: 20, fontWeight: 700 }}>Recent Personnel Onboarding</div>
          <span className="badge badge-blue" style={{ padding: '6px 14px' }}>Active Nodes: {counts.activeUsers}</span>
        </div>
        <div className="card-body" style={{ padding: '12px' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" /></div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr style={{ background: 'rgba(0,0,0,0.02)' }}><th>Identify</th><th>Credentials</th><th>Access Level</th><th>Status</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {users.slice(0, 10).map(u => (
                    <tr key={u.id} className="hover-lift" style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                          <span style={{ fontWeight: 800 }}>{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'manager' ? 'badge-blue' : u.role === 'hr' ? 'badge-purple' : 'badge-gray'}`} style={{ textTransform: 'uppercase', minWidth: 80, justifyContent: 'center' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`} style={{ padding: '4px 12px' }}>
                          {u.is_active ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
