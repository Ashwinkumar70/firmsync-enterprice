import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FileText, Download, Filter } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const hrStats = [
  { name: 'Engineering', count: 45 },
  { name: 'Product', count: 12 },
  { name: 'Sales', count: 28 },
  { name: 'HR', count: 8 },
  { name: 'Finance', count: 6 },
];

export const HRReports: React.FC = () => {
  return (
    <PageWrapper pageTitle="HR Reports">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">HR Reports & Analytics</h1>
          <p className="page-subtitle">Generate workforce breakdown and department analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary"><Filter size={16} /> Filters</button>
          <button className="btn btn-primary"><Download size={16} /> Export PDF</button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Department Distribution</div>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hrStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {hrStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Headcount Growth</div>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hrStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Generated Reports</div>
        </div>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><th>Report Name</th><th>Date Generated</th><th>Format</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {[
                { name: 'Q1 Workforce Breakdown', date: 'March 1, 2026', format: 'PDF', status: 'Ready' },
                { name: 'Annual Turnover Analysis', date: 'Jan 15, 2026', format: 'Excel', status: 'Ready' },
                { name: 'Monthly Payroll Summary', date: 'Feb 28, 2026', format: 'PDF', status: 'Processing' },
              ].map(r => (
                <tr key={r.name}>
                  <td style={{ fontWeight: 600 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={14} /> {r.name}</div></td>
                  <td style={{ fontSize: 13 }}>{r.date}</td>
                  <td><span className="badge badge-gray">{r.format}</span></td>
                  <td><span className={`badge ${r.status === 'Ready' ? 'badge-green' : 'badge-yellow'}`}>{r.status}</span></td>
                  <td><button className="btn btn-secondary btn-sm" disabled={r.status !== 'Ready'}><Download size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};
