import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Server, Database, Globe, Cpu, MemoryStick as Memory } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const performanceData = [
  { time: '10:00', cpu: 24, mem: 42, req: 120 },
  { time: '11:00', cpu: 32, mem: 45, req: 150 },
  { time: '12:00', cpu: 45, mem: 48, req: 280 },
  { time: '13:00', cpu: 38, mem: 47, req: 220 },
  { time: '14:00', cpu: 28, mem: 46, req: 180 },
  { time: '15:00', cpu: 35, mem: 44, req: 210 },
  { time: '16:00', cpu: 42, mem: 46, req: 250 },
];

export const SystemMonitor: React.FC = () => {
  return (
    <PageWrapper pageTitle="System Monitor">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">System Monitor</h1>
          <p className="page-subtitle">Real-time health, performance, and usage metrics</p>
        </div>
        <div className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
          <div className="pulse" /> System Operational
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'CPU Usage', value: '32%', icon: <Cpu size={20} />, color: 'blue' },
          { label: 'Memory', value: '4.2GB / 8GB', icon: <Memory size={20} />, color: 'purple' },
          { label: 'DB Connections', value: '18 Active', icon: <Database size={20} />, color: 'green' },
          { label: 'Network Latency', value: '42ms', icon: <Globe size={20} />, color: 'orange' },
        ].map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Server Load (CPU/MEM)</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Last 6 hours</div>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stroke="var(--accent)" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                <Area type="monotone" dataKey="mem" stroke="#8B5CF6" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Request Volume</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Throughput (req/sec)</div>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip />
                <Line type="monotone" dataKey="req" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-title">Instance Health</div>
        </div>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><th>Service</th><th>Version</th><th>Uptime</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {[
                { name: 'API Gateway', v: 'v2.4.1', uptime: '12d 4h', status: 'Healthy' },
                { name: 'Supabase Engine', v: 'v0.18.2', uptime: '45d 1h', status: 'Healthy' },
                { name: 'Asset Delivery (CDN)', v: 'Global', uptime: '99.9%', status: 'Healthy' },
                { name: 'Background Workers', v: 'v1.1.0', uptime: '4h 12m', status: 'Rebooting' },
              ].map(s => (
                <tr key={s.name}>
                  <td style={{ fontWeight: 600 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Server size={14} /> {s.name}</div></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.v}</td>
                  <td style={{ fontSize: 13 }}>{s.uptime}</td>
                  <td><span className={`badge ${s.status === 'Healthy' ? 'badge-green' : 'badge-yellow'}`}>{s.status}</span></td>
                  <td><button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>Logs</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};
