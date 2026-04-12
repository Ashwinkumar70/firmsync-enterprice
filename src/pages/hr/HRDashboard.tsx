import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { LeaveRequest, UserProfile } from '../../lib/types';
import { Link } from 'react-router-dom';
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
    approvedLeaves: 0,
    openTickets: 0
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
        appLv,
        opentc
      ] = await Promise.all([
        supabase.from('leave_requests').select('*, employee:users!employee_id(full_name, email)').eq('status', 'manager_approved').order('created_at', { ascending: false }),
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'manager_approved'),
        supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
      
      setPendingLeaves((pl.data ?? []) as LeaveWithEmployee[]);
      setAllLeaves((al.data ?? []) as LeaveRequest[]);
      setEmployees((emp.data ?? []) as UserProfile[]);
      setCounts({
        totalEmployees: totalEmp.count ?? 0,
        activeEmployees: activeEmp.count ?? 0,
        pendingHR: penHR.count ?? 0,
        approvedLeaves: appLv.count ?? 0,
        openTickets: opentc.count ?? 0
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
      {/* Premium Hero Section */}
      <div style={{ marginBottom: 32, animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: '20px', 
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            fontSize: 28, fontWeight: 800, 
            boxShadow: '0 12px 24px -6px rgba(139, 92, 246, 0.4)',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            HR
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: 34, marginBottom: 4, letterSpacing: '-0.02em' }}>
              HR Command Center
            </h1>
            <p className="page-subtitle" style={{ fontSize: 16 }}>
              Supervising <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{counts.totalEmployees} Employees</span> • Global Talent & Operations
            </p>
          </div>
        </div>
      </div>

      {/* Premium HR Insight */}
      <div className="ai-insight hover-lift" style={{ marginBottom: 32, animation: 'fadeInUp 0.6s ease-out 0.2s forwards', opacity: 0 }}>
        <div className="ai-insight-header" style={{ color: 'var(--accent)', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 10, marginBottom: 10 }}>
          <Zap size={16} fill="var(--accent)" /> HR Operational Intelligence
        </div>
        <div className="ai-insight-text" style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>
          {counts.pendingHR > 0
            ? `${counts.pendingHR} leave request${counts.pendingHR > 1 ? 's' : ''} have cleared manager review and require your final authorization.`
            : counts.openTickets > 0 
            ? `System check: ${counts.openTickets} support tickets are currently open and pending resolution.`
            : 'Operational status: Optimal. No pending leave authorizations in your queue.'}
        </div>
      </div>

      {/* Glowing KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Workforce', value: counts.totalEmployees, icon: <Users size={20} />, color: 'blue' },
          { label: 'Open Incidents', value: counts.openTickets, icon: <Zap size={20} />, color: 'red', to: '/hr/tickets' },
          { label: 'Final Sign-offs', value: counts.pendingHR, icon: <Calendar size={20} />, color: 'orange', to: '/hr/leave-approvals' },
          { label: 'Total Approvals', value: counts.approvedLeaves, icon: <TrendingUp size={20} />, color: 'purple' },
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
              <div className="kpi-label" style={{ fontSize: 13, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>{k.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        {/* Leave Type Pie Chart */}
        <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s forwards', opacity: 0 }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
            <div className="card-title" style={{ fontSize: 18, fontWeight: 700 }}>Leave Distribution</div>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            <div className="chart-wrap" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={leaveByType} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" cy="50%" 
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    stroke="none"
                  >
                    {leaveByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Role Bar Chart */}
        <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.7s forwards', opacity: 0 }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
            <div className="card-title" style={{ fontSize: 18, fontWeight: 700 }}>Workforce Composition</div>
          </div>
          <div className="card-body" style={{ padding: '28px' }}>
            <div className="chart-wrap" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleDistrib}>
                  <defs>
                    <linearGradient id="colorRole" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="url(#colorRole)" name="Count" radius={[8, 8, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Approvals Table */}
      <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out 0.8s forwards', opacity: 0 }}>
        <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '24px 28px' }}>
          <div className="card-title" style={{ fontSize: 20, fontWeight: 700 }}>Final Authorization Queue</div>
          <span className="badge badge-yellow" style={{ padding: '6px 14px' }}>{pendingLeaves.length} Critical</span>
        </div>
        <div className="card-body" style={{ padding: '12px' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" /></div>
          ) : pendingLeaves.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ marginBottom: 16, opacity: 0.2 }}><CheckCircle size={48} /></div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Authorizations Complete</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All manager-approved leave requests have been finalized.</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr style={{ background: 'rgba(0,0,0,0.02)' }}><th>Personnel</th><th>Category</th><th>Term</th><th>Span</th><th>Action</th></tr></thead>
                <tbody>
                  {pendingLeaves.map(l => (
                    <tr key={l.id} className="hover-lift" style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 800 }}>
                            {l.employee?.full_name?.charAt(0) || 'E'}
                          </div>
                          <span style={{ fontWeight: 700 }}>{l.employee?.full_name ?? l.employee?.email ?? '—'}</span>
                        </div>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l.type}</td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>
                        {new Date(l.start_date).toLocaleDateString()} – {new Date(l.end_date).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--accent)' }}>{l.days_count} Days</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" style={{ background: 'var(--accent)', padding: '6px 14px' }} onClick={() => approveLeave(l.id)}>Authorize</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => rejectLeave(l.id)}>Decline</button>
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
    </PageWrapper>
  );
};
