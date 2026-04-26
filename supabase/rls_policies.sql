-- ============================================================
-- FirmSync Enterprise - Row Level Security Policies (Multi-Tenant)
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
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
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public, auth;

-- Helper function to get current user's department
CREATE OR REPLACE FUNCTION public.get_my_department()
RETURNS UUID AS $$
  SELECT department_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public, auth;

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION public.get_my_company()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public, auth;

-- ============================================================
-- COMPANIES TABLE POLICIES
-- ============================================================
-- We allow read access to companies ONLY if the user is authenticated 
-- or if they are providing a valid join_code (checked via a function or just restricted)
DROP POLICY IF EXISTS "companies_read_by_join_code" ON public.companies;
CREATE POLICY "companies_read_by_join_code" ON public.companies 
  FOR SELECT USING (
    auth.role() = 'authenticated' -- Logged in users can see companies
  );

-- ============================================================
-- ROLES TABLE POLICIES (Global)
-- ============================================================
DROP POLICY IF EXISTS "roles_read_all" ON public.roles;
CREATE POLICY "roles_read_all" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "roles_admin_all" ON public.roles;
CREATE POLICY "roles_admin_all" ON public.roles FOR ALL USING (get_my_role() = 'admin');

-- ============================================================
-- DEPARTMENTS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "departments_read_all" ON public.departments;
CREATE POLICY "departments_read_all" ON public.departments 
  FOR SELECT USING (company_id = get_my_company());

-- Allow anonymous users to read departments ONLY if they are signing up (rarely needed if we join)
DROP POLICY IF EXISTS "departments_anon_read" ON public.departments;
CREATE POLICY "departments_anon_read" ON public.departments
  FOR SELECT TO authenticated USING (company_id = get_my_company());

DROP POLICY IF EXISTS "departments_admin_all" ON public.departments;
CREATE POLICY "departments_admin_all" ON public.departments 
  FOR ALL USING (company_id = get_my_company() AND get_my_role() = 'admin');

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "users_view_own" ON public.users;
CREATE POLICY "users_view_own" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "users_manager_view_dept" ON public.users;
CREATE POLICY "users_manager_view_dept" ON public.users
  FOR SELECT USING (
    get_my_role() = 'manager' 
    AND department_id = get_my_department()
    AND company_id = get_my_company()
  );

DROP POLICY IF EXISTS "users_hr_view_all" ON public.users;
CREATE POLICY "users_hr_view_all" ON public.users
  FOR SELECT USING (
    get_my_role() IN ('hr', 'admin')
    AND company_id = get_my_company()
  );

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "users_admin_all" ON public.users;
CREATE POLICY "users_admin_all" ON public.users
  FOR ALL USING (
    get_my_role() = 'admin' AND company_id = get_my_company()
  );

-- ============================================================
-- WORKFLOWS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "workflows_employee_own" ON public.workflows;
CREATE POLICY "workflows_employee_own" ON public.workflows
  FOR SELECT USING (company_id = get_my_company() AND created_by = auth.uid());

DROP POLICY IF EXISTS "workflows_employee_insert" ON public.workflows;
CREATE POLICY "workflows_employee_insert" ON public.workflows
  FOR INSERT WITH CHECK (company_id = get_my_company() AND created_by = auth.uid());

DROP POLICY IF EXISTS "workflows_employee_update_own" ON public.workflows;
CREATE POLICY "workflows_employee_update_own" ON public.workflows
  FOR UPDATE USING (company_id = get_my_company() AND created_by = auth.uid() AND status = 'created');

DROP POLICY IF EXISTS "workflows_manager_dept" ON public.workflows;
CREATE POLICY "workflows_manager_dept" ON public.workflows
  FOR SELECT USING (
    company_id = get_my_company() AND get_my_role() = 'manager' AND department_id = get_my_department()
  );

DROP POLICY IF EXISTS "workflows_manager_update" ON public.workflows;
CREATE POLICY "workflows_manager_update" ON public.workflows
  FOR UPDATE USING (
    company_id = get_my_company() AND get_my_role() = 'manager' AND department_id = get_my_department()
  );

DROP POLICY IF EXISTS "workflows_hr_view" ON public.workflows;
CREATE POLICY "workflows_hr_view" ON public.workflows
  FOR SELECT USING (company_id = get_my_company() AND get_my_role() IN ('hr', 'admin'));

