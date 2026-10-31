-- Scoped colleague directory for Work Projects/Processes/Validations/Escalations.
-- Membership is distinct from eligibility to be assigned to a workflow record.
-- Server-side checks prevent employee enumeration across other poles.
CREATE OR REPLACE FUNCTION public.list_work_pole_members(
  p_kind text,
  p_pole text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_poles text[];
  v_ceo boolean;
BEGIN
  IF p_kind NOT IN ('projects','processes','validations','escalations')
     OR NOT coalesce(public.can_intranet_action('work.'||p_kind,'read'),false)
     OR v_actor IS NULL THEN
    RAISE EXCEPTION 'work_directory_forbidden' USING ERRCODE='42501';
  END IF;
  SELECT p.poles::text[] INTO v_actor_poles FROM public.profiles p
   WHERE p.id=v_actor AND p.app_origin='connect' AND p.hr_status='active';
  IF NOT FOUND THEN RAISE EXCEPTION 'work_directory_forbidden' USING ERRCODE='42501'; END IF;
  v_ceo := coalesce(public.is_canonical_bib_ceo(v_actor),false);
  IF p_pole IS NOT NULL AND p_pole NOT IN (
    'direction','finance','ops','supplier','marketplace','support','marketing',
    'rh','audit','compliance','rse','product','data','security'
  ) THEN RAISE EXCEPTION 'invalid_pole' USING ERRCODE='22023'; END IF;
  IF NOT v_ceo AND (p_pole IS NULL OR NOT(p_pole=ANY(coalesce(v_actor_poles,'{}'::text[])))) THEN
    RAISE EXCEPTION 'work_directory_scope_forbidden' USING ERRCODE='42501';
  END IF;
  RETURN (
    SELECT coalesce(jsonb_agg(
      jsonb_build_object(
        'id',p.id,
        'first_name',p.first_name,
        'last_name',p.last_name,
        'poles',coalesce(p.poles::text[],'{}'::text[]),
        'eligible',(
          public.can_intranet_action_for(p.id,'work.'||p_kind,'read')
          AND public.can_intranet_action_for(p.id,'work.'||p_kind,
            CASE WHEN p_kind='validations' THEN 'validate' ELSE 'update' END)
        )
      ) ORDER BY p.first_name,p.last_name
    ),'[]'::jsonb)
    FROM public.profiles p
    WHERE p.app_origin='connect' AND p.hr_status='active'
      AND coalesce(p.test_account,false)=public.intranet_is_test_mode()
      AND (
        (v_ceo AND p_pole IS NULL)
        OR (p_pole IS NOT NULL AND p_pole=ANY(coalesce(p.poles::text[],'{}'::text[])))
      )
  );
END;
$$;
REVOKE ALL ON FUNCTION public.list_work_pole_members(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_work_pole_members(text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
