import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface PageWrapperProps {
  pageTitle: string;
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ pageTitle, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="app-main">
        <Topbar pageTitle={pageTitle} onMobileMenu={() => setMobileOpen(!mobileOpen)} />
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
};
