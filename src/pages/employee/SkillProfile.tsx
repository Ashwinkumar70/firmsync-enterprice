import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { EmployeeSkill, Achievement, CareerGoal } from '../../lib/types';
import { Plus, X, CheckCircle, Star } from 'lucide-react';

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

export const SkillProfile: React.FC = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<EmployeeSkill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [tab, setTab] = useState<'skills' | 'goals' | 'achievements'>('skills');
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newSkill, setNewSkill] = useState({ skill_name: '', category: 'technical', level: 'beginner' });

  const fetchAll = async () => {
    if (!user) return;
    const [s, a, g] = await Promise.all([
      supabase.from('employee_skills').select('*').eq('user_id', user.id),
      supabase.from('achievements').select('*').eq('user_id', user.id).order('awarded_at', { ascending: false }),
      supabase.from('career_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setSkills((s.data ?? []) as EmployeeSkill[]);
    setAchievements((a.data ?? []) as Achievement[]);
    setGoals((g.data ?? []) as CareerGoal[]);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const addSkill = async () => {
    if (!user || !newSkill.skill_name.trim()) return;
    await supabase.from('employee_skills').upsert({
      user_id: user.id,
      skill_name: newSkill.skill_name,
      category: newSkill.category,
      level: newSkill.level,
    });
    setNewSkill({ skill_name: '', category: 'technical', level: 'beginner' });
    setShowSkillForm(false);
    fetchAll();
  };

  const addGoal = async () => {
    if (!user) return;
    const title = prompt('Enter your career goal:');
    if (!title?.trim()) return;
    await supabase.from('career_goals').insert({ user_id: user.id, title, status: 'in_progress', progress: 0 });
    fetchAll();
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    await supabase.from('career_goals').update({ progress, status: progress === 100 ? 'completed' : 'in_progress' }).eq('id', goalId);
    fetchAll();
  };

  const LEVEL_CLASS: Record<string, string> = { beginner: 'skill-beginner', intermediate: 'skill-intermediate', advanced: 'skill-advanced', expert: 'skill-expert' };

  return (
    <PageWrapper pageTitle="Skill Profile">
      <div className="page-header">
        <h1 className="page-title">Skill Profile & Growth</h1>
        <p className="page-subtitle">Track your skills, career goals, and achievements</p>
      </div>

      <div className="tab-nav">
        {(['skills', 'goals', 'achievements'] as const).map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'achievements' && achievements.length > 0 && (
              <span className="badge badge-yellow" style={{ marginLeft: 8, fontSize: 10 }}>{achievements.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'skills' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowSkillForm(!showSkillForm)}>
              {showSkillForm ? <><X size={14} />Cancel</> : <><Plus size={14} />Add Skill</>}
            </button>
          </div>
          {showSkillForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Skill Name</label>
                    <input className="form-input" placeholder="e.g. React, Python..." value={newSkill.skill_name} onChange={e => setNewSkill(s => ({ ...s, skill_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={newSkill.category} onChange={e => setNewSkill(s => ({ ...s, category: e.target.value }))}>
                      {['technical','soft','domain','language','certification'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <select className="form-input" value={newSkill.level} onChange={e => setNewSkill(s => ({ ...s, level: e.target.value }))}>
                      {LEVEL_ORDER.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={addSkill}>Add Skill</button>
              </div>
            </div>
          )}
          {skills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Star size={28} /></div>
              <div className="empty-state-title">No skills added</div>
              <div className="empty-state-text">Add your skills to build your professional profile</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {skills.map(s => (
                <div key={s.id} className={`skill-badge ${LEVEL_CLASS[s.level] ?? 'skill-beginner'}`}>
                  {s.verified && <CheckCircle size={12} />}
                  {s.skill_name}
                  <span style={{ opacity: 0.6, fontSize: 10, marginLeft: 4 }}>({s.level})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={addGoal}><Plus size={14} />Add Goal</button>
          </div>
          {goals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No career goals yet</div>
              <div className="empty-state-text">Set goals to track your professional development</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {goals.map(g => (
                <div key={g.id} className="card">
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{g.title}</div>
                      <div className="progress-bar-wrap" style={{ marginBottom: 4 }}>
                        <div className="progress-bar" style={{ width: `${g.progress}%`, background: g.progress === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--accent), #8B5CF6)' }} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{g.progress}% complete</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[25, 50, 75, 100].map(p => (
                        <button key={p} className={`btn btn-sm ${g.progress >= p ? 'btn-success' : 'btn-secondary'}`} onClick={() => updateGoalProgress(g.id, p)}>
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'achievements' && (
        <div>
          {achievements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No achievements yet</div>
              <div className="empty-state-text">Keep up great work to earn badges from your managers!</div>
            </div>
          ) : (
            <div className="grid-3">
              {achievements.map(a => (
                <div key={a.id} className="achievement-card">
                  <div className="achievement-icon">{a.badge_icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{a.badge_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.badge_description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(a.awarded_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
};
