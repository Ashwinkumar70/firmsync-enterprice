import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Target, TrendingUp, Award, BookOpen, User } from 'lucide-react';

export const CareerDevelopment: React.FC = () => {
  const goals = [
    { id: '1', employee: 'Arjun Mehra', goal: 'Mastering System Architecture', progress: 65, type: 'Technical' },
    { id: '2', employee: 'Priya Sharma', goal: 'Leadership Foundations', progress: 30, type: 'Management' },
    { id: '3', employee: 'Rahul K.', goal: 'Cloud Practitioner Cert', progress: 90, type: 'Certification' },
  ];

  return (
    <PageWrapper pageTitle="Career Development">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Career Development</h1>
          <p className="page-subtitle">Track employee growth, goals, and training progress</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary">Training Catalog</button>
          <button className="btn btn-primary">Review Goals</button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card blue">
          <div className="card-body">
            <div className="kpi-icon blue"><Target size={20} /></div>
            <div className="kpi-value">24</div>
            <div className="kpi-label">Active Goals</div>
          </div>
        </div>
        <div className="card green">
          <div className="card-body">
            <div className="kpi-icon green"><TrendingUp size={20} /></div>
            <div className="kpi-value">82%</div>
            <div className="kpi-label">Avg. Progress</div>
          </div>
        </div>
        <div className="card purple">
          <div className="card-body">
            <div className="kpi-icon purple"><Award size={20} /></div>
            <div className="kpi-value">12</div>
            <div className="kpi-label">Completed Certs</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Employee Growth Tracking</div>
        </div>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><th>Employee</th><th>Career Goal</th><th>Category</th><th>Progress</th><th>Action</th></tr></thead>
            <tbody>
              {goals.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} /> {g.employee}</div></td>
                  <td style={{ fontSize: 13 }}>{g.goal}</td>
                  <td><span className="badge badge-gray">{g.type}</span></td>
                  <td>
                    <div style={{ width: 120 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, textAlign: 'right' }}>{g.progress}%</div>
                      <div style={{ height: 6, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${g.progress}%`, background: 'var(--accent)' }} />
                      </div>
                    </div>
                  </td>
                  <td><button className="btn btn-secondary btn-sm"><BookOpen size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};
