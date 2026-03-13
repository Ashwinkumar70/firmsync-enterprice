import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Save, Info } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  return (
    <PageWrapper pageTitle="Settings">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Global Settings</h1>
          <p className="page-subtitle">Configure application-wide defaults and enterprise preferences</p>
        </div>
        <button className="btn btn-primary"><Save size={16} /> Save Changes</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">General Configuration</div>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Enterprise Name</label>
              <input className="form-input" defaultValue="firmSync Enterprises" />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Base Currency</label>
              <select className="form-input">
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-input">
                <option value="IST">(GMT+05:30) Mumbai, New Delhi</option>
                <option value="UTC">(GMT+00:00) UTC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Security & Auth</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>Enforce MFA</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>All staff must use two-factor auth</div>
                </div>
                <div className="toggle-switch" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>Manager overrides</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Allow managers to bypass auto-reject rules</div>
                </div>
                <div className="toggle-switch active" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <Info size={20} className="text-accent" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>System Maintenance</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The system is currently running on version <strong>2.4.1</strong>. All database migrations are up to date.
              Last backup was performed at <strong>Today, 04:00 AM</strong>.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
