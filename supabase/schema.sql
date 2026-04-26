-- ============================================================
-- FirmSync Enterprise - Full Database Schema (MULTI-TENANT)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- COMPANIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_companies_join_code ON public.companies(join_code);

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.roles (name, permissions) VALUES
  ('admin', '{"all": true}'::jsonb),
  ('manager', '{"approve_workflows": true, "view_team": true}'::jsonb),
  ('hr', '{"approve_leave": true, "view_employees": true, "manage_records": true}'::jsonb),
  ('employee', '{"submit_requests": true, "view_own": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Helper function to get current user's company_id
-- We define this early so we can use it for DEFAULTS
CREATE OR REPLACE FUNCTION public.get_my_company()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manager_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);
CREATE INDEX IF NOT EXISTS idx_departments_company ON public.departments(company_id);

-- ============================================================
-- USERS TABLE (mirrors auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'employee' REFERENCES public.roles(name),
  department_id UUID REFERENCES public.departments(id),
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  employee_id_string TEXT,
  hire_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_company ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_dept ON public.users(department_id);

-- ============================================================
-- WORKFLOWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('leave', 'project', 'support', 'purchase', 'general')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'assigned', 'under_review', 'approved', 'rejected', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID NOT NULL REFERENCES public.users(id),
  assigned_to UUID REFERENCES public.users(id),
  department_id UUID REFERENCES public.departments(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_company ON public.workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON public.workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_assigned_to ON public.workflows(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_department ON public.workflows(department_id);

-- ============================================================
-- WORKFLOW STEPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  approver_role TEXT NOT NULL REFERENCES public.roles(name),
  approver_id UUID REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  comments TEXT,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_company ON public.workflow_steps(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON public.workflow_steps(workflow_id);

-- ============================================================
-- LEAVE REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'manager_approved', 'hr_approved', 'approved', 'rejected')),
  manager_comment TEXT,
  hr_comment TEXT,
  workflow_id UUID REFERENCES public.workflows(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_company ON public.leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_workflow ON public.leave_requests(workflow_id);
CREATE INDEX IF NOT EXISTS idx_leave_status_date ON public.leave_requests(status, created_at DESC);

-- ============================================================
-- PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id),
  manager_id UUID REFERENCES public.users(id),
  department_id UUID REFERENCES public.departments(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  start_date DATE,
  due_date DATE,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_dept ON public.projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- ============================================================
-- PROJECT UPDATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id),
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  update_type TEXT NOT NULL DEFAULT 'progress' CHECK (update_type IN ('progress', 'milestone', 'issue', 'feedback', 'submission')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_updates_company ON public.project_updates(company_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_project ON public.project_updates(project_id);

-- ============================================================
-- SUPPORT TICKETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.users(id),
  assigned_to UUID REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'it', 'hr', 'facilities', 'payroll', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_company ON public.support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter ON public.support_tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.support_tickets(category);

-- ============================================================
-- EMPLOYEE SKILLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employee_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'technical' CHECK (category IN ('technical', 'soft', 'domain', 'language', 'certification')),
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skills_company ON public.employee_skills(company_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON public.employee_skills(user_id);

-- ============================================================
-- ACHIEVEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'performance',
  awarded_by UUID REFERENCES public.users(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_company ON public.achievements(company_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);

-- ============================================================
-- PURCHASE REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  vendor TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'purchased', 'cancelled')),
  workflow_id UUID REFERENCES public.workflows(id),
  approved_by UUID REFERENCES public.users(id),
  approval_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_company ON public.purchase_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requester ON public.purchase_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_purchase_status ON public.purchase_requests(status);

-- ============================================================
-- PAYROLL RECORDS TABLE (stub)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(12, 2) NOT NULL,
  bonuses DECIMAL(12, 2) DEFAULT 0,
  deductions DECIMAL(12, 2) DEFAULT 0,
  net_pay DECIMAL(12, 2) GENERATED ALWAYS AS (base_salary + bonuses - deductions) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_company ON public.payroll_records(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON public.payroll_records(employee_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_company ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);

-- ============================================================
-- CAREER GOALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT public.get_my_company() REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_career_goals_company ON public.career_goals(company_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS workflows_updated_at ON public.workflows;
CREATE TRIGGER workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS purchase_requests_updated_at ON public.purchase_requests;
CREATE TRIGGER purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS career_goals_updated_at ON public.career_goals;
CREATE TRIGGER career_goals_updated_at BEFORE UPDATE ON public.career_goals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- NEW USER HANDLER (creates public.users AND public.companies)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_join_code TEXT;
  v_company_name TEXT;
  v_full_name TEXT;
  v_attempts INTEGER := 0;
BEGIN
  -- Extract metadata with safety
  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'New Company');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  -- Check if this is a company registration flow
  IF (NEW.raw_user_meta_data->>'is_company_registration') = 'true' THEN
    -- Use admin's chosen code, or generate one if not provided
    v_join_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'company_code', '')));
    IF v_join_code = '' THEN
      -- Generate an 8 character join code with collision check
      LOOP
        v_join_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        IF NOT EXISTS (SELECT 1 FROM public.companies WHERE join_code = v_join_code) THEN
          EXIT;
        END IF;
        v_attempts := v_attempts + 1;
        IF v_attempts > 15 THEN
          RAISE EXCEPTION 'Could not generate unique join code after several attempts';
        END IF;
      END LOOP;
    ELSE
      -- Verify chosen code is unique
      IF EXISTS (SELECT 1 FROM public.companies WHERE join_code = v_join_code) THEN
        RAISE EXCEPTION 'Company code "%" is already in use. Please choose a different one.', v_join_code;
      END IF;
    END IF;
    
    -- Create the new company
    -- We use a simple INSERT and capture the ID. If it exists by name, we might want to allow it 
    -- but usually company names aren't unique, only join_codes are.
    INSERT INTO public.companies (name, join_code)
    VALUES (v_company_name, v_join_code)
    RETURNING id INTO v_company_id;
    
    -- Create departments (custom if provided, else defaults)
    IF (NEW.raw_user_meta_data->'departments') IS NOT NULL AND jsonb_array_length(NEW.raw_user_meta_data->'departments') > 0 THEN
      INSERT INTO public.departments (company_id, name)
      SELECT v_company_id, trim(name)
      FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'departments') AS name
      WHERE trim(name) != ''
      ON CONFLICT (company_id, name) DO NOTHING;
    ELSE
      -- Create default departments
      INSERT INTO public.departments (company_id, name) VALUES 
        (v_company_id, 'Engineering'),
        (v_company_id, 'Human Resources'),
        (v_company_id, 'Finance'),
        (v_company_id, 'Operations'),
        (v_company_id, 'Sales'),
        (v_company_id, 'Marketing')
      ON CONFLICT (company_id, name) DO NOTHING;
    END IF;
      
    -- Insert the admin user profile
    INSERT INTO public.users (id, company_id, email, full_name, role)
    VALUES (NEW.id, v_company_id, NEW.email, v_full_name, 'admin')
    ON CONFLICT (id) DO UPDATE SET
      company_id = EXCLUDED.company_id,
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
    
  ELSE
    -- Normal employee signup, user must pass company_id via metadata
    IF (NEW.raw_user_meta_data->>'company_id') IS NULL THEN
      -- If no company_id is provided, we can't create the profile.
      -- We return NEW to allow the auth user creation, but they won't have a profile.
      RETURN NEW;
    END IF;

    INSERT INTO public.users (
      id, 
      company_id, 
      email, 
      full_name, 
      role,
      phone,
      location,
      employee_id_string,
      department_id
    )
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'company_id')::uuid,
      NEW.email,
      v_full_name,
      COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'location',
      NEW.raw_user_meta_data->>'employee_id_string',
      (NEW.raw_user_meta_data->>'department_id')::uuid
    )
    ON CONFLICT (id) DO UPDATE SET
      company_id = EXCLUDED.company_id,
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      phone = EXCLUDED.phone,
      location = EXCLUDED.location,
      employee_id_string = EXCLUDED.employee_id_string,
      department_id = EXCLUDED.department_id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Re-raise the error so Supabase Auth can catch it, but try to keep it clean
  RAISE EXCEPTION 'Registration Trigger Error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;


-- Add unique constraint to employee_id_string per company
-- This ensures that within a company, employee IDs are unique
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_employee_id_string_key;
ALTER TABLE public.users ADD CONSTRAINT users_employee_id_string_company_unique UNIQUE (company_id, employee_id_string);



DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
