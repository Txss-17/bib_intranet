-- Additive expansion of the existing pole_id enum. Legacy enum labels remain
-- available for old records. Apply and commit BEFORE writing new enum values.
ALTER TYPE public.pole_id ADD VALUE IF NOT EXISTS 'marketplace';
ALTER TYPE public.pole_id ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.pole_id ADD VALUE IF NOT EXISTS 'product';
ALTER TYPE public.pole_id ADD VALUE IF NOT EXISTS 'data';
ALTER TYPE public.pole_id ADD VALUE IF NOT EXISTS 'security';
