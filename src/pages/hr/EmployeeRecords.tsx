import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { supabase } from '../../lib/supabase';
import type { UserProfile, Department, EmployeeSkill } from '../../lib/types';
import { Search, ChevronDown, ChevronUp, Wallet } from 'lucide-react';

export const EmployeeRecords: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [skills, setSkills] = useState<Record<string, EmployeeSkill[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [u, d, s] = await Promise.all([
        supabase.from('users').select('*').order('full_name'),
        supabase.from('departments').select('*'),
        supabase.from('employee_skills').select('*'),
      ]);
      setUsers((u.data ?? []) as UserProfile[]);
      setDepartments((d.data ?? []) as Department[]);

      const skillsMap: Record<string, EmployeeSkill[]> = {};
      ((s.data ?? []) as EmployeeSkill[]).forEach(sk => {
        if (!skillsMap[sk.user_id]) skillsMap[sk.user_id] = [];
        skillsMap[sk.user_id].push(sk);
      });
      setSkills(skillsMap);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_BADGE: Record<string, string> = { admin: 'badge-red', manager: 'badge-blue', hr: 'badge-purple', employee: 'badge-gray' };

  return (
    <PageWrapper pageTitle="Employee Records">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Employee Records</h1>
          <p className="page-subtitle">Full employee directory and profile details</p>
        </div>
        <div className="search-input-wrap" style={{ width: 260 }}>
          <Search size={15} />
          <input className="form-input" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Employees</div>
          <span className="badge badge-blue">{filtered.length}</span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div>
            {filtered.map(u => {
              const dept = departments.find(d => d.id === u.department_id);
              const userSkills = skills[u.id] ?? [];
              const isExpanded = expanded === u.id;
              return (
                <div key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <div
                    style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
                    onClick={() => setExpanded(isExpanded ? null : u.id)}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {(u.full_name?.[0] ?? u.email[0]).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{u.full_name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span>
                      <span className="badge badge-gray">{dept?.name ?? 'No Dept'}</span>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 24px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                      <div className="form-row" style={{ marginTop: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Employee ID</div>
                          <div style={{ fontSize: 13.5 }}>{u.employee_id_string || u.id.slice(0, 8)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Phone</div>
                          <div style={{ fontSize: 13.5 }}>{u.phone ?? 'Not provided'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Location</div>
                          <div style={{ fontSize: 13.5 }}>{u.location ?? 'Not provided'}</div>
                        </div>
                      </div>
                      {userSkills.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Skills</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {userSkills.map(sk => (
                              <span key={sk.id} className="badge badge-blue" style={{ fontSize: 11 }}>{sk.skill_name} ({sk.level})</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
