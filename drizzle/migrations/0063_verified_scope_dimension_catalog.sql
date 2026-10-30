-- Verified, explicitly curated region/portfolio membership in BIB subsidiaries.
-- No existing portfolio is assigned to a subsidiary automatically.
-- These are lookup relationships, not grants to collaborators.
CREATE TABLE IF NOT EXISTS public.access_scope_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subsidiary text NOT NULL,
  pole text NOT NULL,
  region_code text NOT NULL,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subsidiary,pole,region_code),
  CHECK (length(btrim(subsidiary)) > 0 AND length(btrim(pole)) > 0 AND length(btrim(region_code)) > 0)
);
CREATE TABLE IF NOT EXISTS public.access_scope_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subsidiary text NOT NULL,
  pole text NOT NULL,
  portfolio_id uuid NOT NULL REFERENCES public.access_business_portfolios(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subsidiary,pole,portfolio_id)
);

ALTER TABLE public.access_scope_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_scope_portfolios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.access_scope_regions,public.access_scope_portfolios FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.access_scope_regions,public.access_scope_portfolios TO authenticated;
CREATE POLICY access_scope_regions_admin_read ON public.access_scope_regions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY access_scope_portfolios_admin_read ON public.access_scope_portfolios
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.configure_verified_scope_dimension(
 p_kind text,p_subsidiary text,p_pole text,p_value text,p_reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $fn$
DECLARE
 v_actor uuid:=auth.uid();
 v_type_pole text;
 v_portfolio_status text;
BEGIN
 IF v_actor IS NULL OR NOT public.has_role(v_actor,'admin'::public.app_role) THEN
   RAISE EXCEPTION 'Technical administrator required' USING ERRCODE='42501';
 END IF;
 IF p_kind NOT IN ('region','portfolio') OR length(trim(coalesce(p_reason,'')))<8
    OR nullif(trim(coalesce(p_value,'')),'') IS NULL THEN
   RAISE EXCEPTION 'Invalid catalog update request' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS (
   SELECT 1 FROM public.profiles p
   WHERE p.test_account IS FALSE AND p.subsidiary=p_subsidiary
     AND p_pole=ANY(p.poles::text[])
 ) THEN
   RAISE EXCEPTION 'Subsidiary/pole relationship not verified' USING ERRCODE='22023';
 END IF;
 IF p_kind='portfolio' THEN
   SELECT apt.business_pole,abp.status
   INTO v_type_pole,v_portfolio_status
   FROM public.access_business_portfolios abp
   JOIN public.access_portfolio_types apt ON apt.id=abp.portfolio_type_id
   WHERE abp.id=p_value::uuid AND apt.status='active';
   IF v_portfolio_status IS DISTINCT FROM 'active' OR v_type_pole IS DISTINCT FROM p_pole THEN
     RAISE EXCEPTION 'Portfolio is not active or does not belong to the selected pole' USING ERRCODE='22023';
   END IF;
   INSERT INTO public.access_scope_portfolios(subsidiary,pole,portfolio_id,created_by)
     VALUES (p_subsidiary,p_pole,p_value::uuid,v_actor)
     ON CONFLICT(subsidiary,pole,portfolio_id) DO UPDATE SET status='active';
 ELSE
   INSERT INTO public.access_scope_regions(subsidiary,pole,region_code,label,created_by)
     VALUES(p_subsidiary,p_pole,btrim(p_value),btrim(p_value),v_actor)
     ON CONFLICT(subsidiary,pole,region_code) DO UPDATE SET status='active';
 END IF;
 INSERT INTO public.access_change_history(actor_id,change_type,new_value,reason)
 VALUES(v_actor,'verified_scope_dimension',
  jsonb_build_object('kind',p_kind,'subsidiary',p_subsidiary,'pole',p_pole,'value',p_value),
  btrim(p_reason));
END;
$fn$;
REVOKE ALL ON FUNCTION public.configure_verified_scope_dimension(text,text,text,text,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.configure_verified_scope_dimension(text,text,text,text,text)
 TO authenticated;

-- Replace the temporary lock: allow dimensions only when a verified mapping exists.
ALTER TABLE public.access_role_scope_policy_drafts DROP CONSTRAINT IF EXISTS hierarchical_policy_unmapped_dimensions_empty;
CREATE OR REPLACE FUNCTION public.save_hierarchical_scope_policy_draft(
 p_role_id uuid,p_policy jsonb,p_reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $fn$
DECLARE
 v_actor uuid:=auth.uid();
 v_old jsonb;
 v_entity text;
 v_pole text;
 v_region text;
 v_portfolio text;
 v_dimension text;
 v_values jsonb;
 v_poles text[];
BEGIN
 IF v_actor IS NULL OR NOT public.has_role(v_actor,'admin'::public.app_role) THEN
   RAISE EXCEPTION 'Technical administrator required' USING ERRCODE='42501';
 END IF;
 IF length(btrim(coalesce(p_reason,'')))<8 OR p_policy IS NULL OR jsonb_typeof(p_policy)<>'object'
    OR NOT EXISTS(SELECT 1 FROM public.access_roles WHERE id=p_role_id AND status='active') THEN
   RAISE EXCEPTION 'Invalid policy or role' USING ERRCODE='22023';
 END IF;
 IF jsonb_typeof(p_policy->'ownRecords') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(p_policy->'subsidiaries') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_policy->'poles') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_policy->'regions') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_policy->'portfolios') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_policy->'subsidiaries') NOT BETWEEN 1 AND 20 THEN
   RAISE EXCEPTION 'Invalid hierarchical policy dimensions' USING ERRCODE='22023';
 END IF;
 FOREACH v_dimension IN ARRAY ARRAY['subsidiaries','poles','regions','portfolios'] LOOP
   v_values:=p_policy->v_dimension;
   IF jsonb_array_length(v_values)>100 OR EXISTS(
     SELECT 1 FROM jsonb_array_elements(v_values) x(v)
       WHERE jsonb_typeof(x.v)<>'string' OR length(btrim(x.v#>>'{}'))=0
   ) OR (SELECT count(*) FROM jsonb_array_elements_text(v_values)) <>
       (SELECT count(DISTINCT value) FROM jsonb_array_elements_text(v_values) AS value) THEN
     RAISE EXCEPTION 'Invalid values for %',v_dimension USING ERRCODE='22023';
   END IF;
 END LOOP;
 FOR v_entity IN SELECT jsonb_array_elements_text(p_policy->'subsidiaries') LOOP
   IF NOT EXISTS(SELECT 1 FROM public.profiles p
                 WHERE p.subsidiary=v_entity AND p.test_account IS FALSE) THEN
     RAISE EXCEPTION 'Unverified subsidiary %',v_entity USING ERRCODE='22023';
   END IF;
   IF jsonb_array_length(p_policy->'poles')=0 THEN
     SELECT array_agg(DISTINCT pole) INTO v_poles FROM (
       SELECT unnest(p.poles::text[]) AS pole FROM public.profiles p
       WHERE p.subsidiary=v_entity AND p.test_account IS FALSE
     ) q;
   ELSE
     SELECT array_agg(value) INTO v_poles FROM jsonb_array_elements_text(p_policy->'poles') AS value;
   END IF;
   FOR v_pole IN SELECT unnest(coalesce(v_poles,ARRAY[]::text[])) LOOP
     IF NOT EXISTS(SELECT 1 FROM public.profiles p
       WHERE p.subsidiary=v_entity AND p.test_account IS FALSE AND v_pole=ANY(p.poles::text[])) THEN
       RAISE EXCEPTION 'Pole % outside subsidiary %',v_pole,v_entity USING ERRCODE='22023';
     END IF;
     FOR v_region IN SELECT jsonb_array_elements_text(p_policy->'regions') LOOP
       IF NOT EXISTS (SELECT 1 FROM public.access_scope_regions r
          WHERE r.subsidiary=v_entity AND r.pole=v_pole AND r.region_code=v_region AND r.status='active') THEN
         RAISE EXCEPTION 'Region not verified for subsidiary/pole' USING ERRCODE='22023';
       END IF;
     END LOOP;
     FOR v_portfolio IN SELECT jsonb_array_elements_text(p_policy->'portfolios') LOOP
       IF NOT EXISTS (SELECT 1 FROM public.access_scope_portfolios p
         JOIN public.access_business_portfolios bp ON bp.id=p.portfolio_id AND bp.status='active'
         WHERE p.subsidiary=v_entity AND p.pole=v_pole AND p.portfolio_id::text=v_portfolio AND p.status='active') THEN
         RAISE EXCEPTION 'Portfolio not verified for subsidiary/pole' USING ERRCODE='22023';
       END IF;
     END LOOP;
   END LOOP;
 END LOOP;
 SELECT policy INTO v_old FROM public.access_role_scope_policy_drafts
 WHERE role_id=p_role_id FOR UPDATE;
 INSERT INTO public.access_role_scope_policy_drafts(role_id,policy,updated_by,updated_at)
 VALUES(p_role_id,p_policy,v_actor,now())
 ON CONFLICT(role_id) DO UPDATE SET policy=excluded.policy,updated_by=v_actor,updated_at=now(),status='draft';
 INSERT INTO public.access_change_history(actor_id,role_id,change_type,previous_value,new_value,reason)
 VALUES(v_actor,p_role_id,'hierarchical_scope_draft',v_old,p_policy,btrim(p_reason));
END;
$fn$;
REVOKE ALL ON FUNCTION public.save_hierarchical_scope_policy_draft(uuid,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_hierarchical_scope_policy_draft(uuid,jsonb,text) TO authenticated;
