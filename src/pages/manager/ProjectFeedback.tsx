import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Workflow } from '../../lib/types';
import { FolderOpen, MessageSquare, Link as LinkIcon, User } from 'lucide-react';

type ProjectWorkflow = Workflow & { creator?: { full_name?: string } };

export const ProjectFeedback: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('workflows')
        .select('*, creator:users!created_by(full_name)')
        .eq('department_id', user.department_id)
        .eq('type', 'project_submission')
        .order('created_at', { ascending: false });

      if (data) setProjects(data as ProjectWorkflow[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <PageWrapper pageTitle="Project Feedback">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Project Feedback</h1>
        <p className="page-subtitle">Review team project submissions and provide guidance</p>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={32} /></div>
          <div className="empty-state-title">No projects submitted</div>
          <div className="empty-state-text">Your team hasn't submitted any projects for review yet.</div>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map(p => (
            <div key={p.id} className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <FolderOpen size={18} className="text-secondary" />
                    <span className="card-title">{p.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <User size={12} /> {p.creator?.full_name || 'Anonymous'} · {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={`badge ${p.status === 'completed' ? 'badge-purple' : p.status === 'approved' ? 'badge-green' : 'badge-yellow'}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                  {p.description || 'No description provided.'}
                </p>
                
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    <MessageSquare size={14} /> Give Feedback
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    <LinkIcon size={14} /> Open Workflow
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};
