import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { PurchaseRequest } from '../../lib/types';
import { Plus, X, ShoppingCart } from 'lucide-react';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  amount: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: 'Enter a valid amount' }),
  vendor: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
});

type FormData = z.infer<typeof schema>;

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red',
  purchased: 'badge-blue', cancelled: 'badge-gray',
};

export const PurchaseRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'general' },
  });

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase.from('purchase_requests').select('*').eq('requester_id', user.id).order('created_at', { ascending: false });
    setRequests((data ?? []) as PurchaseRequest[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    const { data: wf, error: wfErr } = await supabase.from('workflows').insert({
      company_id: user.company_id,
      type: 'purchase', title: data.title, status: 'created',
      created_by: user.id, department_id: user.department_id, priority: 'medium',
    }).select().single();

    if (wfErr) {
      alert('Failed to create workflow: ' + wfErr.message);
      return;
    }

    const { error: prErr } = await supabase.from('purchase_requests').insert({
      company_id: user.company_id,
      requester_id: user.id, title: data.title, description: data.description ?? null,
      amount: parseFloat(data.amount), vendor: data.vendor ?? null,
      category: data.category, status: 'pending', workflow_id: wf?.id,
    });

    if (prErr) {
      alert('Failed to submit purchase request: ' + prErr.message);
      return;
    }
    setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    reset(); setShowForm(false); fetch();
  };

  return (
    <PageWrapper pageTitle="Purchase Requests">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Purchase Requests</h1>
          <p className="page-subtitle">Request procurement of items or services</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={16} />Cancel</> : <><Plus size={16} />New Request</>}
        </button>
      </div>

      {success && <div className="alert alert-success">✓ Purchase request submitted!</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">New Purchase Request</div></div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Item / Service <span className="required">*</span></label>
                  <input {...register('title')} className={`form-input ${errors.title ? 'error' : ''}`} placeholder="What do you need?" />
                  {errors.title && <div className="form-error">{errors.title.message}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (USD) <span className="required">*</span></label>
                  <input {...register('amount')} className={`form-input ${errors.amount ? 'error' : ''}`} placeholder="0.00" type="number" step="0.01" />
                  {errors.amount && <div className="form-error">{errors.amount.message}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vendor</label>
                  <input {...register('vendor')} className="form-input" placeholder="Vendor name (optional)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select {...register('category')} className="form-input">
                    {['general','office supplies','software','hardware','travel','training','other'].map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Justification</label>
                <textarea {...register('description')} className="form-input" rows={2} placeholder="Why is this needed?" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">Purchase History</div></div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ShoppingCart size={28} /></div>
            <div className="empty-state-title">No purchase requests</div>
            <div className="empty-state-text">Submit a request to procure items or services</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>Item</th><th>Category</th><th>Amount</th><th>Vendor</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.title}</td>
                    <td style={{ textTransform: 'capitalize' }}>{r.category}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${r.amount.toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.vendor ?? '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
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
