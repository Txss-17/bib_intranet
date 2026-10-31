-- Close two role-boundary gaps found in the 14-pole audit.
-- Canonical CEO is identified by an active professional profile AND active CEO access role.
CREATE OR REPLACE FUNCTION public.is_canonical_bib_ceo(p_actor uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT p_actor IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.profiles p
   WHERE p.id=p_actor AND p.position='ceo' AND p.app_origin='connect'
     AND p.hr_status='active' AND p.test_account IS FALSE
     AND public.is_intranet_staff(p_actor)
     AND EXISTS (
       SELECT 1 FROM public.access_assignments aa
       JOIN public.access_roles ar ON ar.id=aa.role_id
       WHERE aa.employee_id=p_actor AND aa.status='active'
         AND ar.role_key='ceo' AND ar.status='active'
         AND (aa.starts_at IS NULL OR aa.starts_at<=now())
         AND (aa.ends_at IS NULL OR aa.ends_at>=now())
     )
 )
$$;
REVOKE ALL ON FUNCTION public.is_canonical_bib_ceo(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_canonical_bib_ceo(uuid) TO authenticated,service_role;

-- Work Tasks previously evaluated saved permissions ahead of the CEO role, so
-- a saved role cell could deny the legitimate CEO access to this transversal pole.
CREATE OR REPLACE FUNCTION public.can_work_task_action(p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); saved_count integer; saved_allow boolean; level text;
  in_scope boolean; has_active boolean; only_read_only boolean; legacy_role text;
BEGIN
  IF actor IS NULL OR p_action IS NULL OR p_action NOT IN ('read','create','update','delete')
      OR NOT coalesce(public.is_intranet_staff(actor),false)
      OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=actor AND app_origin='connect' AND hr_status='active') THEN RETURN false; END IF;
  IF public.is_canonical_bib_ceo(actor) THEN RETURN true; END IF;
  IF public.has_role(actor,'admin') THEN RETURN true; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor) THEN
    SELECT public.legacy_hr_publication_role(p.position::text,p.poles::text[]) INTO legacy_role FROM public.profiles p WHERE p.id=actor;
    IF legacy_role IS NOT NULL AND EXISTS(SELECT 1 FROM public.access_roles WHERE role_key=legacy_role)
      AND NOT EXISTS(SELECT 1 FROM public.access_roles WHERE role_key=legacy_role AND status='active') THEN RETURN false; END IF;
  END IF;
  SELECT count(*),coalesce(bool_or(ap.allowed AND ac.action_key=p_action),false)
    INTO saved_count,saved_allow
  FROM public.access_roles ar
  LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
    AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
  JOIN public.access_permissions ap ON ap.role_id=ar.id
  JOIN public.access_interfaces ai ON ai.id=ap.interface_id AND ai.interface_key='work.tasks' AND ai.status='active'
  JOIN public.access_actions ac ON ac.id=ap.action_id
  WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=legacy_role);
  IF saved_count>0 THEN RETURN saved_allow; END IF;
  SELECT count(*)>0,coalesce(bool_and(ar.read_only),false) INTO has_active,only_read_only
  FROM public.access_roles ar
  LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
    AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
  WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=legacy_role);
  IF NOT has_active AND (legacy_role IS NULL OR EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor)) THEN RETURN false; END IF;
  SELECT coalesce(p.seniority::text,'junior'),coalesce('rh'=ANY(p.poles),false)
    INTO level,in_scope FROM public.profiles p WHERE p.id=actor;
  IF public.is_leadership(actor) THEN level:='executive'; in_scope:=true; END IF;
  IF p_action='read' THEN RETURN true; END IF;
  IF only_read_only THEN RETURN false; END IF;
  IF p_action IN ('create','update') THEN RETURN level IN ('mid','senior','lead','executive'); END IF;
  RETURN level IN ('senior','lead','executive');
END;
$$;

-- Preserve existing permissive policies while imposing a restrictive ceiling:
-- only authorized Marketplace managers or the active portfolio owner read its data.
CREATE POLICY merchant_portfolios_read_scope_20261031
  ON public.merchant_portfolios AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    public.can_intranet_action('marketplace.merchants','update')
    OR (owner_id=auth.uid() AND public.can_intranet_action('marketplace.portfolio','read'))
  );
CREATE POLICY merchant_portfolio_assignments_read_scope_20261031
  ON public.merchant_portfolio_assignments AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_portfolios mp
      WHERE mp.id=portfolio_id AND (
        public.can_intranet_action('marketplace.merchants','update')
        OR (mp.owner_id=auth.uid() AND public.can_intranet_action('marketplace.portfolio','read'))
      )
    )
  );
NOTIFY pgrst,'reload schema';
