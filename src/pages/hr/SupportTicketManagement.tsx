import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { SupportTicket, UserProfile } from '../../lib/types';
import { Ticket, CheckCircle, Clock, Info, User, MessageSquare, AlertCircle } from 'lucide-react';

type TicketWithReporter = SupportTicket & {
  reporter: Pick<UserProfile, 'id' | 'full_name' | 'email' | 'department_id'>;
};

export const SupportTicketManagement: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithReporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'in_progress' | 'resolved' | 'all'>('open');
  const [resolutionMap, setResolutionMap] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from('support_tickets')
      .select('*, reporter:users!reporter_id(id, full_name, email, department_id)')
      .order('created_at', { ascending: false });

    if (qErr) {
      setError('Failed to load tickets: ' + qErr.message);
    } else {
      setTickets((data ?? []) as TicketWithReporter[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleAction = async (id: string, reporterId: string, newStatus: string, title: string) => {
    setActioningId(id);
    const resolution = resolutionMap[id] ?? '';

    const { error: upErr } = await supabase
      .from('support_tickets')
      .update({ 
        status: newStatus as any, 
        resolution: resolution || null,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
        assigned_to: user?.id
      })
      .eq('id', id);

    if (upErr) {
      setError('Action failed: ' + upErr.message);
      setActioningId(null);
      return;
    }

    // Notify the employee
    await supabase.from('notifications').insert({
      user_id: reporterId,
      title: `Ticket ${newStatus === 'resolved' ? 'Resolved ✅' : 'Updated ℹ️'}`,
      message: `Your ticket "${title}" is now ${newStatus.replace('_', ' ')}.${resolution ? ` Resolution: "${resolution}"` : ''}`,
      type: newStatus === 'resolved' ? 'success' : 'info',
    });

    setTickets(prev =>
      prev.map(t => t.id === id ? { ...t, status: newStatus as any, resolution: resolution || null } : t)
    );
    setResolutionMap(prev => { const n = { ...prev }; delete n[id]; return n; });
    setSuccess(`Ticket ${newStatus.replace('_', ' ')}.`);
    setTimeout(() => setSuccess(null), 3000);
    setActioningId(null);
  };

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'badge-blue',
      in_progress: 'badge-orange',
      resolved: 'badge-green',
      closed: 'badge-gray',
    };
    return map[status] ?? 'badge-gray';
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-orange', urgent: 'badge-red' };
    return map[p] ?? 'badge-gray';
  };

  return (
    <PageWrapper pageTitle="Support Management">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">Manage and resolve internal employee support requests</p>
        </div>
        <div className="tab-nav" style={{ marginBottom: 0 }}>
          {['open', 'in_progress', 'resolved', 'all'].map(f => (
            <button
              key={f}
              className={`tab-item ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f as any)}
            >
              {f.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ {success}</div>}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Ticket size={32} /></div>
          <div className="empty-state-title">No tickets found</div>
          <div className="empty-state-text">There are no tickets matching the current filter.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(t => (
            <div key={t.id} className="card">
              <div className="card-body">
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
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t.title}</h3>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span className={`badge ${priorityBadge(t.priority)}`}>{t.priority}</span>
                        <span className={`badge ${statusBadge(t.status)}`}>{t.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      By: {t.reporter?.full_name} ({t.reporter?.email}) · {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius)', fontSize: 13, borderLeft: '3px solid var(--border)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)' }}>
                    <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{t.description}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    CATEGORY: {t.category.toUpperCase()}
                  </div>
                </div>

                {t.status !== 'resolved' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <MessageSquare size={12} /> Resolution Note
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: 13 }}
                        placeholder="Add a resolution or update..."
                        value={resolutionMap[t.id] ?? ''}
                        onChange={e => setResolutionMap(prev => ({ ...prev, [t.id]: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {t.status === 'open' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleAction(t.id, t.reporter_id, 'in_progress', t.title)}>
                          Start Progress
                        </button>
                      )}
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(t.id, t.reporter_id, 'resolved', t.title)}>
                        <CheckCircle size={15} /> Resolve
                      </button>
                    </div>
                  </div>
                )}
                
                {t.resolution && (
                  <div style={{ fontSize: 13, marginTop: 12, padding: 8, background: 'rgba(16,185,129,0.05)', borderRadius: 8, border: '1px dashed var(--success)' }}>
                    <strong>Resolution:</strong> {t.resolution}
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