DROP POLICY IF EXISTS "workflows_hr_update" ON public.workflows;
CREATE POLICY "workflows_hr_update" ON public.workflows
  FOR UPDATE USING (company_id = get_my_company() AND get_my_role() IN ('hr', 'admin'));

DROP POLICY IF EXISTS "workflows_admin_all" ON public.workflows;
CREATE POLICY "workflows_admin_all" ON public.workflows
  FOR ALL USING (company_id = get_my_company() AND get_my_role() = 'admin');

-- ============================================================
-- WORKFLOW STEPS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "steps_employee_view_own" ON public.workflow_steps;
CREATE POLICY "steps_employee_view_own" ON public.workflow_steps
  FOR SELECT USING (
    company_id = get_my_company() AND EXISTS (
      SELECT 1 FROM public.workflows
      WHERE id = workflow_id AND created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "steps_manager_view" ON public.workflow_steps;
CREATE POLICY "steps_manager_view" ON public.workflow_steps
  FOR SELECT USING (company_id = get_my_company() AND get_my_role() IN ('manager', 'hr', 'admin'));

DROP POLICY IF EXISTS "steps_manager_update" ON public.workflow_steps;
CREATE POLICY "steps_manager_update" ON public.workflow_steps
  FOR UPDATE USING (company_id = get_my_company() AND get_my_role() IN ('manager', 'hr', 'admin'));

DROP POLICY IF EXISTS "steps_manager_insert" ON public.workflow_steps;
CREATE POLICY "steps_manager_insert" ON public.workflow_steps
  FOR INSERT WITH CHECK (company_id = get_my_company() AND get_my_role() IN ('manager', 'hr', 'admin'));

DROP POLICY IF EXISTS "steps_admin_all" ON public.workflow_steps;
CREATE POLICY "steps_admin_all" ON public.workflow_steps
  FOR ALL USING (company_id = get_my_company() AND get_my_role() = 'admin');

-- ============================================================
-- LEAVE REQUESTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "leave_employee_own" ON public.leave_requests;
CREATE POLICY "leave_employee_own" ON public.leave_requests
  FOR SELECT USING (company_id = get_my_company() AND employee_id = auth.uid());

DROP POLICY IF EXISTS "leave_employee_insert" ON public.leave_requests;
CREATE POLICY "leave_employee_insert" ON public.leave_requests
  FOR INSERT WITH CHECK (company_id = get_my_company() AND employee_id = auth.uid());

DROP POLICY IF EXISTS "leave_manager_dept" ON public.leave_requests;
CREATE POLICY "leave_manager_dept" ON public.leave_requests
  FOR SELECT USING (
    company_id = get_my_company() AND get_my_role() = 'manager' AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = employee_id AND department_id = get_my_department()
    )
  );

DROP POLICY IF EXISTS "leave_manager_update" ON public.leave_requests;
CREATE POLICY "leave_manager_update" ON public.leave_requests
  FOR UPDATE USING (
    company_id = get_my_company() AND get_my_role() = 'manager' AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = employee_id AND department_id = get_my_department()
    )
  );

DROP POLICY IF EXISTS "leave_hr_all" ON public.leave_requests;
CREATE POLICY "leave_hr_all" ON public.leave_requests
  FOR ALL USING (company_id = get_my_company() AND get_my_role() IN ('hr', 'admin'));

-- ============================================================
-- PROJECTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "projects_owner_view" ON public.projects;
CREATE POLICY "projects_owner_view" ON public.projects
  FOR SELECT USING (company_id = get_my_company() AND owner_id = auth.uid());

DROP POLICY IF EXISTS "projects_owner_insert" ON public.projects;
CREATE POLICY "projects_owner_insert" ON public.projects
  FOR INSERT WITH CHECK (company_id = get_my_company() AND owner_id = auth.uid());

DROP POLICY IF EXISTS "projects_owner_update" ON public.projects;
CREATE POLICY "projects_owner_update" ON public.projects
  FOR UPDATE USING (company_id = get_my_company() AND owner_id = auth.uid());

DROP POLICY IF EXISTS "projects_manager_dept" ON public.projects;
CREATE POLICY "projects_manager_dept" ON public.projects
  FOR SELECT USING (
    company_id = get_my_company() AND get_my_role() = 'manager' AND department_id = get_my_department()
  );

