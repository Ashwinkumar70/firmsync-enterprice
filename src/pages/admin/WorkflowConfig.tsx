import React, { useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Settings, Plus, Save, Trash2, ArrowRight, Shield } from 'lucide-react';

export const WorkflowConfig: React.FC = () => {
  const [workflows] = useState([
    { id: '1', name: 'Leave Request', triggers: ['employee'], steps: ['Manager Approval', 'HR Approval'] },
    { id: '2', name: 'Purchase Request', triggers: ['employee', 'manager'], steps: ['Department Head Approval', 'Finance Review', 'Admin Sign-off'] },
    { id: '3', name: 'Project Submission', triggers: ['employee'], steps: ['Manager Feedback', 'Manager Approval'] },
  ]);

  return (
    <PageWrapper pageTitle="Workflow Configuration">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Workflow Configuration</h1>
          <p className="page-subtitle">Define routing rules, approval chains, and automated triggers</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> New Workflow
        </button>
      </div>

      <div className="grid-1">
        {workflows.map(wf => (
          <div key={wf.id} className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="kpi-icon blue" style={{ width: 32, height: 32 }}><Settings size={16} /></div>
                <span className="card-title">{wf.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm"><Save size={14} /></button>
                <button className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Triggered By</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {wf.triggers.map(t => <span key={t} className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{t}</span>)}
                  </div>
                </div>
                
                <ArrowRight size={20} className="text-muted" />

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
                  {wf.steps.map((step, idx) => (
                    <React.Fragment key={step}>
                      <div style={{ background: 'white', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>Step {idx + 1}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{step}</div>
                      </div>
                      {idx < wf.steps.length - 1 && <ArrowRight size={14} className="text-muted" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Shield size={14} /> Global Policy Enabled
                </div>
                <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>Edit Logic</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24, background: 'var(--bg-portal)', border: '2px dashed var(--border)' }}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}><Plus size={32} /></div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Add Custom Workflow Template</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Configure automated routing for new request types</div>
        </div>
      </div>
    </PageWrapper>
  );
};
