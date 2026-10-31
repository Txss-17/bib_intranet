-- Cross-pole operational portfolios, separate from role/scope authorization catalog.
-- No impact on existing supplier_portfolios, merchant_portfolios or HR assignment tables.
CREATE TABLE IF NOT EXISTS public.bib_case_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pole text NOT NULL CHECK (pole IN ('marketplace','ops','rh')),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.bib_case_portfolio_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.bib_case_portfolios(id),
  entity_kind text NOT NULL CHECK (entity_kind IN ('customer','logistics_partner','employee')),
  entity_id uuid NOT NULL,
  assigned_by uuid,
  reason text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  CHECK (ended_at IS NULL OR ended_at >= assigned_at)
);
CREATE INDEX IF NOT EXISTS bib_case_portfolio_members_history
  ON public.bib_case_portfolio_members(entity_kind,entity_id,assigned_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS bib_case_portfolio_members_one_active
  ON public.bib_case_portfolio_members(entity_kind,entity_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS bib_case_portfolios_pole
  ON public.bib_case_portfolios(pole,owner_id);

CREATE OR REPLACE FUNCTION public.bib_portfolio_permission(p_pole text, p_action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=public,pg_temp AS $$
 SELECT CASE p_pole
   WHEN 'marketplace' THEN coalesce(public.can_intranet_action('marketplace.customers',p_action),false)
   WHEN 'ops' THEN coalesce(public.can_intranet_action('ops.partners',p_action),false)
   WHEN 'rh' THEN coalesce(public.can_intranet_action('rh.portfolio',p_action),false)
   ELSE false END
$$;
REVOKE ALL ON FUNCTION public.bib_portfolio_permission(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_portfolio_permission(text,text) TO authenticated;

ALTER TABLE public.bib_case_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_case_portfolio_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_case_portfolios, public.bib_case_portfolio_members FROM PUBLIC,anon;
GRANT SELECT ON public.bib_case_portfolios,public.bib_case_portfolio_members TO authenticated;
CREATE POLICY bib_case_portfolios_read ON public.bib_case_portfolios FOR SELECT TO authenticated
 USING (public.bib_portfolio_permission(pole,'read'));
CREATE POLICY bib_case_portfolio_members_read ON public.bib_case_portfolio_members FOR SELECT TO authenticated
 USING (EXISTS (SELECT 1 FROM public.bib_case_portfolios p
 WHERE p.id=portfolio_id AND public.bib_portfolio_permission(p.pole,'read')));

CREATE OR REPLACE FUNCTION public.bib_create_case_portfolio(
 p_pole text,p_name text,p_owner_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_actor uuid:=auth.uid();
BEGIN
 IF v_actor IS NULL OR NOT public.bib_portfolio_permission(p_pole,'update') THEN
  RAISE EXCEPTION 'Portfolio creation not authorized' USING ERRCODE='42501';
 END IF;
 IF p_pole NOT IN ('marketplace','ops','rh') OR nullif(btrim(p_name),'') IS NULL
    OR length(btrim(p_name))>120 THEN
  RAISE EXCEPTION 'Invalid portfolio parameters' USING ERRCODE='22023';
 END IF;
 IF p_owner_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id=p_owner_id AND app_origin='connect' AND hr_status='active' AND test_account IS FALSE
    AND (position='ceo' OR p_pole=ANY(poles::text[]))
 ) THEN RAISE EXCEPTION 'Owner must be an active BIB employee' USING ERRCODE='23503';END IF;
 INSERT INTO public.bib_case_portfolios (pole,name,owner_id,created_by)
 VALUES (p_pole,btrim(p_name),p_owner_id,v_actor) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.bib_assign_case_entity(
 p_portfolio_id uuid,p_kind text,p_entity_id uuid,p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_pole text; v_actor uuid:=auth.uid(); v_prior uuid;
BEGIN
 SELECT pole INTO v_pole FROM public.bib_case_portfolios
 WHERE id=p_portfolio_id AND status='active';
 IF v_pole IS NULL OR v_actor IS NULL OR NOT public.bib_portfolio_permission(v_pole,'update') THEN
  RAISE EXCEPTION 'Portfolio assignment not authorized' USING ERRCODE='42501';
 END IF;
 IF (v_pole='marketplace' AND p_kind='customer') THEN
  IF NOT EXISTS(SELECT 1 FROM public.user_accounts a
    WHERE a.id=p_entity_id AND EXISTS(SELECT 1 FROM public.orders o WHERE o.user_account_id=a.id)
      AND NOT EXISTS(SELECT 1 FROM public.shops s WHERE s.merchant_id=a.id)) THEN
    RAISE EXCEPTION 'Customer does not exist in Marketplace' USING ERRCODE='23503';
  END IF;
 ELSIF (v_pole='ops' AND p_kind='logistics_partner') THEN
  IF NOT EXISTS(SELECT 1 FROM public.logistics_partners WHERE id=p_entity_id) THEN
    RAISE EXCEPTION 'Logistics partner not found' USING ERRCODE='23503';
  END IF;
 ELSIF (v_pole='rh' AND p_kind='employee') THEN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_entity_id
      AND app_origin='connect' AND test_account IS FALSE) THEN
    RAISE EXCEPTION 'Employee not found' USING ERRCODE='23503';
  END IF;
 ELSE RAISE EXCEPTION 'Entity type is not authorized for portfolio pole' USING ERRCODE='22023';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_kind || ':' || p_entity_id::text,0));
 SELECT portfolio_id INTO v_prior FROM public.bib_case_portfolio_members
   WHERE entity_kind=p_kind AND entity_id=p_entity_id AND ended_at IS NULL
   FOR UPDATE;
 IF v_prior=p_portfolio_id THEN RETURN;END IF;
 UPDATE public.bib_case_portfolio_members SET ended_at=now()
 WHERE entity_kind=p_kind AND entity_id=p_entity_id AND ended_at IS NULL;
 INSERT INTO public.bib_case_portfolio_members
 (portfolio_id,entity_kind,entity_id,assigned_by,reason)
 VALUES(p_portfolio_id,p_kind,p_entity_id,v_actor,nullif(btrim(p_reason),''));
END; $$;
REVOKE ALL ON FUNCTION public.bib_create_case_portfolio(text,text,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.bib_assign_case_entity(uuid,text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_create_case_portfolio(text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bib_assign_case_entity(uuid,text,uuid,text) TO authenticated;

-- Reassign the responsible employee without losing ownership history.
CREATE TABLE IF NOT EXISTS public.bib_case_portfolio_owner_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 portfolio_id uuid NOT NULL REFERENCES public.bib_case_portfolios(id),
 previous_owner_id uuid,
 new_owner_id uuid,
 changed_by uuid NOT NULL,
 reason text,
 changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bib_case_portfolio_owner_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_case_portfolio_owner_events FROM PUBLIC,anon;
GRANT SELECT ON public.bib_case_portfolio_owner_events TO authenticated;
CREATE POLICY bib_case_portfolio_owner_events_read ON public.bib_case_portfolio_owner_events
 FOR SELECT TO authenticated USING (EXISTS (
 SELECT 1 FROM public.bib_case_portfolios p
 WHERE p.id=portfolio_id AND public.bib_portfolio_permission(p.pole,'read')));

CREATE OR REPLACE FUNCTION public.bib_change_case_portfolio_owner(
 p_portfolio_id uuid,p_new_owner uuid,p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_pole text;v_previous uuid;v_actor uuid:=auth.uid();
BEGIN
 SELECT pole,owner_id INTO v_pole,v_previous FROM public.bib_case_portfolios
 WHERE id=p_portfolio_id FOR UPDATE;
 IF v_pole IS NULL OR v_actor IS NULL OR NOT public.bib_portfolio_permission(v_pole,'update') THEN
  RAISE EXCEPTION 'Portfolio transfer denied' USING ERRCODE='42501';
 END IF;
 IF p_new_owner IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM public.profiles WHERE id=p_new_owner AND app_origin='connect'
 AND hr_status='active' AND test_account IS FALSE
 AND (position='ceo' OR v_pole=ANY(poles::text[]))
 ) THEN RAISE EXCEPTION 'New owner is not an eligible collaborator' USING ERRCODE='23503'; END IF;
 IF v_previous IS NOT DISTINCT FROM p_new_owner THEN RETURN; END IF;
 UPDATE public.bib_case_portfolios SET owner_id=p_new_owner,updated_at=now()
 WHERE id=p_portfolio_id;
 INSERT INTO public.bib_case_portfolio_owner_events
 (portfolio_id,previous_owner_id,new_owner_id,changed_by,reason)
 VALUES(p_portfolio_id,v_previous,p_new_owner,v_actor,nullif(btrim(p_reason),''));
END; $$;
REVOKE ALL ON FUNCTION public.bib_change_case_portfolio_owner(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_change_case_portfolio_owner(uuid,uuid,text) TO authenticated;
