import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../lib/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * The canonical home for each role.
 * These are the exact URLs users land on after login / when denied access.
 */
export const ROLE_HOME: Record<UserRole, string> = {
  admin:    '/admin/dashboard',
  manager:  '/manager/dashboard',
  hr:       '/hr/dashboard',
  employee: '/employee/dashboard',
};

const FullPageSpinner = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
    <div className="spinner dark" style={{ width: 36, height: 36 }} />
  </div>
);

/**
 * Helper to determine the best login page based on the requested URL.
 */
const getLoginRedirect = (path: string): string => {
  if (path.startsWith('/manager')) return '/login/manager';
  if (path.startsWith('/admin'))   return '/login/admin';
  if (path.startsWith('/hr'))      return '/login/hr';
  if (path.startsWith('/employee')) return '/login/employee';
  return '/login'; // Fallback to selector
};

/**
 * ProtectedRoute – wraps role-specific route groups.
 *
 * Behaviour:
 *  - No session            → redirect to specific login (preserving intended destination)
 *  - Session but no role   → redirect to login (profile fetch failed — safe fallback)
 *  - Wrong role            → redirect to the user's own dashboard (cross-portal guard)
 *  - Correct role          → render children via <Outlet />
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { session, user, loading } = useAuth();
  const location = useLocation();

  // Only show full page spinner if we don't have a user yet
  if (loading && !user) return <FullPageSpinner />;

  // Not authenticated
  if (!session) {
    const loginPath = getLoginRedirect(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Session exists but profile/role could not be loaded (e.g., missing users row)
  if (!user || !user.role) {
    console.warn('[ProtectedRoute] Authenticated session but no user profile/role found. Redirecting to login.');
    return <Navigate to="/login" state={{ error: 'profile_missing' }} replace />;
  }

  // Authenticated but wrong role — cross-portal access attempt
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = ROLE_HOME[user.role];
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
};


/**
 * RoleRedirect – placed at "/" to send authenticated users to their portal.
 * Unauthenticated users are sent to /login.
 */
export const RoleRedirect: React.FC = () => {
  const { session, user, loading } = useAuth();

  // Only block if we have no user and are loading
  if (loading && !user) return <FullPageSpinner />;

  if (!session) return <Navigate to={getLoginRedirect('/')} replace />;

  // Profile not yet available — wait on next render
  if (!user || !user.role) return <Navigate to="/login" replace />;

  return <Navigate to={ROLE_HOME[user.role]} replace />;
};

