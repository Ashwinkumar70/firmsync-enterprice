// ============================================================
// FirmSync Enterprise – TypeScript Type Definitions
// ============================================================

export type UserRole = 'admin' | 'manager' | 'hr' | 'employee';

export type WorkflowStatus = 'created' | 'assigned' | 'under_review' | 'approved' | 'rejected' | 'completed';
export type WorkflowType = 'leave' | 'project' | 'support' | 'purchase' | 'general';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  employee_id_string: string | null;
  hire_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  department?: Department;
}

export interface Role {
  id: string;
  name: UserRole;
  permissions: Record<string, unknown>;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  manager_id: string | null;
  created_at: string;
}

export interface Workflow {
  id: string;
  type: WorkflowType;
  title: string;
  description: string | null;
  status: WorkflowStatus;
  priority: Priority;
  created_by: string;
  assigned_to: string | null;
  department_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  creator?: UserProfile;
  assignee?: UserProfile;
  workflow_steps?: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_name: string;
  approver_role: UserRole;
  approver_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comments: string | null;
  timestamp: string | null;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: 'pending' | 'manager_approved' | 'hr_approved' | 'approved' | 'rejected';
  manager_comment: string | null;
  hr_comment: string | null;
  workflow_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  employee?: UserProfile;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  manager_id: string | null;
  department_id: string | null;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  start_date: string | null;
  due_date: string | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  // joined
  owner?: UserProfile;
  manager?: UserProfile;
  project_updates?: ProjectUpdate[];
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  update_type: 'progress' | 'milestone' | 'issue' | 'feedback' | 'submission';
  created_at: string;
  // joined
  author?: UserProfile;
}

export interface SupportTicket {
  id: string;
  reporter_id: string;
  assigned_to: string | null;
  title: string;
  description: string;
  category: 'general' | 'it' | 'hr' | 'facilities' | 'payroll' | 'other';
  priority: Priority;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  reporter?: UserProfile;
}

export interface EmployeeSkill {
  id: string;
  user_id: string;
  skill_name: string;
  category: 'technical' | 'soft' | 'domain' | 'language' | 'certification';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verified: boolean;
  verified_by: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string;
  category: string;
  awarded_by: string | null;
  awarded_at: string;
}

export interface PurchaseRequest {
  id: string;
  requester_id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  vendor: string | null;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'purchased' | 'cancelled';
  workflow_id: string | null;
  approved_by: string | null;
  approval_date: string | null;
  created_at: string;
  updated_at: string;
  // joined
  requester?: UserProfile;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  status: 'draft' | 'processed' | 'paid';
  processed_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface CareerGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Database type stubs for Supabase client generic
// ============================================================
export interface Database {
  public: {
    Tables: {
      users: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> };
      roles: { Row: Role; Insert: Partial<Role>; Update: Partial<Role> };
      departments: { Row: Department; Insert: Partial<Department>; Update: Partial<Department> };
      workflows: { Row: Workflow; Insert: Partial<Workflow>; Update: Partial<Workflow> };
      workflow_steps: { Row: WorkflowStep; Insert: Partial<WorkflowStep>; Update: Partial<WorkflowStep> };
      leave_requests: { Row: LeaveRequest; Insert: Partial<LeaveRequest>; Update: Partial<LeaveRequest> };
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      project_updates: { Row: ProjectUpdate; Insert: Partial<ProjectUpdate>; Update: Partial<ProjectUpdate> };
      support_tickets: { Row: SupportTicket; Insert: Partial<SupportTicket>; Update: Partial<SupportTicket> };
      employee_skills: { Row: EmployeeSkill; Insert: Partial<EmployeeSkill>; Update: Partial<EmployeeSkill> };
      achievements: { Row: Achievement; Insert: Partial<Achievement>; Update: Partial<Achievement> };
      purchase_requests: { Row: PurchaseRequest; Insert: Partial<PurchaseRequest>; Update: Partial<PurchaseRequest> };
      payroll_records: { Row: PayrollRecord; Insert: Partial<PayrollRecord>; Update: Partial<PayrollRecord> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      career_goals: { Row: CareerGoal; Insert: Partial<CareerGoal>; Update: Partial<CareerGoal> };
    };
  };
}
