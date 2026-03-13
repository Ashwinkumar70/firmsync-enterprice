import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { SupportTicket } from '../../lib/types';
import { Ticket, Clock, Filter } from 'lucide-react';

type TicketWithReporter = SupportTicket & { reporter: { full_name: string; email: string } };

export const SupportTickets: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithReporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, reporter:users!reporter_id(full_name, email, department_id)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTickets(data as TicketWithReporter[]);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return 'badge-blue';
      case 'in_progress': return 'badge-yellow';
      case 'resolved': return 'badge-green';
      case 'closed': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  return (
    <PageWrapper pageTitle="Support Tickets">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Team Support Tickets</h1>
          <p className="page-subtitle">Monitoring and assisting with your team's support requests</p>
        </div>
        <div className="filter-bar" style={{ margin: 0 }}>
          <Filter size={16} />
          {['open', 'in_progress', 'resolved', 'all'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Ticket size={32} /></div>
          <div className="empty-state-title">No tickets found</div>
          <div className="empty-state-text">Your team has no {filter} tickets at this time.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title</th>
                <th>Reporter</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)' }}>#{t.id.slice(0, 8)}</td>
                  <td style={{ fontWeight: 600 }}>{t.title}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                        {t.reporter?.full_name?.charAt(0) || t.reporter?.email?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13 }}>{t.reporter?.full_name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${t.priority === 'urgent' ? 'badge-red' : t.priority === 'high' ? 'badge-orange' : 'badge-gray'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(t.status)}`}>{t.status.replace('_', ' ')}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
};
