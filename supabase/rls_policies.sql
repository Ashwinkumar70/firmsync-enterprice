-- ============================================================
-- FirmSync Enterprise - Row Level Security Policies
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get current user's department
CREATE OR REPLACE FUNCTION public.get_my_department()
RETURNS UUID AS $$
  SELECT department_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- ROLES TABLE POLICIES
-- ============================================================
CREATE POLICY "roles_read_all" ON public.roles FOR SELECT USING (true);
CREATE POLICY "roles_admin_all" ON public.roles FOR ALL USING (get_my_role() = 'admin');

-- ============================================================
-- DEPARTMENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "departments_read_all" ON public.departments FOR SELECT USING (true);
CREATE POLICY "departments_admin_all" ON public.departments FOR ALL USING (get_my_role() = 'admin');

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================
-- Employees see their own profile
CREATE POLICY "users_view_own" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Managers see their department members
CREATE POLICY "users_manager_view_dept" ON public.users
  FOR SELECT USING (
    get_my_role() = 'manager' AND department_id = get_my_department()
  );

-- HR sees all users
CREATE POLICY "users_hr_view_all" ON public.users
  FOR SELECT USING (get_my_role() IN ('hr', 'admin'));

-- Users update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Admin full access
CREATE POLICY "users_admin_all" ON public.users
  FOR ALL USING (get_my_role() = 'admin');

-- ============================================================
-- WORKFLOWS TABLE POLICIES
-- ============================================================
CREATE POLICY "workflows_employee_own" ON public.workflows
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "workflows_employee_insert" ON public.workflows
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "workflows_employee_update_own" ON public.workflows
  FOR UPDATE USING (created_by = auth.uid() AND status = 'created');

CREATE POLICY "workflows_manager_dept" ON public.workflows
  FOR SELECT USING (
    get_my_role() = 'manager' AND department_id = get_my_department()
  );

CREATE POLICY "workflows_manager_update" ON public.workflows
  FOR UPDATE USING (
    get_my_role() = 'manager' AND department_id = get_my_department()
  );

CREATE POLICY "workflows_hr_view" ON public.workflows
  FOR SELECT USING (get_my_role() IN ('hr', 'admin'));

CREATE POLICY "workflows_hr_update" ON public.workflows
  FOR UPDATE USING (get_my_role() IN ('hr', 'admin'));

CREATE POLICY "workflows_admin_all" ON public.workflows
  FOR ALL USING (get_my_role() = 'admin');

-- ============================================================
-- WORKFLOW STEPS POLICIES
-- ============================================================
CREATE POLICY "steps_employee_view_own" ON public.workflow_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE id = workflow_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "steps_manager_view" ON public.workflow_steps
  FOR SELECT USING (get_my_role() IN ('manager', 'hr', 'admin'));

CREATE POLICY "steps_manager_update" ON public.workflow_steps
  FOR UPDATE USING (get_my_role() IN ('manager', 'hr', 'admin'));

CREATE POLICY "steps_manager_insert" ON public.workflow_steps
  FOR INSERT WITH CHECK (get_my_role() IN ('manager', 'hr', 'admin'));

CREATE POLICY "steps_admin_all" ON public.workflow_steps
  FOR ALL USING (get_my_role() = 'admin');

-- ============================================================
-- LEAVE REQUESTS POLICIES
-- ============================================================
CREATE POLICY "leave_employee_own" ON public.leave_requests
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "leave_employee_insert" ON public.leave_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "leave_manager_dept" ON public.leave_requests
  FOR SELECT USING (
    get_my_role() = 'manager' AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = employee_id AND department_id = get_my_department()
    )
  );

CREATE POLICY "leave_manager_update" ON public.leave_requests
  FOR UPDATE USING (
    get_my_role() = 'manager' AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = employee_id AND department_id = get_my_department()
    )
  );

CREATE POLICY "leave_hr_all" ON public.leave_requests
  FOR ALL USING (get_my_role() IN ('hr', 'admin'));

