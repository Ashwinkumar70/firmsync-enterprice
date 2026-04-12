import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { PurchaseRequest, UserProfile } from '../../lib/types';
import { ShoppingCart, CheckCircle, XCircle, Info, User, MessageSquare, DollarSign } from 'lucide-react';

type RequestWithUser = PurchaseRequest & {
  requester: Pick<UserProfile, 'id' | 'full_name' | 'email' | 'department_id'>;
};

export const PurchaseRequestManagement: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from('purchase_requests')
      .select('*, requester:users!requester_id(id, full_name, email, department_id)')
      .order('created_at', { ascending: false });

    if (qErr) {
      setError('Failed to load purchase requests: ' + qErr.message);
    } else {
      setRequests((data ?? []) as RequestWithUser[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const handleAction = async (id: string, requesterId: string, newStatus: string, title: string) => {
    setActioningId(id);
    const comment = commentMap[id] ?? '';

    const { error: upErr } = await supabase
      .from('purchase_requests')
      .update({ 
        status: newStatus as any, 
        approved_by: user?.id,
        approval_date: new Date().toISOString()
      })
      .eq('id', id);

    if (upErr) {
      setError('Action failed: ' + upErr.message);
      setActioningId(null);
      return;
    }

    // Notify the employee
    await supabase.from('notifications').insert({
      user_id: requesterId,
      title: `Purchase ${newStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
      message: `Your purchase request for "${title}" has been ${newStatus}.${comment ? ` Note: "${comment}"` : ''}`,
      type: newStatus === 'approved' ? 'success' : 'error',
    });

    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: newStatus as any } : r)
    );
    setCommentMap(prev => { const n = { ...prev }; delete n[id]; return n; });
    setActioningId(null);
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <PageWrapper pageTitle="Purchase Requests">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Purchase Approvals</h1>
          <p className="page-subtitle">Review and manage equipment or expense purchase requests</p>
        </div>
        <div className="tab-nav" style={{ marginBottom: 0 }}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              className={`tab-item ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f as any)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingCart size={32} /></div>
          <div className="empty-state-title">No requests found</div>
          <div className="empty-state-text">No purchase requests matching the current filter.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(r => (
            <div key={r.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(59,130,246,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', flexShrink: 0
                  }}>
                    <DollarSign size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>{r.title}</h3>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                         <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{r.currency} {r.amount.toLocaleString()}</span>
                         <span className={`badge ${r.status === 'pending' ? 'badge-yellow' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                            {r.status}
                         </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      By: {r.requester?.full_name} · {r.category} · {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {r.description && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius)', fontSize: 13, borderLeft: '3px solid var(--border)', marginBottom: 16, color: 'var(--text-secondary)' }}>
                    {r.description}
                  </div>
                )}

                {r.status === 'pending' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <MessageSquare size={12} /> Approval Note
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: 13 }}
                        placeholder="Add a comment or reason..."
                        value={commentMap[r.id] ?? ''}
                        onChange={e => setCommentMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(r.id, r.requester_id, 'approved', r.title)}>
                        <CheckCircle size={15} /> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(r.id, r.requester_id, 'rejected', r.title)}>
                        <XCircle size={15} /> Reject
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
