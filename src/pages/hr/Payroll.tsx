import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { supabase } from '../../lib/supabase';
import type { PayrollRecord, UserProfile } from '../../lib/types';
import { DollarSign } from 'lucide-react';

export const Payroll: React.FC = () => {
  const [records, setRecords] = useState<(PayrollRecord & { employee?: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [r, u] = await Promise.all([
        supabase.from('payroll_records').select('*').order('period_start', { ascending: false }).limit(50),
        supabase.from('users').select('id, full_name, email'),
      ]);
      const usersMap: Record<string, { id: string; full_name: string; email: string }> = {};
      (u.data ?? []).forEach((p: { id: string; full_name: string; email: string }) => { usersMap[p.id] = p; });
      const combined = (r.data ?? []).map((rec: PayrollRecord) => ({ ...rec, employee: usersMap[rec.employee_id] }));
      setRecords(combined as (PayrollRecord & { employee?: UserProfile })[]);
      setLoading(false);
    };
    load();
  }, []);


  const STATUS_BADGE: Record<string, string> = { draft: 'badge-gray', processed: 'badge-blue', paid: 'badge-green' };

  const totalNet = records.filter(r => r.status === 'paid').reduce((s, r) => s + r.net_pay, 0);

  return (
    <PageWrapper pageTitle="Payroll">
      <div className="page-header">
        <h1 className="page-title">Payroll Records</h1>
        <p className="page-subtitle">View and manage employee payroll data</p>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><DollarSign size={20} /></div>
          <div className="kpi-value">{records.length}</div>
          <div className="kpi-label">Total Records</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><DollarSign size={20} /></div>
          <div className="kpi-value">${totalNet.toLocaleString()}</div>
          <div className="kpi-label">Total Paid Out</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-icon orange"><DollarSign size={20} /></div>
          <div className="kpi-value">{records.filter(r => r.status === 'draft').length}</div>
          <div className="kpi-label">Pending Processing</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Payroll Records</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Read-only view — payroll integration stub</div>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><DollarSign size={28} /></div>
            <div className="empty-state-title">No payroll records</div>
            <div className="empty-state-text">Payroll records will appear here once set up by the administrator</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Period</th><th>Base Salary</th><th>Bonuses</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.employee?.full_name ?? r.employee?.email ?? '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(r.period_start).toLocaleDateString()} – {new Date(r.period_end).toLocaleDateString()}
                    </td>
                    <td>${r.base_salary.toLocaleString()}</td>
                    <td style={{ color: 'var(--success)' }}>+${r.bonuses.toLocaleString()}</td>
                    <td style={{ color: 'var(--danger)' }}>-${r.deductions.toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>${r.net_pay.toLocaleString()}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span></td>
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
