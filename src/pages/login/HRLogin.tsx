import React from 'react';
import { RoleLoginPage } from '../RoleLoginPage';

export const HRLogin: React.FC = () => (
  <RoleLoginPage
    portalRole="hr"
    title="HR Portal"
    showSignup={false}
  />
);