DROP POLICY IF EXISTS "projects_manager_update" ON public.projects;
CREATE POLICY "projects_manager_update" ON public.projects
  FOR UPDATE USING (
    company_id = get_my_company() AND get_my_role() = 'manager' AND (manager_id = auth.uid() OR department_id = get_my_department())
  );

DROP POLICY IF EXISTS "projects_admin_hr_all" ON public.projects;
CREATE POLICY "projects_admin_hr_all" ON public.projects
  FOR ALL USING (company_id = get_my_company() AND get_my_role() IN ('hr', 'admin'));

-- ============================================================
-- PROJECT UPDATES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "pupdates_author_own" ON public.project_updates;
CREATE POLICY "pupdates_author_own" ON public.project_updates
  FOR SELECT USING (company_id = get_my_company() AND author_id = auth.uid());

DROP POLICY IF EXISTS "pupdates_author_insert" ON public.project_updates;
CREATE POLICY "pupdates_author_insert" ON public.project_updates
  FOR INSERT WITH CHECK (company_id = get_my_company() AND author_id = auth.uid());

DROP POLICY IF EXISTS "pupdates_manager_view" ON public.project_updates;
CREATE POLICY "pupdates_manager_view" ON public.project_updates
  FOR SELECT USING (company_id = get_my_company() AND get_my_role() IN ('manager', 'hr', 'admin'));

DROP POLICY IF EXISTS "pupdates_manager_insert" ON public.project_updates;
CREATE POLICY "pupdates_manager_insert" ON public.project_updates
  FOR INSERT WITH CHECK (company_id = get_my_company() AND get_my_role() IN ('manager', 'hr', 'admin'));

-- ============================================================
-- SUPPORT TICKETS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "tickets_reporter_own" ON public.support_tickets;
CREATE POLICY "tickets_reporter_own" ON public.support_tickets
  FOR SELECT USING (company_id = get_my_company() AND reporter_id = auth.uid());

DROP POLICY IF EXISTS "tickets_reporter_insert" ON public.support_tickets;
CREATE POLICY "tickets_reporter_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (company_id = get_my_company() AND reporter_id = auth.uid());

DROP POLICY IF EXISTS "tickets_manager_view" ON public.support_tickets;
CREATE POLICY "tickets_manager_view" ON public.support_tickets
  FOR SELECT USING (
    company_id = get_my_company() AND (
      get_my_role() = 'manager' AND EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = reporter_id AND u.department_id = get_my_department() AND u.company_id = get_my_company()
      )
      OR get_my_role() IN ('hr', 'admin')
    )
  );

DROP POLICY IF EXISTS "tickets_manager_update" ON public.support_tickets;
CREATE POLICY "tickets_manager_update" ON public.support_tickets
  FOR UPDATE USING (company_id = get_my_company() AND get_my_role() IN ('manager', 'hr', 'admin'));

DROP POLICY IF EXISTS "tickets_admin_all" ON public.support_tickets;
CREATE POLICY "tickets_admin_all" ON public.support_tickets
  FOR ALL USING (company_id = get_my_company() AND get_my_role() = 'admin');

-- ============================================================
-- EMPLOYEE SKILLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "skills_own" ON public.employee_skills;
CREATE POLICY "skills_own" ON public.employee_skills
  FOR SELECT USING (company_id = get_my_company() AND user_id = auth.uid());

DROP POLICY IF EXISTS "skills_insert_own" ON public.employee_skills;
CREATE POLICY "skills_insert_own" ON public.employee_skills
  FOR INSERT WITH CHECK (company_id = get_my_company() AND user_id = auth.uid());

DROP POLICY IF EXISTS "skills_update_own" ON public.employee_skills;
CREATE POLICY "skills_update_own" ON public.employee_skills
  FOR UPDATE USING (company_id = get_my_company() AND user_id = auth.uid());

DROP POLICY IF EXISTS "skills_hr_view_all" ON public.employee_skills;
CREATE POLICY "skills_hr_view_all" ON public.employee_skills
  FOR SELECT USING (company_id = get_my_company() AND get_my_role() IN ('hr', 'admin', 'manager'));

DROP POLICY IF EXISTS "skills_hr_update" ON public.employee_skills;
CREATE POLICY "skills_hr_update" ON public.employee_skills
  FOR UPDATE USING (company_id = get_my_company() AND get_my_role() IN ('hr', 'admin'));

