import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { CareerGoal } from '../../lib/types';
import { Plus, Target, CheckCircle, Clock } from 'lucide-react';

export const CareerGoals: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('career_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setGoals((data ?? []) as CareerGoal[]);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, [user]);

  const addGoal = async () => {
    if (!user) return;
    const title = prompt('Enter your new career goal:');
    if (!title?.trim()) return;
    
    const { error } = await supabase.from('career_goals').insert({ 
      user_id: user.id, 
      title, 
      status: 'in_progress', 
      progress: 0 
    });
    
    if (!error) fetchGoals();
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    const { error } = await supabase
      .from('career_goals')
      .update({ 
        progress, 
        status: progress === 100 ? 'completed' : 'in_progress' 
      })
      .eq('id', goalId);
      
    if (!error) fetchGoals();
  };

  return (
    <PageWrapper pageTitle="Career Goals">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Career Goals</h1>
          <p className="page-subtitle">Set and track your professional milestones</p>
        </div>
        <button className="btn btn-primary" onClick={addGoal}>
          <Plus size={18} /> New Goal
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={32} /></div>
          <div className="empty-state-title">No goals set yet</div>
          <div className="empty-state-text">Start your growth journey by adding your first career goal.</div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={addGoal}>Add First Goal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {goals.map(g => (
            <div key={g.id} className="card" style={{ transition: 'all 0.2s' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 14, 
                  background: g.progress === 100 ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: g.progress === 100 ? 'var(--success)' : 'var(--accent)',
                  flexShrink: 0
                }}>
                  {g.progress === 100 ? <CheckCircle size={24} /> : <Target size={24} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{g.title}</h3>
                    <span className={`badge ${g.progress === 100 ? 'badge-green' : 'badge-blue'}`}>
                      {g.progress === 100 ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  
                  <div className="progress-bar-wrap" style={{ height: 8, background: '#F1F5F9', marginBottom: 6 }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${g.progress}%`, 
                        background: g.progress === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--accent), #818CF8)',
                        height: '100%' 
                      }} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>{g.progress}% Complete</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> Created {new Date(g.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {[25, 50, 75, 100].map(p => (
                    <button 
                      key={p} 
                      className={`btn btn-sm ${g.progress >= p ? 'btn-success' : 'btn-secondary'}`}
                      style={{ minWidth: 48, fontSize: 11, padding: '6px 0' }}
                      onClick={() => updateGoalProgress(g.id, p)}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};