-- ============================================================
-- PROJECTS POLICIES
-- ============================================================
CREATE POLICY "projects_owner_view" ON public.projects
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "projects_owner_insert" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_owner_update" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "projects_manager_dept" ON public.projects
  FOR SELECT USING (
    get_my_role() = 'manager' AND department_id = get_my_department()
  );

CREATE POLICY "projects_manager_update" ON public.projects
  FOR UPDATE USING (
    get_my_role() = 'manager' AND (manager_id = auth.uid() OR department_id = get_my_department())
  );

CREATE POLICY "projects_admin_hr_all" ON public.projects
  FOR ALL USING (get_my_role() IN ('hr', 'admin'));

-- ============================================================
-- PROJECT UPDATES POLICIES
-- ============================================================
CREATE POLICY "pupdates_author_own" ON public.project_updates
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "pupdates_author_insert" ON public.project_updates
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "pupdates_manager_view" ON public.project_updates
  FOR SELECT USING (get_my_role() IN ('manager', 'hr', 'admin'));

CREATE POLICY "pupdates_manager_insert" ON public.project_updates
  FOR INSERT WITH CHECK (get_my_role() IN ('manager', 'hr', 'admin'));

-- ============================================================
-- SUPPORT TICKETS POLICIES
-- ============================================================
CREATE POLICY "tickets_reporter_own" ON public.support_tickets
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "tickets_reporter_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "tickets_manager_view" ON public.support_tickets
  FOR SELECT USING (get_my_role() IN ('manager', 'hr', 'admin'));

CREATE POLICY "tickets_manager_update" ON public.support_tickets
  FOR UPDATE USING (get_my_role() IN ('manager', 'hr', 'admin'));

CREATE POLICY "tickets_admin_all" ON public.support_tickets
  FOR ALL USING (get_my_role() = 'admin');

-- ============================================================
-- EMPLOYEE SKILLS POLICIES
-- ============================================================
CREATE POLICY "skills_own" ON public.employee_skills
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "skills_insert_own" ON public.employee_skills
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "skills_update_own" ON public.employee_skills
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "skills_hr_view_all" ON public.employee_skills
  FOR SELECT USING (get_my_role() IN ('hr', 'admin', 'manager'));

CREATE POLICY "skills_hr_update" ON public.employee_skills
  FOR UPDATE USING (get_my_role() IN ('hr', 'admin'));

-- ============================================================
-- ACHIEVEMENTS POLICIES
-- ============================================================
CREATE POLICY "achievements_own" ON public.achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "achievements_hr_all" ON public.achievements
  FOR ALL USING (get_my_role() IN ('hr', 'admin', 'manager'));

-- ============================================================
-- PURCHASE REQUESTS POLICIES
-- ============================================================
CREATE POLICY "purchase_requester_own" ON public.purchase_requests
  FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "purchase_requester_insert" ON public.purchase_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "purchase_manager_view" ON public.purchase_requests
  FOR SELECT USING (get_my_role() IN ('manager', 'hr', 'admin'));

CREATE POLICY "purchase_manager_update" ON public.purchase_requests
  FOR UPDATE USING (get_my_role() IN ('manager', 'hr', 'admin'));

-- ============================================================
-- PAYROLL RECORDS POLICIES
-- ============================================================
CREATE POLICY "payroll_own" ON public.payroll_records
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "payroll_hr_all" ON public.payroll_records
  FOR ALL USING (get_my_role() IN ('hr', 'admin'));

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================
CREATE POLICY "notif_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notif_own_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notif_system_insert" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- CAREER GOALS POLICIES
-- ============================================================
CREATE POLICY "goals_own" ON public.career_goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "goals_own_insert" ON public.career_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_own_update" ON public.career_goals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "goals_hr_view" ON public.career_goals
  FOR SELECT USING (get_my_role() IN ('hr', 'admin', 'manager'));

-- ============================================================
-- STORAGE: project-files bucket
-- Run in SQL Editor after creating bucket in Supabase Dashboard
-- ============================================================
-- After creating bucket 'project-files' in Storage UI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

CREATE POLICY "storage_employee_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_employee_view_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_manager_view" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files' AND get_my_role() IN ('manager', 'hr', 'admin')
  );
