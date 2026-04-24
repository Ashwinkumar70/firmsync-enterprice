import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { TrendingUp, Activity, ClipboardCheck } from 'lucide-react';

export const TeamAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user.department_id) return;
      // Fetch workflow stats for the last 6 months
      const { data: wfs } = await supabase
        .from('workflows')
        .select('created_at, status')
        .eq('department_id', user.department_id);

      if (wfs) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const stats = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          const m = months[d.getMonth()];
          const monthly = wfs.filter(w => new Date(w.created_at).getMonth() === d.getMonth());
          return {
            name: m,
            total: monthly.length,
            completed: monthly.filter(w => w.status === 'completed' || w.status === 'approved').length
          };
        });
        setData(stats);
      }
    };
    load();
  }, [user]);

  return (
    <PageWrapper pageTitle="Team Analytics">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Team Analytics</h1>
        <p className="page-subtitle">Visualizing department performance and workflow efficiency</p>
      </div>

      {!user?.department_id && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          ⚠ <strong>No department assigned.</strong> You are not currently assigned to a department. 
          Please ask your admin to assign you to a department to see analytics.
        </div>
      )}

      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        {/* Workflow Efficiency */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={18} className="text-accent" />
              <div className="card-title">Workflow Completion Rate</div>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-wrap" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    itemStyle={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <Bar dataKey="total" fill="rgba(59, 130, 246, 0.4)" radius={[4, 4, 0, 0]} name="Total Requests" />
                  <Bar dataKey="completed" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={18} className="text-secondary" />
              <div className="card-title">Growth Trend</div>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-wrap" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={3} dot={{ r: 6, fill: 'white', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gap: 24 }}>
        {[
          { label: 'Avg. Completion Time', value: '1.2 Days', icon: <Activity size={20} />, color: 'blue' },
          { label: 'Team Capacity', value: '88%', icon: <ClipboardCheck size={20} />, color: 'green' },
          { label: 'Efficiency Index', value: '94/100', icon: <TrendingUp size={20} />, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className={`kpi-icon ${stat.color}`} style={{ marginBottom: 0 }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};