-- ============================================================
-- ACHIEVEMENTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "achievements_own" ON public.achievements;
CREATE POLICY "achievements_own" ON public.achievements
  FOR SELECT USING (company_id = get_my_company() AND user_id = auth.uid());

DROP POLICY IF EXISTS "achievements_hr_all" ON public.achievements;
CREATE POLICY "achievements_hr_all" ON public.achievements
  FOR ALL USING (company_id = get_my_company() AND get_my_role() IN ('hr', 'admin', 'manager'));

-- ============================================================
-- PURCHASE REQUESTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "purchase_requester_own" ON public.purchase_requests;
CREATE POLICY "purchase_requester_own" ON public.purchase_requests
  FOR SELECT USING (company_id = get_my_company() AND requester_id = auth.uid());

DROP POLICY IF EXISTS "purchase_requester_insert" ON public.purchase_requests;
CREATE POLICY "purchase_requester_insert" ON public.purchase_requests
  FOR INSERT WITH CHECK (company_id = get_my_company() AND requester_id = auth.uid());

DROP POLICY IF EXISTS "purchase_manager_view" ON public.purchase_requests;
CREATE POLICY "purchase_manager_view" ON public.purchase_requests
  FOR SELECT USING (company_id = get_my_company() AND get_my_role() IN ('manager', 'hr', 'admin'));

DROP POLICY IF EXISTS "purchase_manager_update" ON public.purchase_requests;
CREATE POLICY "purchase_manager_update" ON public.purchase_requests
  FOR UPDATE USING (company_id = get_my_company() AND get_my_role() IN ('manager', 'hr', 'admin'));

-- ============================================================
-- PAYROLL RECORDS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "payroll_own" ON public.payroll_records;
CREATE POLICY "payroll_own" ON public.payroll_records
  FOR SELECT USING (company_id = get_my_company() AND employee_id = auth.uid());

DROP POLICY IF EXISTS "payroll_hr_all" ON public.payroll_records;
CREATE POLICY "payroll_hr_all" ON public.payroll_records
  FOR ALL USING (company_id = get_my_company() AND get_my_role() IN ('hr', 'admin'));

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "notif_own" ON public.notifications;
CREATE POLICY "notif_own" ON public.notifications
  FOR SELECT USING (company_id = get_my_company() AND user_id = auth.uid());

DROP POLICY IF EXISTS "notif_own_update" ON public.notifications;
CREATE POLICY "notif_own_update" ON public.notifications
  FOR UPDATE USING (company_id = get_my_company() AND user_id = auth.uid());

DROP POLICY IF EXISTS "notif_system_insert" ON public.notifications;
CREATE POLICY "notif_system_insert" ON public.notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND company_id = get_my_company()
  );

-- ============================================================
-- CAREER GOALS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "goals_own" ON public.career_goals;
CREATE POLICY "goals_own" ON public.career_goals
  FOR SELECT USING (company_id = get_my_company() AND user_id = auth.uid());

DROP POLICY IF EXISTS "goals_own_insert" ON public.career_goals;
CREATE POLICY "goals_own_insert" ON public.career_goals
  FOR INSERT WITH CHECK (company_id = get_my_company() AND user_id = auth.uid());

DROP POLICY IF EXISTS "goals_own_update" ON public.career_goals;
CREATE POLICY "goals_own_update" ON public.career_goals
  FOR UPDATE USING (company_id = get_my_company() AND user_id = auth.uid());

DROP POLICY IF EXISTS "goals_hr_view" ON public.career_goals;
CREATE POLICY "goals_hr_view" ON public.career_goals
  FOR SELECT USING (company_id = get_my_company() AND get_my_role() IN ('hr', 'admin', 'manager'));

-- ============================================================
-- STORAGE: project-files bucket
-- ============================================================
DROP POLICY IF EXISTS "storage_employee_upload" ON storage.objects;
CREATE POLICY "storage_employee_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage_view_company_files" ON storage.objects;
CREATE POLICY "storage_view_company_files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files' AND (
      auth.uid()::text = (storage.foldername(name))[1] -- Own files
      OR EXISTS ( -- Or files from someone in the same company
        SELECT 1 FROM public.users u
        WHERE u.id::text = (storage.foldername(name))[1]
        AND u.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
      )
    )
  );
