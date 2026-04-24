-- ============================================================
-- FirmSync Enterprise - Seed Missing Departments
-- Run this in Supabase SQL Editor to backfill departments
-- for companies created before the trigger was fixed.
-- ============================================================

-- Add default departments to any company that has zero departments
INSERT INTO public.departments (company_id, name)
SELECT c.id, d.name
FROM public.companies c
CROSS JOIN (VALUES
  ('Engineering'), ('Human Resources'), ('Finance'),
  ('Operations'), ('Sales'), ('Marketing')
) AS d(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments WHERE company_id = c.id
)
ON CONFLICT (company_id, name) DO NOTHING;

-- Verify
SELECT c.name AS company, d.name AS department
FROM public.companies c
JOIN public.departments d ON c.id = d.company_id
ORDER BY c.name, d.name;
