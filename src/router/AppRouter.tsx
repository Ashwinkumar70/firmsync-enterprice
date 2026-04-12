import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute, RoleRedirect } from './ProtectedRoute';

// Portal selector & login pages (Lazy loaded for smaller initial bundle)
const PortalSelector = lazy(() => import('../pages/PortalSelector').then(m => ({ default: m.PortalSelector })));
const AdminLogin    = lazy(() => import('../pages/login/AdminLogin').then(m => ({ default: m.AdminLogin })));
const ManagerLogin  = lazy(() => import('../pages/login/ManagerLogin').then(m => ({ default: m.ManagerLogin })));
const HRLogin       = lazy(() => import('../pages/login/HRLogin').then(m => ({ default: m.HRLogin })));
const EmployeeLogin = lazy(() => import('../pages/login/EmployeeLogin').then(m => ({ default: m.EmployeeLogin })));
const RegisterCompany = lazy(() => import('../pages/RegisterCompany').then(m => ({ default: m.RegisterCompany })));

// Employee pages (Lazy)
const EmployeeDashboard = lazy(() => import('../pages/employee/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const LeaveRequests     = lazy(() => import('../pages/employee/LeaveRequests').then(m => ({ default: m.LeaveRequests })));
const ProjectSubmission = lazy(() => import('../pages/employee/ProjectSubmission').then(m => ({ default: m.ProjectSubmission })));
const SupportTickets    = lazy(() => import('../pages/employee/SupportTickets').then(m => ({ default: m.SupportTickets })));
const PurchaseRequests  = lazy(() => import('../pages/employee/PurchaseRequests').then(m => ({ default: m.PurchaseRequests })));
const SkillProfile      = lazy(() => import('../pages/employee/SkillProfile').then(m => ({ default: m.SkillProfile })));
const CareerGoals       = lazy(() => import('../pages/employee/CareerGoals').then(m => ({ default: m.CareerGoals })));
const Achievements      = lazy(() => import('../pages/employee/Achievements').then(m => ({ default: m.Achievements })));
const EmployeeProfile   = lazy(() => import('../pages/employee/EmployeeProfile').then(m => ({ default: m.EmployeeProfile })));

// Manager pages (Lazy)
const ManagerDashboard = lazy(() => import('../pages/manager/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const WorkflowReview   = lazy(() => import('../pages/manager/WorkflowReview').then(m => ({ default: m.WorkflowReview })));
const TeamMembers      = lazy(() => import('../pages/manager/TeamMembers').then(m => ({ default: m.TeamMembers })));
const LeaveApprovals   = lazy(() => import('../pages/manager/LeaveApprovals').then(m => ({ default: m.LeaveApprovals })));
const ProjectFeedback  = lazy(() => import('../pages/manager/ProjectFeedback').then(m => ({ default: m.ProjectFeedback })));
const TeamAnalytics    = lazy(() => import('../pages/manager/TeamAnalytics').then(m => ({ default: m.TeamAnalytics })));
const ManagerTickets   = lazy(() => import('../pages/manager/SupportTickets').then(m => ({ default: m.SupportTickets })));

// HR pages (Lazy)
const HRDashboard       = lazy(() => import('../pages/hr/HRDashboard').then(m => ({ default: m.HRDashboard })));
const EmployeeRecords   = lazy(() => import('../pages/hr/EmployeeRecords').then(m => ({ default: m.EmployeeRecords })));
const Payroll           = lazy(() => import('../pages/hr/Payroll').then(m => ({ default: m.Payroll })));
const HRLeaveApprovals  = lazy(() => import('../pages/hr/HRLeaveApprovals').then(m => ({ default: m.HRLeaveApprovals })));
const CareerDevelopment = lazy(() => import('../pages/hr/CareerDevelopment').then(m => ({ default: m.CareerDevelopment })));
const HRReports         = lazy(() => import('../pages/hr/HRReports').then(m => ({ default: m.HRReports })));
const SupportTicketManagement = lazy(() => import('../pages/hr/SupportTicketManagement').then(m => ({ default: m.SupportTicketManagement })));

// Admin pages (Lazy)
const AdminDashboard   = lazy(() => import('../pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UserManagement   = lazy(() => import('../pages/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const Departments      = lazy(() => import('../pages/admin/Departments').then(m => ({ default: m.Departments })));
const LeaveManagement  = lazy(() => import('../pages/admin/LeaveManagement').then(m => ({ default: m.LeaveManagement })));
const SystemMonitor    = lazy(() => import('../pages/admin/SystemMonitor').then(m => ({ default: m.SystemMonitor })));
const WorkflowConfig   = lazy(() => import('../pages/admin/WorkflowConfig').then(m => ({ default: m.WorkflowConfig })));
const AdminNotifications = lazy(() => import('../pages/admin/Notifications').then(m => ({ default: m.AdminNotifications })));
const AdminSettings    = lazy(() => import('../pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

// Manager additional
const PurchaseRequestManagement = lazy(() => import('../pages/manager/PurchaseRequestManagement').then(m => ({ default: m.PurchaseRequestManagement })));

// Placeholder for scaffolded-but-not-yet-implemented pages

const LoadingFallback = () => (
  <div style={{ 
    height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', background: 'var(--bg-portal)', gap: 12,
    flexDirection: 'column'
  }}>
    <div className="spinner dark" />
    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Loading Portal...</span>
  </div>
);

export const AppRouter: React.FC = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>

          {/* ── Portal Selector & Role-Specific Login Pages ──────────── */}
          <Route path="/login"          element={<PortalSelector />} />
          <Route path="/login/admin"    element={<AdminLogin />} />
          <Route path="/login/manager"  element={<ManagerLogin />} />
          <Route path="/login/hr"       element={<HRLogin />} />
          <Route path="/login/employee" element={<EmployeeLogin />} />
          <Route path="/register-company" element={<RegisterCompany />} />

          {/* Root → dispatch authenticated user to their portal dashboard */}
          <Route path="/" element={<RoleRedirect />} />

          {/* ── EMPLOYEE PORTAL ─────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
            <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="/employee/dashboard"    element={<EmployeeDashboard />} />
            <Route path="/employee/leave"        element={<LeaveRequests />} />
            <Route path="/employee/projects"     element={<ProjectSubmission />} />
            <Route path="/employee/tickets"      element={<SupportTickets />} />
            <Route path="/employee/purchases"    element={<PurchaseRequests />} />
            <Route path="/employee/skills"       element={<SkillProfile />} />
            <Route path="/employee/goals"        element={<CareerGoals />} />
            <Route path="/employee/achievements" element={<Achievements />} />
            <Route path="/employee/profile"      element={<EmployeeProfile />} />
          </Route>

          {/* ── MANAGER PORTAL ──────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
            <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/dashboard"      element={<ManagerDashboard />} />
            <Route path="/manager/workflows"      element={<WorkflowReview />} />
            <Route path="/manager/team-analytics" element={<TeamAnalytics />} />
            <Route path="/manager/leave"          element={<LeaveApprovals />} />
            <Route path="/manager/projects"       element={<ProjectFeedback />} />
            <Route path="/manager/team"           element={<TeamMembers />} />
            <Route path="/manager/tickets"        element={<ManagerTickets />} />
            <Route path="/manager/purchases"      element={<PurchaseRequestManagement />} />
          </Route>

          {/* ── HR PORTAL ───────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['hr']} />}>
            <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="/hr/dashboard"        element={<HRDashboard />} />
            <Route path="/hr/leave-approvals"  element={<HRLeaveApprovals />} />
            <Route path="/hr/employee-records" element={<EmployeeRecords />} />
            <Route path="/hr/payroll"          element={<Payroll />} />
            <Route path="/hr/career"           element={<CareerDevelopment />} />
            <Route path="/hr/reports"          element={<HRReports />} />
            <Route path="/hr/tickets"          element={<SupportTicketManagement />} />
          </Route>

          {/* ── ADMIN PORTAL ────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard"      element={<AdminDashboard />} />
            <Route path="/admin/users"          element={<UserManagement />} />
            <Route path="/admin/departments"    element={<Departments />} />
            <Route path="/admin/leave"          element={<LeaveManagement />} />
            <Route path="/admin/system-monitor" element={<SystemMonitor />} />
            <Route path="/admin/workflows"      element={<WorkflowConfig />} />
            <Route path="/admin/notifications"  element={<AdminNotifications />} />
            <Route path="/admin/settings"       element={<AdminSettings />} />
          </Route>

          {/* Any unmatched path → root (role-redirect kicks in) */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);
