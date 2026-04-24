import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { UserProfile } from '../../lib/types';
import { Users, Mail, Phone, Shield, Search } from 'lucide-react';

export const TeamMembers: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchTeam = async () => {
      if (!user) return;
      if (!user.department_id) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('department_id', user.department_id)
        .order('full_name', { ascending: true });

      if (!error) setMembers(data as UserProfile[]);
      setLoading(false);
    };
    fetchTeam();
  }, [user]);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.full_name?.toLowerCase().includes(search.toLowerCase()) || 
                         m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <PageWrapper pageTitle="Team Members">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Team Members</h1>
          <p className="page-subtitle">Manage and communicate with your department's staff</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="form-input" 
              placeholder="Search members..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: 240 }}
            />
          </div>
          <select 
            className="form-input" 
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="all">All Roles</option>
            <option value="employee">Employees</option>
            <option value="manager">Managers</option>
            <option value="hr">HR</option>
          </select>
        </div>
      </div>

      {!user?.department_id && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          ⚠ <strong>No department assigned.</strong> You are not currently assigned to a department. 
          Please ask your admin to assign you to a department to see your team members.
        </div>
      )}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : filteredMembers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={32} /></div>
          <div className="empty-state-title">No members found</div>
          <div className="empty-state-text">Try adjusting your filters or search query.</div>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: 20 }}>
          {filteredMembers.map(m => (
            <div key={m.id} className="card" style={{ transition: 'all 0.2s' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ 
                    width: 52, height: 52, borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--accent) 0%, #8B5CF6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 20
                  }}>
                    {m.full_name?.charAt(0) || m.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{m.full_name || 'Anonymous User'}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      <Shield size={12} className="text-accent" />
                      <span style={{ textTransform: 'capitalize' }}>{m.role}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Mail size={14} style={{ opacity: 0.7 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Phone size={14} style={{ opacity: 0.7 }} />
                    <span>+1 (555) 000-0000</span>
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span className={`badge ${m.is_active ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>View Stats</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};
