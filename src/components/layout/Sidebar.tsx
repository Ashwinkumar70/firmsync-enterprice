import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, FolderOpen, Ticket, ShoppingCart,
  Star, Users, ClipboardList, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight, Target, Award, UserSquare2,
  Workflow, DollarSign, Bell, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../lib/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_CONFIG: Record<UserRole, { section: string; items: NavItem[] }[]> = {
  employee: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard',        path: '/employee/dashboard',  icon: <LayoutDashboard size={18} /> },
        { label: 'Leave Requests',   path: '/employee/leave',       icon: <Calendar size={18} /> },
        { label: 'Projects',         path: '/employee/projects',    icon: <FolderOpen size={18} /> },
        { label: 'Support Tickets',  path: '/employee/tickets',     icon: <Ticket size={18} /> },
        { label: 'Purchase Requests', path: '/employee/purchases',  icon: <ShoppingCart size={18} /> },
        { label: 'My Profile',       path: '/employee/profile',    icon: <User size={18} /> },
      ],
    },
    {
      section: 'Growth',
      items: [
        { label: 'Skill Profile',  path: '/employee/skills',       icon: <Star size={18} /> },
        { label: 'Career Goals',   path: '/employee/goals',        icon: <Target size={18} /> },
        { label: 'Achievements',   path: '/employee/achievements', icon: <Award size={18} /> },
      ],
    },
  ],
  manager: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard',      path: '/manager/dashboard',      icon: <LayoutDashboard size={18} /> },
        { label: 'Workflow Review', path: '/manager/workflows',     icon: <Workflow size={18} /> },
        { label: 'Leave Approvals', path: '/manager/leave',         icon: <Calendar size={18} /> },
        { label: 'Project Feedback', path: '/manager/projects',     icon: <FolderOpen size={18} /> },
      ],
    },
    {
      section: 'Team',
      items: [
        { label: 'Team Members',   path: '/manager/team',           icon: <Users size={18} /> },
        { label: 'Team Analytics', path: '/manager/team-analytics', icon: <BarChart3 size={18} /> },
        { label: 'Support Tickets', path: '/manager/tickets',       icon: <Ticket size={18} /> },
      ],
    },
  ],
  hr: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard',        path: '/hr/dashboard',        icon: <LayoutDashboard size={18} /> },
        { label: 'Leave Approvals',  path: '/hr/leave-approvals',  icon: <Calendar size={18} /> },
        { label: 'Employee Records', path: '/hr/employee-records', icon: <UserSquare2 size={18} /> },
        { label: 'Career Dev.',      path: '/hr/career',           icon: <Target size={18} /> },
      ],
    },
    {
      section: 'Reports',
      items: [
        { label: 'HR Reports', path: '/hr/reports',  icon: <BarChart3 size={18} /> },
        { label: 'Payroll',    path: '/hr/payroll',  icon: <DollarSign size={18} /> },
      ],
    },
  ],
  admin: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard',     path: '/admin/dashboard',   icon: <LayoutDashboard size={18} /> },
        { label: 'User Mgmt.',    path: '/admin/users',       icon: <Users size={18} /> },
        { label: 'Departments',   path: '/admin/departments', icon: <ClipboardList size={18} /> },
      ],
    },
    {
      section: 'System',
      items: [
        { label: 'Workflow Config',  path: '/admin/workflows',      icon: <Workflow size={18} /> },
        { label: 'System Monitor',  path: '/admin/system-monitor', icon: <BarChart3 size={18} /> },
        { label: 'Notifications',   path: '/admin/notifications',  icon: <Bell size={18} /> },
        { label: 'Settings',        path: '/admin/settings',       icon: <Settings size={18} /> },
      ],
    },
  ],
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ mobileOpen, onMobileClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const navSections = React.useMemo(() => (role ? NAV_CONFIG[role] : []), [role]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onMobileClose} />}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">FS</div>
          {!collapsed && (
            <div>
              <div className="sidebar-logo-text">FirmSync</div>
              <div className="sidebar-logo-sub">Enterprise</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <div className="sidebar-section-label">{section.section}</div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={onMobileClose}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && user && (
            <div style={{ 
              padding: '12px 16px', 
              marginBottom: 12, 
              borderRadius: 'var(--radius)', 
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>
                {user.full_name || user.email}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {user.role}
              </div>
            </div>
          )}

          <button
            className="sidebar-item"
            onClick={handleSignOut}
            title={collapsed ? 'Sign Out' : undefined}
            style={{ width: '100%' }}
          >
            <LogOut size={18} style={{ color: 'rgba(239,68,68,0.7)' }} />
            {!collapsed && <span style={{ color: 'rgba(239,68,68,0.8)' }}>Sign Out</span>}
          </button>

          <button
            className="sidebar-item"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
            style={{ width: '100%', marginTop: 4 }}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
});
