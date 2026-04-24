import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { LeaveRequest, UserProfile, Department } from '../../lib/types';
import { Calendar, CheckCircle, XCircle, Clock, Info, User, Search } from 'lucide-react';

type LeaveWithEmployee = LeaveRequest & {
  employee: Pick<UserProfile, 'id' | 'full_name' | 'email' | 'department_id'>;
};

type StatusFilter = 'all' | 'pending' | 'manager_approved' | 'hr_approved' | 'approved' | 'rejected';

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-yellow',
  manager_approved: 'badge-blue',
  hr_approved: 'badge-purple',
  approved: 'badge-green',
  rejected: 'badge-red',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  manager_approved: 'Manager Approved',
  hr_approved: 'HR Approved',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const LeaveManagement: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests]   = useState<LeaveWithEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<StatusFilter>('all');
  const [search, setSearch]       = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const [lRes, dRes] = await Promise.all([
      supabase
        .from('leave_requests')
        .select('*, employee:users!employee_id(id, full_name, email, department_id)')
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false }),
      supabase.from('departments').select('*').eq('company_id', user.company_id).order('name'),
    ]);

    if (lRes.error) setError('Failed to load leave requests: ' + lRes.error.message);
    else setRequests((lRes.data ?? []) as LeaveWithEmployee[]);

    setDepartments((dRes.data ?? []) as Department[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const getDeptName = (deptId: string | null | undefined) =>
    departments.find(d => d.id === deptId)?.name ?? '—';

  const handleAction = async (
    id: string,
    employeeId: string,
    newStatus: 'approved' | 'rejected',
    leaveType: string,
  ) => {
    setActioningId(id);
    const { error: upErr } = await supabase
      .from('leave_requests')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('company_id', user.company_id);

    if (upErr) {
      setError('Action failed: ' + upErr.message);
      setActioningId(null);
      return;
    }

    // Notify employee
    await supabase.from('notifications').insert({
      company_id: user.company_id,
      user_id: employeeId,
      title: `Leave ${newStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
      message: `Your ${leaveType} leave request has been ${newStatus} by administration.`,
      type: newStatus === 'approved' ? 'success' : 'error',
    });

    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    setSuccess(`Leave request ${newStatus}.`);
    setTimeout(() => setSuccess(null), 3000);
    setActioningId(null);
  };

  const filtered = requests.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.employee?.full_name?.toLowerCase().includes(q) ||
      r.employee?.email?.toLowerCase().includes(q) ||
      r.type.includes(q);
    return matchStatus && matchSearch;
  });

  const statusFilters: StatusFilter[] = ['all', 'pending', 'manager_approved', 'hr_approved', 'approved', 'rejected'];

  return (
    <PageWrapper pageTitle="Leave Management">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">View and manage all employee leave requests across the organisation</p>
        </div>
      </div>

      {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>⚠ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ {success}</div>}

      {/* Filter tabs */}
      <div className="tab-nav" style={{ marginBottom: 20 }}>
        {statusFilters.map(s => {
          const count = s === 'all' ? requests.length : requests.filter(r => r.status === s).length;
          return (
            <button
              key={s}
              className={`tab-item ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s] ?? s}
              {count > 0 && (
                <span
                  className={`badge ${s === 'all' ? 'badge-blue' : STATUS_BADGE[s] ?? 'badge-gray'}`}
                  style={{ marginLeft: 6 }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '12px 16px' }}>
          <div className="search-input-wrap">
            <Search size={15} />
            <input
              className="form-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Calendar size={32} /></div>
          <div className="empty-state-title">No leave requests found</div>
          <div className="empty-state-text">No requests match your current filter or search.</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Leave Requests</div>
            <span className="badge badge-blue">{filtered.length} shown</span>
          </div>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'rgba(99,102,241,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--accent)', flexShrink: 0
                        }}>
                          <User size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.employee?.full_name ?? '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.employee?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{getDeptName(r.employee?.department_id)}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: 13 }}>{r.type}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} style={{ color: 'var(--text-secondary)' }} />
                        {new Date(r.start_date).toLocaleDateString()} – {new Date(r.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                        <Clock size={12} style={{ color: 'var(--text-secondary)' }} />
                        {r.days_count}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-gray'}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      {r.reason ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <Info size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{r.reason}</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      {(r.status === 'pending' || r.status === 'manager_approved' || r.status === 'hr_approved') ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-success btn-sm"
                            disabled={actioningId === r.id}
                            title="Approve"
                            onClick={() => handleAction(r.id, r.employee.id, 'approved', r.type)}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actioningId === r.id}
                            title="Reject"
                            onClick={() => handleAction(r.id, r.employee.id, 'rejected', r.type)}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
