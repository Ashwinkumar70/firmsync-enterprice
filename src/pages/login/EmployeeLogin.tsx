import React from 'react';
import { RoleLoginPage } from '../RoleLoginPage';

export const EmployeeLogin: React.FC = () => (
  <RoleLoginPage
    portalRole="employee"
    title="Employee Portal"
    showSignup={true}
  />
);
