import React from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Wrench } from 'lucide-react';

interface StubPageProps {
  title: string;
  subtitle?: string;
}

export const StubPage: React.FC<StubPageProps> = ({ title, subtitle }) => (
  <PageWrapper pageTitle={title}>
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    <div className="card">
      <div className="empty-state" style={{ padding: '64px 24px' }}>
        <div className="empty-state-icon" style={{ width: 72, height: 72 }}>
          <Wrench size={32} />
        </div>
        <div className="empty-state-title">Coming Soon</div>
        <div className="empty-state-text">
          This page is fully scaffolded and ready for implementation.<br />
          The database schema, RLS policies, and routing are all in place.
        </div>
      </div>
    </div>
  </PageWrapper>
);
