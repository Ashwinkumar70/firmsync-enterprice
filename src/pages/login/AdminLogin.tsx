import React from 'react';
import { RoleLoginPage } from '../RoleLoginPage';

export const AdminLogin: React.FC = () => (
  <RoleLoginPage
    portalRole="admin"
    title="Admin Portal"
    showSignup={false}
  />
);
