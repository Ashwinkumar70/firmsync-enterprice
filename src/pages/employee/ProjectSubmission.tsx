import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Project, ProjectUpdate } from '../../lib/types';
import { Plus, Upload, FolderOpen, X, Paperclip } from 'lucide-react';

const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
});

const updateSchema = z.object({
  content: z.string().min(5, 'Update content is required'),
  update_type: z.enum(['progress', 'milestone', 'issue', 'submission']),
});

type ProjectForm = z.infer<typeof projectSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

const STATUS_COLOR: Record<string, string> = {
  planning: 'badge-gray',
  active: 'badge-green',
  on_hold: 'badge-yellow',
  completed: 'badge-blue',
  cancelled: 'badge-red',
};

export const ProjectSubmission: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { register: regProject, handleSubmit: hsProject, reset: resetProject, formState: { errors: errProject, isSubmitting: subProject } } = useForm<ProjectForm>({ resolver: zodResolver(projectSchema) });
  const { register: regUpdate, handleSubmit: hsUpdate, reset: resetUpdate, formState: { errors: errUpdate, isSubmitting: subUpdate } } = useForm<UpdateForm>({ resolver: zodResolver(updateSchema) });

  const fetchProjects = async () => {
    if (!user) return;
    const { data } = await supabase.from('projects').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    setProjects((data ?? []) as Project[]);
    setLoading(false);
  };

  const fetchUpdates = async (projectId: string) => {
    const { data } = await supabase.from('project_updates').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    setUpdates((data ?? []) as ProjectUpdate[]);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  useEffect(() => {
    if (selectedProject) fetchUpdates(selectedProject.id);
  }, [selectedProject]);

  const onCreateProject = async (data: ProjectForm) => {
    if (!user) return;
    await supabase.from('projects').insert({
      name: data.name,
      description: data.description ?? null,
      owner_id: user.id,
      department_id: user.department_id,
      due_date: data.due_date || null,
      status: 'active',
    });
    setSuccess('Project created!');
    setTimeout(() => setSuccess(''), 3000);
    resetProject();
    setShowNewProject(false);
    fetchProjects();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error } = await supabase.storage.from('project-files').upload(path, file);
    if (!error && uploadData) {
      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(uploadData.path);
      setUploadedFile({ url: urlData.publicUrl, name: file.name });
    }
    setUploading(false);
  };

  const onSubmitUpdate = async (data: UpdateForm) => {
    if (!user || !selectedProject) return;
    await supabase.from('project_updates').insert({
      project_id: selectedProject.id,
      author_id: user.id,
      content: data.content,
      update_type: data.update_type,
      file_url: uploadedFile?.url ?? null,
      file_name: uploadedFile?.name ?? null,
    });
    resetUpdate();
    setUploadedFile(null);
    setSuccess('Update submitted!');
    setTimeout(() => setSuccess(''), 3000);
    fetchUpdates(selectedProject.id);
  };

  return (
    <PageWrapper pageTitle="Projects">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage your projects and submit progress updates</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewProject(!showNewProject)}>
          {showNewProject ? <><X size={16} />Cancel</> : <><Plus size={16} />New Project</>}
        </button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}

      {/* New Project Form */}
      {showNewProject && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">Create New Project</div></div>
          <div className="card-body">
            <form onSubmit={hsProject(onCreateProject)}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Project Name <span className="required">*</span></label>
                  <input {...regProject('name')} className={`form-input ${errProject.name ? 'error' : ''}`} placeholder="My project name" />
                  {errProject.name && <div className="form-error">{errProject.name.message}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input {...regProject('due_date')} type="date" className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea {...regProject('description')} className="form-input" rows={2} placeholder="Brief description..." />
              </div>
              <button type="submit" className="btn btn-primary" disabled={subProject}>
                {subProject ? <><div className="spinner" style={{ width: 16, height: 16 }} />Creating...</> : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Project list */}
        <div className="card">
          <div className="card-header"><div className="card-title">My Projects</div></div>
          {loading && projects.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FolderOpen size={28} /></div>
              <div className="empty-state-title">No projects</div>
              <div className="empty-state-text">Create your first project above</div>
            </div>
          ) : (
            <div style={{ padding: '0 16px 16px' }}>
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  style={{
                    padding: '14px', margin: '6px 0', borderRadius: 'var(--radius)',
                    border: `1.5px solid ${selectedProject?.id === p.id ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: selectedProject?.id === p.id ? 'rgba(59,130,246,0.04)' : 'white',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</span>
                    <span className={`badge ${STATUS_COLOR[p.status]}`} style={{ fontSize: 11 }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.description ?? 'No description'}</div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{p.completion_percentage}%</span>
                    </div>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar" style={{ width: `${p.completion_percentage}%`, background: 'linear-gradient(90deg, var(--accent), #8B5CF6)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Updates panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">{selectedProject ? `Updates: ${selectedProject.name}` : 'Project Updates'}</div>
          </div>
          {!selectedProject ? (
            <div className="empty-state">
              <div className="empty-state-text">Select a project to view and add updates</div>
            </div>
          ) : (
            <div className="card-body">
              {/* Submit update */}
              <form onSubmit={hsUpdate(onSubmitUpdate)} style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Update Type</label>
                  <select {...regUpdate('update_type')} className="form-input">
                    <option value="progress">Progress Update</option>
                    <option value="milestone">Milestone</option>
                    <option value="issue">Issue</option>
                    <option value="submission">Final Submission</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Update <span className="required">*</span></label>
                  <textarea {...regUpdate('content')} className={`form-input ${errUpdate.content ? 'error' : ''}`} rows={3} placeholder="Describe your progress..." />
                  {errUpdate.content && <div className="form-error">{errUpdate.content.message}</div>}
                </div>
                {/* File upload */}
                <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                {uploadedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius)', marginBottom: 12, fontSize: 12 }}>
                    <Paperclip size={14} color="var(--success)" />
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>{uploadedFile.name}</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUploadedFile(null)} style={{ marginLeft: 'auto' }}><X size={12} /></button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ marginBottom: 12 }}>
                    <Upload size={14} />{uploading ? 'Uploading...' : 'Attach File'}
                  </button>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={subUpdate}>
                  {subUpdate ? 'Submitting...' : 'Submit Update'}
                </button>
              </form>

              {/* Update history */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>UPDATE HISTORY</div>
                {updates.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No updates yet</div>
                ) : (
                  <ul className="timeline">
                    {updates.map(u => (
                      <li key={u.id} className="timeline-item">
                        <div className="timeline-dot active" />
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          {u.update_type.toUpperCase()} · {new Date(u.created_at).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: 13.5 }}>{u.content}</div>
                        {u.file_name && (
                          <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>
                            <Paperclip size={12} style={{ display: 'inline', marginRight: 4 }} />
                            <a href={u.file_url!} target="_blank" rel="noreferrer">{u.file_name}</a>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
