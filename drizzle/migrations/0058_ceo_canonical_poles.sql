-- Existing CEO account had old pole names tech/risk/lifecycle. Align only
-- the verified canonical CEO identity to the 14 currently supported poles.
-- Preserve the original value in access_change_history for audit purposes.
DO $migration$
DECLARE
  v_ceo record;
  v_role uuid;
  v_poles text[] := ARRAY[
    'direction','finance','ops','supplier','marketplace','support',
    'marketing','rh','audit','compliance','rse','product','data','security'
  ]::text[];
BEGIN
  SELECT id INTO STRICT v_role FROM public.access_roles WHERE role_key='ceo' AND status='active';
  SELECT p.id, p.poles INTO STRICT v_ceo
    FROM public.profiles p
    JOIN public.access_assignments a ON a.employee_id=p.id AND a.role_id=v_role AND a.status='active'
    WHERE p.position='ceo' AND p.hr_status='active' AND p.test_account IS FALSE AND p.app_origin='connect'
    FOR UPDATE OF p;

  IF v_ceo.poles @> v_poles AND v_poles @> v_ceo.poles THEN RETURN; END IF;
  UPDATE public.profiles SET poles=v_poles WHERE id=v_ceo.id;
  INSERT INTO public.access_change_history(actor_id,employee_id,role_id,change_type,previous_value,new_value,reason)
  VALUES(NULL,v_ceo.id,v_role,'ceo_pole_catalogue_alignment',
    to_jsonb(v_ceo.poles),to_jsonb(v_poles),
    'Correction des pôles historiques CEO vers les quatorze pôles de BIB Intranet. Les autorisations restent définies par RBAC/RLS.');
END;
$migration$;
