import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { LeaveRequest } from '../../lib/types';
import { Calendar, CheckCircle, XCircle, Clock, Info, User, MessageSquare } from 'lucide-react';

type LeaveWithEmployee = LeaveRequest & {
  employee: { id: string; full_name: string; email: string; department_id: string | null };
};

export const LeaveApprovals: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'pending' | 'all'>('pending');
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    // RLS policy (leave_manager_dept) already restricts rows to manager's department.
    // We just fetch & let the server enforce access.
    const { data, error: qErr } = await supabase
      .from('leave_requests')
      .select('*, employee:users!employee_id(id, full_name, email, department_id)')
      .order('created_at', { ascending: false });

    if (qErr) {
      setError('Failed to load leave requests: ' + qErr.message);
    } else {
      setRequests((data ?? []) as LeaveWithEmployee[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const handleAction = async (
    id: string,
    employeeId: string,
    newStatus: 'manager_approved' | 'rejected',
    leaveType: string,
  ) => {
    setActioningId(id);
    const comment = commentMap[id] ?? '';

    const { error: upErr } = await supabase
      .from('leave_requests')
      .update({ status: newStatus, manager_comment: comment || null })
      .eq('id', id);

    if (upErr) {
      setError('Action failed: ' + upErr.message);
      setActioningId(null);
      return;
    }

    // Notify the employee
    const actionLabel = newStatus === 'manager_approved' ? 'approved' : 'rejected';
    await supabase.from('notifications').insert({
      user_id: employeeId,
      title: `Leave ${actionLabel === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
      message: `Your ${leaveType} leave request has been ${actionLabel} by your manager.${comment ? ` Comment: "${comment}"` : ''}`,
      type: newStatus === 'manager_approved' ? 'success' : 'error',
    });

    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: newStatus, manager_comment: comment || null } : r)
    );
    setCommentMap(prev => { const n = { ...prev }; delete n[id]; return n; });
    setActioningId(null);
  };

  const filtered = filter === 'pending'
    ? requests.filter(r => r.status === 'pending')
    : requests;

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-yellow',
      manager_approved: 'badge-blue',
      hr_approved: 'badge-purple',
      approved: 'badge-green',
      rejected: 'badge-red',
    };
    return map[status] ?? 'badge-gray';
  };

  return (
    <PageWrapper pageTitle="Leave Approvals">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Leave Approvals</h1>
          <p className="page-subtitle">Review and manage time-off requests from your team</p>
        </div>
        <div className="tab-nav" style={{ marginBottom: 0 }}>
          <button
            className={`tab-item ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending{' '}
            {pendingCount > 0 && (
              <span className="badge badge-yellow" style={{ marginLeft: 8 }}>{pendingCount}</span>
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

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {!user?.department_id && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          ⚠ You are not assigned to a department. Employees in unassigned departments will not appear here. Ask your admin to assign you and your team to a department.
        </div>
      )}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Calendar size={32} /></div>
          <div className="empty-state-title">No {filter === 'pending' ? 'pending ' : ''}leave requests</div>
          <div className="empty-state-text">
            {filter === 'pending'
              ? 'Your team currently has no pending leave requests.'
              : 'No leave request history to show yet.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(r => (
            <div key={r.id} className="card">
              <div className="card-body">
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(59,130,246,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', flexShrink: 0
                  }}>
                    <User size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                        {r.employee?.full_name ?? 'Unknown Employee'}
                      </h3>
                      <span className={`badge ${statusBadge(r.status)}`} style={{ textTransform: 'capitalize' }}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {r.employee?.email}
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
                    <span>{r.reason}</span>
                  </div>
                )}

                {/* Existing manager comment (if already acted on) */}
                {r.manager_comment && r.status !== 'pending' && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    <strong>Your comment:</strong> {r.manager_comment}
                  </div>
                )}

                {/* Action area - only for pending */}
                {r.status === 'pending' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <MessageSquare size={12} /> Comment (optional)
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: 13 }}
                        placeholder="Add a note for the employee..."
                        value={commentMap[r.id] ?? ''}
                        onChange={e => setCommentMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-success btn-sm"
                        disabled={actioningId === r.id}
                        onClick={() => handleAction(r.id, r.employee.id, 'manager_approved', r.type)}
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
