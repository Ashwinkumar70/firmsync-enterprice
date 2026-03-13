import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Achievement } from '../../lib/types';
import { Award, Calendar, ShieldCheck } from 'lucide-react';

export const Achievements: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('awarded_at', { ascending: false });

    if (!error) setAchievements((data ?? []) as Achievement[]);
    setLoading(false);
  };

  useEffect(() => { fetchAchievements(); }, [user]);

  return (
    <PageWrapper pageTitle="Achievements">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Achievements & Badges</h1>
        <p className="page-subtitle">Your earned milestones and recognition for excellence</p>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : achievements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Award size={32} /></div>
          <div className="empty-state-title">No achievements earned yet</div>
          <div className="empty-state-text">Keep up the great work to earn badges for your contributions!</div>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: 20 }}>
          {achievements.map(a => (
            <div key={a.id} className="card" style={{ height: '100%' }}>
              <div className="card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ 
                  width: 72, height: 72, borderRadius: 20, 
                  background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', margin: '0 auto 20px',
                  boxShadow: '0 8px 24px rgba(234, 179, 8, 0.25)',
                  fontSize: 28, position: 'relative'
                }}>
                  {a.badge_icon || '🏅'}
                  <div style={{ 
                    position: 'absolute', top: -4, right: -4, 
                    background: 'white', borderRadius: '50%', padding: 3, 
                    color: '#EAB308', display: 'flex' 
                  }}>
                    <ShieldCheck size={14} fill="#EAB308" color="white" />
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                  {a.badge_name}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                  {a.badge_description}
                </p>
                
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  gap: 8, fontSize: 11, color: 'var(--text-muted)',
                  paddingTop: 16, borderTop: '1px solid var(--border)' 
                }}>
                  <Calendar size={13} />
                  Awarded on {new Date(a.awarded_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};
