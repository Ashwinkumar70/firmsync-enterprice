import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { supabase } from '../../lib/supabase';
import type { LeaveRequest, UserProfile, Department } from '../../lib/types';
import { Calendar, CheckCircle, XCircle, Clock, Info, User, MessageSquare } from 'lucide-react';

type LeaveWithEmployee = LeaveRequest & {
  employee: Pick<UserProfile, 'id' | 'full_name' | 'email' | 'department_id'>;
};

export const HRLeaveApprovals: React.FC = () => {
  const [requests, setRequests]     = useState<LeaveWithEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<'pending_hr' | 'all'>('pending_hr');
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const [lRes, dRes] = await Promise.all([
      supabase
        .from('leave_requests')
        .select('*, employee:users!employee_id(id, full_name, email, department_id)')
        .order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('name'),
    ]);

    if (lRes.error) {
      setError('Failed to load leave requests: ' + lRes.error.message);
    } else {
      setRequests((lRes.data ?? []) as LeaveWithEmployee[]);
    }
    setDepartments((dRes.data ?? []) as Department[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getDeptName = (deptId: string | null | undefined) =>
    departments.find(d => d.id === deptId)?.name ?? '—';

  const handleAction = async (
    id: string,
    employeeId: string,
    newStatus: 'hr_approved' | 'approved' | 'rejected',
    leaveType: string,
  ) => {
    setActioningId(id);
    const comment = commentMap[id] ?? '';
    const targetRequest = requests.find(r => r.id === id);

    const { error: upErr } = await supabase
      .from('leave_requests')
      .update({ status: newStatus, hr_comment: comment || null })
      .eq('id', id);

    if (upErr) {
      setError('Action failed: ' + upErr.message);
      setActioningId(null);
      return;
    }

    // SYNC WORKFLOW
    if (targetRequest?.workflow_id) {
      // Update workflow status
      await supabase.from('workflows').update({
        status: newStatus === 'rejected' ? 'rejected' : 'approved',
        updated_at: new Date().toISOString()
      }).eq('id', targetRequest.workflow_id);

      // Add audit step
      await supabase.from('workflow_steps').insert({
        workflow_id: targetRequest.workflow_id,
        company_id: targetRequest.company_id,
        step_order: 2,
        step_name: 'HR Review',
        approver_role: 'hr',
        approver_id: null, // HR is generic here
        status: newStatus === 'rejected' ? 'rejected' : 'approved',
        comments: comment || null,
        timestamp: new Date().toISOString()
      });
    }

    const label = newStatus === 'rejected' ? 'rejected' : 'approved';
    await supabase.from('notifications').insert({
      company_id: targetRequest?.company_id,
      user_id: employeeId,
      title: `Leave ${label === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
      message: `Your ${leaveType} leave request has been ${label} by HR.${comment ? ` Note: "${comment}"` : ''}`,
      type: label === 'approved' ? 'success' : 'error',
    });

    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: newStatus, hr_comment: comment || null } : r)
    );
    setCommentMap(prev => { const n = { ...prev }; delete n[id]; return n; });
    setSuccess(`Leave request ${label}.`);
    setTimeout(() => setSuccess(null), 3000);
    setActioningId(null);
  };

  // HR sees: pending_hr → manager_approved requests; all → everything
  const pendingHR = requests.filter(r => r.status === 'manager_approved');
  const filtered  = filter === 'pending_hr' ? pendingHR : requests;

  const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-yellow',
    manager_approved: 'badge-blue',
    hr_approved: 'badge-purple',
    approved: 'badge-green',
    rejected: 'badge-red',
  };

  return (
    <PageWrapper pageTitle="HR Leave Approvals">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Leave Approvals</h1>
          <p className="page-subtitle">Second-level approval for manager-approved leave requests</p>
        </div>
        <div className="tab-nav" style={{ marginBottom: 0 }}>
          <button
            className={`tab-item ${filter === 'pending_hr' ? 'active' : ''}`}
            onClick={() => setFilter('pending_hr')}
          >
            Awaiting HR
            {pendingHR.length > 0 && (
              <span className="badge badge-yellow" style={{ marginLeft: 8 }}>{pendingHR.length}</span>
            )}
          </button>
          <button
            className={`tab-item ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All History
          </button>
        </div>
      </div>

      {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>⚠ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ {success}</div>}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Calendar size={32} /></div>
          <div className="empty-state-title">
            {filter === 'pending_hr' ? 'No pending HR approvals' : 'No leave request history'}
          </div>
          <div className="empty-state-text">
            {filter === 'pending_hr'
              ? 'All manager-approved requests have been processed.'
              : 'No leave requests across the organisation yet.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(r => (
            <div key={r.id} className="card">
              <div className="card-body">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(99,102,241,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', flexShrink: 0
                  }}>
                    <User size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                          {r.employee?.full_name ?? 'Unknown Employee'}
                        </h3>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {r.employee?.email} · {getDeptName(r.employee?.department_id)}
                        </div>
                      </div>
                      <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-gray'}`}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} />
                    {new Date(r.start_date).toLocaleDateString()} — {new Date(r.end_date).toLocaleDateString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} />
                    {r.days_count} day{r.days_count !== 1 ? 's' : ''} · <strong style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{r.type}</strong>
                  </span>
                </div>

                {r.reason && (
                  <div style={{
                    padding: '8px 12px', background: 'var(--bg)',
                    borderRadius: 'var(--radius)', fontSize: 13,
                    borderLeft: '3px solid var(--border)',
                    display: 'flex', gap: 8, color: 'var(--text-secondary)', marginBottom: 12
                  }}>
                    <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span><strong>Reason:</strong> {r.reason}</span>
                  </div>
                )}

                {r.manager_comment && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    <strong>Manager's comment:</strong> {r.manager_comment}
                  </div>
                )}

                {r.hr_comment && r.status !== 'manager_approved' && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    <strong>Your comment:</strong> {r.hr_comment}
                  </div>
                )}

                {/* Action area */}
                {r.status === 'manager_approved' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <MessageSquare size={12} /> Comment (optional)
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: 13 }}
                        placeholder="Add an HR note..."
                        value={commentMap[r.id] ?? ''}
                        onChange={e => setCommentMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-success btn-sm"
                        disabled={actioningId === r.id}
                        onClick={() => handleAction(r.id, r.employee.id, 'approved', r.type)}
                      >
                        {actioningId === r.id
                          ? <div className="spinner" style={{ width: 14, height: 14 }} />
                          : <><CheckCircle size={15} /> Approve</>
                        }
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={actioningId === r.id}
                        onClick={() => handleAction(r.id, r.employee.id, 'rejected', r.type)}
                      >
                        {actioningId === r.id
                          ? <div className="spinner" style={{ width: 14, height: 14 }} />
                          : <><XCircle size={15} /> Reject</>
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};
