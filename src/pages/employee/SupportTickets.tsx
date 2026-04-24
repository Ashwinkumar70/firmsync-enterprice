import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { SupportTicket } from '../../lib/types';
import { Plus, X, Ticket } from 'lucide-react';

const schema = z.object({
  title: z.string().min(5, 'Title is too short'),
  description: z.string().min(10, 'Please provide more details'),
  category: z.enum(['general', 'it', 'hr', 'facilities', 'payroll', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

type FormData = z.infer<typeof schema>;

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-blue',
  in_progress: 'badge-yellow',
  resolved: 'badge-green',
  closed: 'badge-gray',
};

const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge-gray',
  medium: 'badge-blue',
  high: 'badge-orange',
  urgent: 'badge-red',
};

export const SupportTickets: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', category: 'general' },
  });

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase.from('support_tickets').select('*').eq('reporter_id', user.id).order('created_at', { ascending: false });
    setTickets((data ?? []) as SupportTicket[]);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [user]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    const { error: ticketErr } = await supabase.from('support_tickets').insert({
      company_id: user.company_id,
      reporter_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'open',
    });

    if (ticketErr) {
      alert('Failed to submit ticket: ' + ticketErr.message);
      return;
    }

    await supabase.from('notifications').insert({
      company_id: user.company_id,
      user_id: user.id,
      title: 'Support Ticket Created',
      message: `Your ticket "${data.title}" has been submitted.`,
      type: 'info',
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    reset();
    setShowForm(false);
    fetchTickets();
  };

  return (
    <PageWrapper pageTitle="Support Tickets">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">Report issues and track their resolution</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={16} />Cancel</> : <><Plus size={16} />New Ticket</>}
        </button>
      </div>

      {success && <div className="alert alert-success">✓ Ticket submitted successfully!</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">Create Support Ticket</div></div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Title <span className="required">*</span></label>
                <input {...register('title')} className={`form-input ${errors.title ? 'error' : ''}`} placeholder="Brief summary of the issue" />
                {errors.title && <div className="form-error">{errors.title.message}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select {...register('category')} className="form-input">
                    {['general','it','hr','facilities','payroll','other'].map(c => (
                      <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select {...register('priority')} className="form-input">
                    {['low','medium','high','urgent'].map(p => (
                      <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description <span className="required">*</span></label>
                <textarea {...register('description')} className={`form-input ${errors.description ? 'error' : ''}`} rows={4} placeholder="Describe the issue in detail..." />
                {errors.description && <div className="form-error">{errors.description.message}</div>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">My Tickets</div>
          <span className="badge badge-blue">{tickets.length} total</span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Ticket size={28} /></div>
            <div className="empty-state-title">No tickets yet</div>
            <div className="empty-state-text">Submit a ticket if you're experiencing any issues</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td style={{ textTransform: 'capitalize' }}>{t.category}</td>
                    <td><span className={`badge ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span></td>
                    <td><span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
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
