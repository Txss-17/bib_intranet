-- Restore CEO global page/action access while preserving protected identity.
-- Business separation-of-duties remains enforced by each workflow RPC.
CREATE OR REPLACE FUNCTION public.can_intranet_action(p_page text,p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); profile public.profiles%ROWTYPE; definition jsonb; role_keys text[]; chosen text; saved_count integer; permitted boolean; canonical_saved boolean; read_only boolean; level text; effective_poles text[];
BEGIN
 IF actor IS NULL OR p_action IS NULL OR p_action NOT IN ('read','create','update','delete','publish','validate','administer') THEN RETURN false; END IF;
 SELECT m.definition INTO definition FROM public.intranet_modules m WHERE page_id=p_page OR coalesce(m.definition->'permissionAliases','[]'::jsonb)?p_page;
 IF definition IS NULL THEN RETURN false; END IF;
 p_page:=definition->>'id';
 SELECT * INTO profile FROM public.profiles WHERE id=actor;
 IF NOT FOUND OR profile.app_origin IS DISTINCT FROM 'connect' OR profile.hr_status IS DISTINCT FROM 'active' OR NOT public.is_intranet_staff(actor) THEN RETURN false; END IF;
 -- CEO has global operational access, independently of department, saved
 -- matrix cells and current staffing; require the genuine active BIB identity
 -- and a currently active canonical CEO assignment, not a display label alone.
 IF profile.position='ceo' AND profile.test_account IS FALSE
    AND EXISTS (
      SELECT 1 FROM public.access_assignments aa
      JOIN public.access_roles ar ON ar.id=aa.role_id
      WHERE aa.employee_id=actor AND aa.status='active'
        AND ar.role_key='ceo' AND ar.status='active'
        AND (aa.starts_at IS NULL OR aa.starts_at<=now())
        AND (aa.ends_at IS NULL OR aa.ends_at>=now())
    ) THEN RETURN true; END IF;
 IF public.has_role(actor,'admin') THEN RETURN true; END IF;
 IF EXISTS(SELECT 1 FROM public.access_interfaces WHERE (interface_key=p_page OR (coalesce(definition->'permissionAliases','[]'::jsonb)?interface_key AND NOT EXISTS(SELECT 1 FROM public.access_interfaces c WHERE c.interface_key=p_page AND c.status='active'))) AND status IS DISTINCT FROM 'active') THEN RETURN false; END IF;
 SELECT coalesce(array_agg(DISTINCT ar.role_key),'{}'::text[]),coalesce(bool_and(ar.read_only),false) INTO role_keys,read_only
 FROM public.access_assignments aa JOIN public.access_roles ar ON ar.id=aa.role_id AND ar.status='active'
 WHERE aa.employee_id=actor AND aa.status='active' AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now());
 IF cardinality(role_keys)=0 THEN
  IF EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor) THEN RETURN false; END IF;
  -- The protected HR position key is more precise than the old broad enum.
  SELECT ar.role_key INTO chosen FROM public.access_roles ar
  WHERE ar.role_key=nullif(to_jsonb(profile)->>'position_key','');
  IF chosen IS NULL THEN chosen:=public.legacy_hr_publication_role(profile.position::text,profile.poles::text[]);END IF;
  -- Some original positions (notably RSE) have no job-role catalogue entry.
  -- Keep their original pole/seniority matrix without inventing a specific job.
  IF chosen IS NULL AND public.intranet_known_legacy_position(profile.position::text)
    AND coalesce(cardinality(profile.poles),0)>0 THEN chosen:=profile.position::text;END IF;
  IF chosen IS NULL THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM public.access_roles WHERE role_key=chosen AND status IS DISTINCT FROM 'active') THEN RETURN false; END IF;
  role_keys:=ARRAY[chosen];
  SELECT coalesce(bool_or(ar.read_only),false) INTO read_only FROM public.access_roles ar WHERE ar.role_key=chosen;
 END IF;
 IF read_only AND p_action<>'read'THEN RETURN false;END IF;
 SELECT EXISTS(SELECT 1 FROM public.access_permissions ap JOIN public.access_roles r ON r.id=ap.role_id AND r.status='active'
 JOIN public.access_interfaces i ON i.id=ap.interface_id AND i.interface_key=p_page AND i.status='active'WHERE r.role_key=ANY(role_keys))INTO canonical_saved;
 SELECT count(*),coalesce(bool_or(ap.allowed AND a.action_key=p_action),false) INTO saved_count,permitted
 FROM public.access_permissions ap JOIN public.access_roles r ON r.id=ap.role_id AND r.status='active'
 JOIN public.access_interfaces i ON i.id=ap.interface_id AND (i.interface_key=p_page OR (NOT canonical_saved AND coalesce(definition->'permissionAliases','[]'::jsonb)?i.interface_key)) AND i.status='active'
 JOIN public.access_actions a ON a.id=ap.action_id WHERE r.role_key=ANY(role_keys);
 IF saved_count>0 THEN RETURN permitted; END IF;
 IF coalesce((definition->>'public')::boolean,false) THEN RETURN p_action IN ('read','create'); END IF;
 effective_poles:=coalesce(profile.poles::text[],'{}');
 IF cardinality(effective_poles)=0 THEN
  SELECT coalesce(array_agg(DISTINCT pole),'{}') INTO effective_poles
  FROM public.access_assignments aa JOIN public.access_roles ar ON ar.id=aa.role_id
  CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(to_jsonb(ar)->'poles','[]'::jsonb))pole
  WHERE aa.employee_id=actor AND aa.status='active' AND ar.status='active'
    AND NOT coalesce((to_jsonb(ar)->>'is_external')::boolean,false) AND ar.role_key NOT LIKE 'ext\_%' ESCAPE '\'
    AND (aa.starts_at IS NULL OR aa.starts_at<=now())AND(aa.ends_at IS NULL OR aa.ends_at>=now());
 END IF;
 IF NOT coalesce((definition->>'transversal')::boolean,false)
  AND NOT public.intranet_poles_match(effective_poles,definition->>'scope')THEN RETURN false;END IF;
 IF jsonb_array_length(definition->'restrictedRoles')>0 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(definition->'restrictedRoles') r WHERE r=ANY(role_keys)) THEN RETURN false; END IF;
 IF definition->>'scope'='admin' AND jsonb_array_length(definition->'restrictedRoles')=0 THEN RETURN false; END IF;
 IF p_action='read' THEN RETURN true; END IF;
 IF read_only THEN RETURN false; END IF;
 level:=coalesce(profile.seniority::text,'junior');
 RETURN CASE WHEN p_action IN ('create','update') THEN level IN ('mid','senior','lead','executive')
 WHEN p_action IN ('delete','validate') THEN level IN ('senior','lead','executive')
 WHEN p_action='publish' THEN level IN ('lead','executive') ELSE level='executive' END;
END;
$$;
-- Existing signatures/ACLs are retained by CREATE OR REPLACE, including private helpers.
REVOKE ALL ON FUNCTION public.can_intranet_action(text,text),public.is_intranet_staff(uuid)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_intranet_action(text,text),public.is_intranet_staff(uuid)TO authenticated,service_role;

NOTIFY pgrst,'reload schema';
