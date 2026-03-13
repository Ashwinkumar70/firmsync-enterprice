import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { LeaveRequest } from '../../lib/types';
import { format } from 'date-fns';
import { Plus, X, Calendar } from 'lucide-react';

const schema = z.object({
  type: z.enum(['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
}).refine(d => new Date(d.end_date) >= new Date(d.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
});

type FormData = z.infer<typeof schema>;

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

export const LeaveRequests: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchLeaves = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false });
    setLeaves((data ?? []) as LeaveRequest[]);
    setLoading(false);
  };

  useEffect(() => { fetchLeaves(); }, [user]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Create workflow
      const { data: wf } = await supabase.from('workflows').insert({
        type: 'leave',
        title: `Leave Request – ${data.type}`,
        status: 'created',
        created_by: user.id,
        department_id: user.department_id,
        priority: 'medium',
      }).select().single();

      // Create leave request
      const { error: leaveError } = await supabase.from('leave_requests').insert({
        employee_id: user.id,
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason ?? null,
        status: 'pending',
        workflow_id: wf?.id,
      });

      if (leaveError) throw leaveError;

      // Add notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Leave Request Submitted',
        message: `Your ${data.type} leave request has been submitted and is under review.`,
        type: 'info',
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      reset();
      setShowForm(false);
      fetchLeaves();
    } catch (error: any) {
      console.error('Submission error:', error);
      alert('Failed to submit leave request: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper pageTitle="Leave Requests">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-subtitle">Submit and track your leave applications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={16} />Cancel</> : <><Plus size={16} />New Request</>}
        </button>
      </div>

      {success && <div className="alert alert-success">✓ Leave request submitted successfully! Your manager will review it shortly.</div>}

      {!user?.department_id && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          ⚠ <strong>No department assigned.</strong> You are not currently assigned to a department, so your manager may not be able to see your leave requests. Please ask your admin to assign you to the correct department.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title"><Calendar size={18} style={{ display: 'inline', marginRight: 8 }} />Submit Leave Request</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Leave Type <span className="required">*</span></label>
                  <select {...register('type')} className={`form-input ${errors.type ? 'error' : ''}`}>
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="paternity">Paternity Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.type && <div className="form-error">{errors.type.message}</div>}
                </div>
                <div />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date <span className="required">*</span></label>
                  <input {...register('start_date')} type="date" className={`form-input ${errors.start_date ? 'error' : ''}`} min={format(new Date(), 'yyyy-MM-dd')} />
                  {errors.start_date && <div className="form-error">{errors.start_date.message}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">End Date <span className="required">*</span></label>
                  <input {...register('end_date')} type="date" className={`form-input ${errors.end_date ? 'error' : ''}`} min={format(new Date(), 'yyyy-MM-dd')} />
                  {errors.end_date && <div className="form-error">{errors.end_date.message}</div>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea {...register('reason')} className="form-input" rows={3} placeholder="Briefly describe the reason for your leave..." />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><div className="spinner" style={{ width: 16, height: 16 }} />Submitting...</> : 'Submit Request'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">My Leave History</div>
          <span className="badge badge-blue">{leaves.length} total</span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : leaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Calendar size={28} /></div>
            <div className="empty-state-title">No leave requests</div>
            <div className="empty-state-text">Click "New Request" to submit your first leave application</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr><th>Type</th><th>Start Date</th><th>End Date</th><th>Days</th><th>Status</th><th>Manager Comment</th></tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l.type}</td>
                    <td>{new Date(l.start_date).toLocaleDateString()}</td>
                    <td>{new Date(l.end_date).toLocaleDateString()}</td>
                    <td>{l.days_count}</td>
                    <td><span className={`badge ${STATUS_BADGE[l.status] ?? 'badge-gray'}`}>{STATUS_LABEL[l.status] ?? l.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.manager_comment ?? '–'}</td>
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
