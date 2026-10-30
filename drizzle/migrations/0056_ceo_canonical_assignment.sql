-- Canonicalise the one confirmed existing CEO assignment. No new
-- employee or privileged role is created; preserves the original audit trail.
-- Safe to re-run: if the legacy assignment was already migrated, no write.
DO $migration$
DECLARE
  v_legacy_role uuid;
  v_ceo_role uuid;
  v_assignment record;
  v_legacy_count integer;
  v_canonical_count integer;
  v_global_scope uuid;
BEGIN
  SELECT id INTO STRICT v_legacy_role FROM public.access_roles
   WHERE role_key='cei' AND label='CEO' AND status='active';
  SELECT id INTO STRICT v_ceo_role FROM public.access_roles
   WHERE role_key='ceo' AND label='CEO' AND status='active'
     AND coalesce(read_only,false)=false;
  SELECT id INTO STRICT v_global_scope FROM public.access_scopes
   WHERE scope_key='global';

  SELECT count(*) INTO v_legacy_count
    FROM public.access_assignments aa
    JOIN public.profiles p ON p.id=aa.employee_id
    WHERE aa.role_id=v_legacy_role AND aa.status='active'
      AND p.position='ceo' AND p.hr_status='active'
      AND p.app_origin='connect' AND p.test_account IS FALSE;

  SELECT count(*) INTO v_canonical_count
    FROM public.access_assignments aa
    JOIN public.profiles p ON p.id=aa.employee_id
    WHERE aa.role_id=v_ceo_role AND aa.status='active'
      AND p.position='ceo' AND p.hr_status='active'
      AND p.app_origin='connect' AND p.test_account IS FALSE;

  IF v_legacy_count = 0 AND v_canonical_count = 1 THEN
    RETURN; -- Already canonicalised.
  END IF;
  IF v_legacy_count <> 1 OR v_canonical_count <> 0 THEN
    RAISE EXCEPTION 'Unexpected CEO assignment counts; migration aborted';
  END IF;

  SELECT aa.id, aa.employee_id, aa.scope_id, aa.scope_value
    INTO STRICT v_assignment
    FROM public.access_assignments aa
    JOIN public.profiles p ON p.id=aa.employee_id
    WHERE aa.role_id=v_legacy_role AND aa.status='active'
      AND p.position='ceo' AND p.hr_status='active'
      AND p.app_origin='connect' AND p.test_account IS FALSE
    FOR UPDATE OF aa;

  -- Align the catalogued CEO role with the legacy global perimeter.
  INSERT INTO public.access_role_scopes(role_id,scope_id,scope_value)
    SELECT v_ceo_role,v_global_scope,NULL
    WHERE EXISTS (
      SELECT 1 FROM public.access_role_scopes
       WHERE role_id=v_legacy_role AND scope_id=v_global_scope
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.access_role_scopes
       WHERE role_id=v_ceo_role AND scope_id=v_global_scope
    );

  UPDATE public.access_assignments
    SET role_id=v_ceo_role, scope_id=v_global_scope, scope_value=NULL, updated_at=now()
    WHERE id=v_assignment.id AND role_id=v_legacy_role AND status='active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CEO assignment changed concurrently; migration aborted';
  END IF;

  INSERT INTO public.access_change_history(
    actor_id,employee_id,role_id,assignment_id,change_type,
    previous_value,new_value,reason
  ) VALUES (
    NULL,v_assignment.employee_id,v_ceo_role,v_assignment.id,
    'ceo_role_canonicalisation',
    jsonb_build_object('role_key','cei','role_id',v_legacy_role,'scope_id',v_assignment.scope_id,'scope_value',v_assignment.scope_value),
    jsonb_build_object('role_key','ceo','role_id',v_ceo_role,'scope_id',v_global_scope,'scope_value',NULL),
    'Correction de cohérence du rôle CEO préexistant : mêmes permissions explicites, identifiant canonique, conservation des preuves.'
  );
END;
$migration$;
