-- Shared, scope-aware directory for every Intranet pole and transversal assignment UI.
-- No direct table reads by the picker: each request rechecks server permissions.
-- Never return personal email addresses, inactive or opposite-environment profiles.
CREATE OR REPLACE FUNCTION public.list_pole_collaborators(
  p_pole text,
  p_page text,
  p_action text DEFAULT 'update'
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_actor uuid:=auth.uid();
  v_actor_poles text[];
  v_ceo boolean;
BEGIN
  IF v_actor IS NULL OR p_pole IS NULL OR p_page IS NULL
     OR p_action NOT IN ('read','create','update','delete','publish','validate','administer')
     OR p_pole NOT IN ('direction','finance','ops','supplier','marketplace','support',
        'marketing','rh','audit','compliance','rse','product','data','security')
     OR NOT coalesce(public.can_intranet_action(p_page,'read'),false) THEN
    RAISE EXCEPTION 'pole_directory_forbidden' USING ERRCODE='42501';
  END IF;
  SELECT p.poles::text[] INTO v_actor_poles FROM public.profiles p
    WHERE p.id=v_actor AND p.app_origin='connect' AND p.hr_status='active'
      AND coalesce(p.test_account,false)=public.intranet_is_test_mode();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pole_directory_forbidden' USING ERRCODE='42501';
  END IF;
  v_ceo:=coalesce(public.is_canonical_bib_ceo(v_actor),false);
  -- A regular collaborator may only enumerate their own pole from the
  -- matching department or a transversal work page. Leadership cannot
  -- infer names through an unrelated module's read permission.
  IF NOT v_ceo AND (
     NOT p_pole=ANY(coalesce(v_actor_poles,'{}'::text[]))
     OR NOT (p_page LIKE p_pole||'.%' OR p_page LIKE 'work.%')
  ) THEN
    RAISE EXCEPTION 'pole_directory_scope_forbidden' USING ERRCODE='42501';
  END IF;
  RETURN (
    SELECT coalesce(jsonb_agg(
      jsonb_build_object(
        'id',p.id,
        'first_name',p.first_name,
        'last_name',p.last_name,
        'poles',coalesce(p.poles::text[],'{}'::text[]),
        'eligible',(
           public.can_intranet_action_for(p.id,p_page,'read')
           AND public.can_intranet_action_for(p.id,p_page,p_action)
        )
      ) ORDER BY p.first_name,p.last_name,p.id
    ),'[]'::jsonb)
    FROM public.profiles p
    WHERE p.app_origin='connect' AND p.hr_status='active'
      AND coalesce(p.test_account,false)=public.intranet_is_test_mode()
      AND p_pole=ANY(coalesce(p.poles::text[],'{}'::text[]))
  );
END;
$$;
REVOKE ALL ON FUNCTION public.list_pole_collaborators(text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_pole_collaborators(text,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
