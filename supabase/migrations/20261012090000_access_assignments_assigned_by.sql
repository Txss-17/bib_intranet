ALTER TABLE public.access_assignments
  ADD COLUMN IF NOT EXISTS assigned_by UUID
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
