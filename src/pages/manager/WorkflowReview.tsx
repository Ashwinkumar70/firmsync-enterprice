import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Workflow, WorkflowStep } from '../../lib/types';
import { CheckCircle, XCircle, MessageSquare, Filter } from 'lucide-react';

type WorkflowWithSteps = Workflow & { creator?: { full_name?: string; email?: string }; workflow_steps?: WorkflowStep[] };

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  created: { label: 'New', cls: 'badge-gray' },
  assigned: { label: 'Assigned', cls: 'badge-blue' },
  under_review: { label: 'In Review', cls: 'badge-yellow' },
  approved: { label: 'Approved', cls: 'badge-green' },
  rejected: { label: 'Rejected', cls: 'badge-red' },
  completed: { label: 'Completed', cls: 'badge-purple' },
};

export const WorkflowReview: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [selectedWf, setSelectedWf] = useState<WorkflowWithSteps | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetch = async () => {
    if (!user) return;
    let query = supabase
      .from('workflows')
      .select('*, creator:users!created_by(full_name, email), workflow_steps(*)')
      .eq('department_id', user.department_id)
      .order('created_at', { ascending: false });

    if (filter === 'pending') query = query.in('status', ['created', 'assigned', 'under_review']);
    else if (filter !== 'all') query = query.eq('status', filter);

    const { data } = await query;
    setWorkflows((data ?? []) as WorkflowWithSteps[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user, filter]);

  const handleAction = async (action: 'approved' | 'rejected') => {
    if (!selectedWf || !user) return;
    setProcessing(true);

    await supabase.from('workflows').update({
      status: action,
      assigned_to: user.id,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedWf.id);

    await supabase.from('workflow_steps').insert({
      workflow_id: selectedWf.id,
      step_order: 1,
      step_name: 'Manager Review',
      approver_role: 'manager',
      approver_id: user.id,
      status: action,
      comments: comment || null,
      timestamp: new Date().toISOString(),
    });

    // Notify creator
    await supabase.from('notifications').insert({
      company_id: user.company_id,
      user_id: selectedWf.created_by,
      title: `Request ${action === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your request "${selectedWf.title}" has been ${action} by your manager.${comment ? ` Comment: ${comment}` : ''}`,
      type: action === 'approved' ? 'success' : 'error',
    });

    setComment('');
    setSelectedWf(null);
    setProcessing(false);
    fetch();
  };

  return (
    <PageWrapper pageTitle="Workflow Review">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Workflow Review</h1>
          <p className="page-subtitle">Review and act on your team's requests</p>
        </div>
        <div className="filter-bar" style={{ margin: 0 }}>
          <Filter size={16} style={{ color: 'var(--text-secondary)', alignSelf: 'center' }} />
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Workflow list */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Requests</div>
            <span className="badge badge-blue">{workflows.length}</span>
          </div>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
          ) : workflows.length === 0 ? (
            <div className="empty-state"><div className="empty-state-title">No workflows found</div></div>
          ) : (
            <div style={{ maxHeight: 560, overflowY: 'auto' }}>
              {workflows.map(w => {
                const badge = STATUS_BADGE[w.status] ?? { label: w.status, cls: 'badge-gray' };
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWf(w)}
                    style={{
                      padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      background: selectedWf?.id === w.id ? 'rgba(59,130,246,0.04)' : 'transparent',
                      borderLeft: selectedWf?.id === w.id ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{w.title}</span>
                      <span className={`badge ${badge.cls}`} style={{ fontSize: 10 }}>{badge.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      By: {w.creator?.full_name ?? w.creator?.email ?? '—'} · {new Date(w.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{w.type}</span>
                      <span className={`badge ${w.priority === 'urgent' ? 'badge-red' : w.priority === 'high' ? 'badge-orange' : 'badge-gray'}`} style={{ fontSize: 10 }}>{w.priority}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">{selectedWf ? 'Request Detail' : 'Select a request'}</div>
          </div>
          {!selectedWf ? (
            <div className="empty-state"><div className="empty-state-text">Click a workflow to review it</div></div>
          ) : (
            <div className="card-body">
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{selectedWf.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>{selectedWf.description ?? 'No description provided.'}</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span className={`badge ${STATUS_BADGE[selectedWf.status]?.cls ?? 'badge-gray'}`}>{STATUS_BADGE[selectedWf.status]?.label}</span>
                  <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{selectedWf.type}</span>
                  <span className={`badge ${selectedWf.priority === 'urgent' ? 'badge-red' : 'badge-orange'}`}>{selectedWf.priority}</span>
                </div>
              </div>

              {/* Steps history */}
              {selectedWf.workflow_steps && selectedWf.workflow_steps.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase' }}>Approval History</div>
                  <ul className="timeline">
                    {selectedWf.workflow_steps.map(s => (
                      <li key={s.id} className="timeline-item">
                        <div className={`timeline-dot ${s.status}`} />
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{s.step_name} – <span style={{ textTransform: 'capitalize' }}>{s.status}</span></div>
                        {s.comments && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.comments}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action panel for pending */}
              {['created', 'assigned', 'under_review'].includes(selectedWf.status) && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Your Decision</div>
                  <div className="form-group">
                    <label className="form-label"><MessageSquare size={13} style={{ display: 'inline', marginRight: 6 }} />Comment (optional)</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Add a comment for the employee..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-success" disabled={processing} onClick={() => handleAction('approved')}>
                      <CheckCircle size={16} />{processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button className="btn btn-danger" disabled={processing} onClick={() => handleAction('rejected')}>
                      <XCircle size={16} />Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
