import React from 'react';
import { RoleLoginPage } from '../RoleLoginPage';

export const ManagerLogin: React.FC = () => (
  <RoleLoginPage
    portalRole="manager"
    title="Manager Portal"
    showSignup={false}
  />
);
