-- Controlled personnel-name correction, separate from approved RH mutations.
-- Authenticated clients have no direct UPDATE grant on public.profiles.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_correct_employee_name(
  p_employee_id uuid, p_first_name text, p_last_name text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $rh_name$
DECLARE
  actor uuid := (SELECT auth.uid());
  employee public.profiles%ROWTYPE;
  first_name_clean text := btrim(coalesce(p_first_name, ''));
  last_name_clean text := btrim(coalesce(p_last_name, ''));
BEGIN
  IF actor IS NULL OR p_employee_id IS NULL
     OR char_length(first_name_clean) NOT BETWEEN 1 AND 100
     OR char_length(last_name_clean) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'rh_name_correction_invalid'
      USING ERRCODE = '22023';
  END IF;

  IF NOT public.can_intranet_action('rh.employees','update') THEN
    RAISE EXCEPTION 'rh_name_correction_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_canonical_bib_ceo(actor)
     AND NOT EXISTS(
       SELECT 1
       FROM public.profiles manager
       JOIN public.bib_case_portfolios portfolio
         ON portfolio.owner_id = manager.id
       JOIN public.bib_case_portfolio_members member
         ON member.portfolio_id = portfolio.id
       WHERE manager.id = actor
         AND manager.app_origin = 'connect'
         AND manager.hr_status = 'active'
         AND manager.test_account IS FALSE
         AND 'rh' = ANY(manager.poles::text[])
         AND portfolio.pole = 'rh'
         AND portfolio.status = 'active'
         AND member.entity_kind = 'employee'
         AND member.entity_id = p_employee_id
         AND member.ended_at IS NULL
     ) THEN
    RAISE EXCEPTION 'rh_name_correction_outside_portfolio'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO employee
  FROM public.profiles
  WHERE id = p_employee_id
  FOR UPDATE;

  IF NOT FOUND OR employee.app_origin <> 'connect'
     OR employee.test_account IS DISTINCT FROM FALSE THEN
    RAISE EXCEPTION 'rh_name_correction_employee_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF employee.first_name IS DISTINCT FROM first_name_clean
     OR employee.last_name IS DISTINCT FROM last_name_clean THEN
    UPDATE public.profiles SET
      first_name = first_name_clean,
      last_name = last_name_clean
    WHERE id = employee.id;

    INSERT INTO public.hr_record_events(
      table_name, record_id, action, old_value, new_value, performed_by
    ) VALUES (
      'profiles', employee.id, 'name_corrected',
      jsonb_build_object('first_name', employee.first_name, 'last_name', employee.last_name),
      jsonb_build_object('first_name', first_name_clean, 'last_name', last_name_clean),
      actor
    );
  END IF;

  RETURN jsonb_build_object(
    'id', employee.id,
    'first_name', first_name_clean,
    'last_name', last_name_clean
  );
END;
$rh_name$;

REVOKE ALL ON FUNCTION public.rh_correct_employee_name(uuid,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rh_correct_employee_name(uuid,text,text)
  TO authenticated, service_role;

COMMIT;
