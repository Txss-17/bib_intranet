-- Restrict RH case portfolio writes to their registered owner (or canonical CEO).
-- Other poles retain their existing behavior and permission checks.
BEGIN;
CREATE OR REPLACE FUNCTION public.bib_assign_case_entity(p_portfolio_id uuid, p_kind text, p_entity_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_pole text; v_actor uuid:=auth.uid(); v_prior uuid;
BEGIN
 SELECT pole INTO v_pole FROM public.bib_case_portfolios
 WHERE id=p_portfolio_id AND status='active';
 IF v_pole IS NULL OR v_actor IS NULL OR NOT public.bib_portfolio_permission(v_pole,'update') THEN
  RAISE EXCEPTION 'Portfolio assignment not authorized' USING ERRCODE='42501';
 END IF;
 IF v_pole='rh' AND NOT EXISTS(
   SELECT 1 FROM public.bib_case_portfolios p
   WHERE p.id=p_portfolio_id AND (p.owner_id=v_actor OR public.is_canonical_bib_ceo(v_actor))
 ) THEN RAISE EXCEPTION 'rh_portfolio_not_owned_by_actor' USING ERRCODE='42501'; END IF;
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
 IF v_pole='rh' AND v_prior IS NOT NULL AND v_prior IS DISTINCT FROM p_portfolio_id
    AND NOT public.is_canonical_bib_ceo(v_actor)
    AND NOT EXISTS (SELECT 1 FROM public.bib_case_portfolios previous
      WHERE previous.id=v_prior AND previous.owner_id=v_actor)
 THEN RAISE EXCEPTION 'rh_portfolio_cross_owner_transfer_forbidden' USING ERRCODE='42501'; END IF;
 IF v_prior=p_portfolio_id THEN RETURN;END IF;
 UPDATE public.bib_case_portfolio_members SET ended_at=now()
 WHERE entity_kind=p_kind AND entity_id=p_entity_id AND ended_at IS NULL;
 INSERT INTO public.bib_case_portfolio_members
 (portfolio_id,entity_kind,entity_id,assigned_by,reason)
 VALUES(p_portfolio_id,p_kind,p_entity_id,v_actor,nullif(btrim(p_reason),''));
END; $function$;


CREATE OR REPLACE FUNCTION public.bib_create_case_portfolio(p_pole text, p_name text, p_owner_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid; v_actor uuid:=auth.uid();
BEGIN
 IF v_actor IS NULL OR NOT public.bib_portfolio_permission(p_pole,'update') THEN
  RAISE EXCEPTION 'Portfolio creation not authorized' USING ERRCODE='42501';
 END IF;
 IF p_pole NOT IN ('marketplace','ops','rh') OR nullif(btrim(p_name),'') IS NULL
    OR length(btrim(p_name))>120 THEN
  RAISE EXCEPTION 'Invalid portfolio parameters' USING ERRCODE='22023';
 END IF;
 IF p_pole='rh' AND NOT public.is_canonical_bib_ceo(v_actor)
    AND p_owner_id IS DISTINCT FROM v_actor THEN
   RAISE EXCEPTION 'rh_portfolio_owner_must_be_actor' USING ERRCODE='42501';
 END IF;
 IF p_owner_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id=p_owner_id AND app_origin='connect' AND hr_status='active' AND test_account IS FALSE
    AND (position='ceo' OR p_pole=ANY(poles::text[]))
 ) THEN RAISE EXCEPTION 'Owner must be an active BIB employee' USING ERRCODE='23503';END IF;
 INSERT INTO public.bib_case_portfolios (pole,name,owner_id,created_by)
 VALUES (p_pole,btrim(p_name),p_owner_id,v_actor) RETURNING id INTO v_id;
 RETURN v_id;
END; $function$;


CREATE OR REPLACE FUNCTION public.bib_change_case_portfolio_owner(p_portfolio_id uuid, p_new_owner uuid, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_pole text;v_previous uuid;v_actor uuid:=auth.uid();v_status text;
BEGIN
 SELECT pole,owner_id,status INTO v_pole,v_previous,v_status
 FROM public.bib_case_portfolios WHERE id=p_portfolio_id FOR UPDATE;
 IF v_pole IS NULL OR v_actor IS NULL OR NOT public.bib_portfolio_permission(v_pole,'update') THEN
  RAISE EXCEPTION 'Portfolio transfer denied' USING ERRCODE='42501';END IF;
 IF v_pole='rh' AND v_previous IS DISTINCT FROM v_actor
    AND NOT public.is_canonical_bib_ceo(v_actor) THEN
   RAISE EXCEPTION 'rh_portfolio_transfer_owner_required' USING ERRCODE='42501'; END IF;
 IF v_status<>'active' THEN RAISE EXCEPTION 'Portfolio is archived' USING ERRCODE='23514';END IF;
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
END;$function$;


CREATE OR REPLACE FUNCTION public.bib_archive_case_portfolio(p_portfolio_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_pole text;v_status text;
BEGIN
 IF auth.uid() IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 8 AND 500
 THEN RAISE EXCEPTION 'portfolio_archive_reason_required' USING ERRCODE='22023';END IF;
 SELECT pole,status INTO v_pole,v_status FROM public.bib_case_portfolios
 WHERE id=p_portfolio_id FOR UPDATE;
 IF v_pole IS NULL OR NOT public.bib_portfolio_permission(v_pole,'update')
 THEN RAISE EXCEPTION 'portfolio_archive_forbidden' USING ERRCODE='42501';END IF;
 IF v_pole='rh' AND NOT public.is_canonical_bib_ceo(auth.uid())
    AND NOT EXISTS (SELECT 1 FROM public.bib_case_portfolios p
      WHERE p.id=p_portfolio_id AND p.owner_id=auth.uid()) THEN
   RAISE EXCEPTION 'rh_portfolio_archive_owner_required' USING ERRCODE='42501'; END IF;
 IF v_status<>'active' THEN RAISE EXCEPTION 'portfolio_not_active' USING ERRCODE='23514';END IF;
 IF EXISTS(SELECT 1 FROM public.bib_case_portfolio_members
  WHERE portfolio_id=p_portfolio_id AND ended_at IS NULL)
 THEN RAISE EXCEPTION 'portfolio_has_active_assignments' USING ERRCODE='23514';END IF;
 UPDATE public.bib_case_portfolios SET status='inactive',updated_at=now()
 WHERE id=p_portfolio_id;
 INSERT INTO public.bib_case_portfolio_owner_events
 (portfolio_id,previous_owner_id,new_owner_id,changed_by,reason)
 SELECT id,owner_id,owner_id,auth.uid(),'Archivage : '||btrim(p_reason)
 FROM public.bib_case_portfolios WHERE id=p_portfolio_id;
END;$function$;

COMMIT;
