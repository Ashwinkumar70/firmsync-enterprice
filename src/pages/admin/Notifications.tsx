import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Bell, Mail, MessageSquare, Save, Settings, Shield } from 'lucide-react';

export const AdminNotifications: React.FC = () => {
  return (
    <PageWrapper pageTitle="Notifications">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Notification Settings</h1>
          <p className="page-subtitle">Configure system-wide alert rules and email templates</p>
        </div>
        <button className="btn btn-primary"><Save size={16} /> Save Changes</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Email Notifications</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'New Signup Alert', desc: 'Notify admin when a new user registers', icon: <User size={14} />, default: true },
                { label: 'Leave Approval Required', desc: 'Email managers when staff request leave', icon: <Bell size={14} />, default: true },
                { label: 'System Health Alerts', desc: 'Notify when server load exceeds 80%', icon: <Shield size={14} />, default: false },
              ].map(n => (
                <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{n.desc}</div>
                  </div>
                  <div className="toggle-switch active" /> {/* Static toggle for now */}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Portal In-App Alerts</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Project Feedback', desc: 'Alert employees on manager comments', icon: <MessageSquare size={14} />, default: true },
                { label: 'Payroll Processed', desc: 'Notify when monthly salaries are paid', icon: <Wallet size={14} />, default: true },
                { label: 'Workflow Milestone', desc: 'Notify creators on workflow stage completion', icon: <TrendingUp size={14} />, default: false },
              ].map(n => (
                <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{n.desc}</div>
                  </div>
                  <div className="toggle-switch active" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const User = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const TrendingUp = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const Wallet = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>;
