ALTER TABLE public.hr_employee_requests
  ADD COLUMN IF NOT EXISTS collaborator_type text NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS primary_pole text,
  ADD COLUMN IF NOT EXISTS position_key text;
UPDATE public.hr_employee_requests SET position_key = position::text WHERE position_key IS NULL AND position IS NOT NULL;
UPDATE public.hr_employee_requests SET primary_pole = poles[1] WHERE primary_pole IS NULL AND cardinality(poles) > 0;