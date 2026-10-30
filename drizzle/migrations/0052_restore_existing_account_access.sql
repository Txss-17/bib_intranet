-- Restore existing staff identities and the original position-based matrix.
-- This is a one-time repair of trusted, database-held staff evidence. It never
-- changes Auth users, credentials, account suspensions, assignments or saved ACLs.
CREATE OR REPLACE FUNCTION public.intranet_known_legacy_position(p_position text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT coalesce($1=ANY(ARRAY['ceo','supplier_manager','customer_success_manager','ops_logistics_manager',
 'finance_manager','audit_compliance_lead','rse_impact_manager','product_engineering_manager',
 'marketing_communication_manager','rh_manager','data_bi_manager','security_it_manager']),false);
$$;
REVOKE ALL ON FUNCTION public.intranet_known_legacy_position(text)FROM PUBLIC,anon,authenticated;

CREATE TABLE public.intranet_legacy_access_repairs(
 profile_id uuid PRIMARY KEY REFERENCES public.profiles(id),reason text NOT NULL,
 before_state jsonb NOT NULL,after_state jsonb NOT NULL,repaired_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.intranet_legacy_access_repairs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.intranet_legacy_access_repairs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.intranet_legacy_access_repairs TO service_role;

-- The migration owner may be a non-superuser. Temporarily suspend only the
-- profile authorization trigger inside this single atomic statement. ALTER TABLE
-- holds its table lock until commit, so no concurrent client can use this window.
DO $repair$
BEGIN
ALTER TABLE public.profiles DISABLE TRIGGER guard_profile_authorization_fields;
WITH candidates AS MATERIALIZED(
 SELECT p.id,jsonb_build_object('app_origin',p.app_origin,'hr_status',p.hr_status,'poles',p.poles) AS before_state,
 coalesce(p.poles,ARRAY[]::public.pole_id[]) AS original_poles,assigned.poles AS assigned_poles,
 CASE WHEN p.app_origin='connect'AND p.hr_status IS NULL THEN 'existing_staff_status_default'
 WHEN p.app_origin='connect'THEN 'existing_active_internal_assignment_poles'
 WHEN public.has_role(p.id,'admin')THEN 'existing_technical_administrator'
 WHEN public.intranet_known_legacy_position(p.position::text)AND coalesce(cardinality(p.poles),0)>0 THEN 'existing_staff_position_and_poles'
 ELSE 'existing_active_internal_assignment'END AS reason
 FROM public.profiles p
 LEFT JOIN LATERAL(
  SELECT array_agg(DISTINCT pole::public.pole_id)FILTER(WHERE pole IS NOT NULL) AS poles,count(DISTINCT ar.id) AS roles
  FROM public.access_assignments aa JOIN public.access_roles ar ON ar.id=aa.role_id
  LEFT JOIN LATERAL jsonb_array_elements_text(coalesce(to_jsonb(ar)->'poles','[]'::jsonb))pole ON true
  WHERE aa.employee_id=p.id AND aa.status='active'AND ar.status='active'
   AND NOT coalesce((to_jsonb(ar)->>'is_external')::boolean,false)AND ar.role_key NOT LIKE 'ext\_%' ESCAPE '\'
   AND(aa.starts_at IS NULL OR aa.starts_at<=now())AND(aa.ends_at IS NULL OR aa.ends_at>=now())
   AND(pole IS NULL OR pole IN(SELECT unnest(enum_range(NULL::public.pole_id))::text))
 )assigned ON true
 WHERE coalesce(p.hr_status,'active')='active'
 AND((coalesce(p.app_origin,'bos')='bos'
  AND(public.has_role(p.id,'admin')
   OR(public.intranet_known_legacy_position(p.position::text)AND coalesce(cardinality(p.poles),0)>0)
   OR assigned.roles>0))
 OR(p.app_origin='connect'AND coalesce(cardinality(p.poles),0)=0 AND cardinality(assigned.poles)>0)
 OR(p.app_origin='connect'AND p.hr_status IS NULL
  AND(public.has_role(p.id,'admin')OR(public.intranet_known_legacy_position(p.position::text)AND coalesce(cardinality(p.poles),0)>0)OR assigned.roles>0)))
),repaired AS(
 UPDATE public.profiles p SET app_origin='connect',hr_status=coalesce(p.hr_status,'active'),
 poles=CASE WHEN cardinality(c.original_poles)=0 AND cardinality(c.assigned_poles)>0 THEN c.assigned_poles ELSE p.poles END
 FROM candidates c WHERE p.id=c.id RETURNING p.id,p.app_origin,p.hr_status,p.poles
)
INSERT INTO public.intranet_legacy_access_repairs(profile_id,reason,before_state,after_state)
SELECT r.id,c.reason,c.before_state,jsonb_build_object('app_origin',r.app_origin,'hr_status',r.hr_status,'poles',r.poles)
FROM repaired r JOIN candidates c ON c.id=r.id;
ALTER TABLE public.profiles ENABLE TRIGGER guard_profile_authorization_fields;
END;
$repair$;

CREATE OR REPLACE FUNCTION public.is_intranet_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=$1 AND p.app_origin='connect'AND p.hr_status='active'
 AND(public.has_role($1,'admin')OR coalesce(cardinality(p.poles),0)>0
  OR EXISTS(SELECT 1 FROM public.access_assignments aa JOIN public.access_roles ar ON ar.id=aa.role_id
   WHERE aa.employee_id=p.id AND aa.status='active'AND ar.status='active'
   AND NOT coalesce((to_jsonb(ar)->>'is_external')::boolean,false)AND ar.role_key NOT LIKE 'ext\_%' ESCAPE '\'
   AND(aa.starts_at IS NULL OR aa.starts_at<=now())AND(aa.ends_at IS NULL OR aa.ends_at>=now()))));
$$;

-- The existing Marketplace director was omitted from its own pole's restricted
-- page defaults. Saved permissions still take precedence over these defaults.
UPDATE public.intranet_modules SET definition=jsonb_set(definition,'{restrictedRoles}',
 (definition->'restrictedRoles')||'["directeur_marketplace"]'::jsonb)
WHERE page_id IN(SELECT jsonb_array_elements_text($marketplace_lead_pages$["marketplace.overview","marketplace.merchants","marketplace.portfolio","marketplace.stores","marketplace.opportunities","marketplace.analytics","marketplace.subscriptions","marketplace.products"]$marketplace_lead_pages$::jsonb))
AND NOT (definition->'restrictedRoles')?'directeur_marketplace';

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
