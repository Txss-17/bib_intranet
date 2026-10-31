-- Atomic Marketplace merchant allocation with server-enforced authorization.
-- No direct merchant->customer inference: only existing merchant identities are eligible.
CREATE OR REPLACE FUNCTION public.marketplace_assign_merchant(
  p_merchant_id uuid,
  p_portfolio_id uuid,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_old uuid;
BEGIN
  IF v_actor IS NULL OR NOT (
    coalesce(public.has_role(v_actor, 'admin'::public.app_role), false)
    OR coalesce(public.can_intranet_action('marketplace.merchants', 'update'), false)
  ) THEN
    RAISE EXCEPTION 'Marketplace portfolio assignment denied' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_accounts a WHERE a.id = p_merchant_id
    AND EXISTS (SELECT 1 FROM public.shops sh WHERE sh.merchant_id=a.id)) THEN
    RAISE EXCEPTION 'Unknown merchant' USING ERRCODE = '23503';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.merchant_portfolios
                  WHERE id = p_portfolio_id AND status = 'active' AND role_scope = 'marketplace') THEN
    RAISE EXCEPTION 'Inactive or unknown Marketplace portfolio' USING ERRCODE = '23503';
  END IF;

  -- Serialize concurrent reallocations of the same merchant.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_merchant_id::text, 0));

  SELECT portfolio_id INTO v_old
    FROM public.merchant_portfolio_assignments
    WHERE merchant_id = p_merchant_id AND ended_at IS NULL
    ORDER BY assigned_at DESC LIMIT 1;
  IF v_old = p_portfolio_id THEN RETURN; END IF;

  UPDATE public.merchant_portfolio_assignments
    SET ended_at = now()
    WHERE merchant_id = p_merchant_id AND ended_at IS NULL;

  INSERT INTO public.merchant_portfolio_assignments
    (merchant_id, portfolio_id, assigned_by, reason)
  VALUES (p_merchant_id, p_portfolio_id, v_actor, NULLIF(btrim(p_reason), ''));
END;
$$;
REVOKE ALL ON FUNCTION public.marketplace_assign_merchant(uuid,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketplace_assign_merchant(uuid,uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.marketplace_create_portfolio(
  p_name text,
  p_owner_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
 v_actor uuid := auth.uid();
 v_id uuid;
BEGIN
 IF v_actor IS NULL OR NOT (
   coalesce(public.has_role(v_actor, 'admin'::public.app_role), false)
   OR coalesce(public.can_intranet_action('marketplace.merchants', 'update'), false)
 ) THEN
   RAISE EXCEPTION 'Marketplace portfolio creation denied' USING ERRCODE='42501';
 END IF;
 IF nullif(btrim(p_name),'') IS NULL OR length(btrim(p_name)) > 120 THEN
   RAISE EXCEPTION 'Portfolio name must contain 1 to 120 characters' USING ERRCODE='22023';
 END IF;
 IF p_owner_id IS NOT NULL AND NOT EXISTS (
   SELECT 1 FROM public.profiles WHERE id=p_owner_id AND test_account IS FALSE
   AND app_origin='connect' AND hr_status='active'
   AND (position='ceo' OR 'marketplace'=ANY(poles::text[]))
 ) THEN
   RAISE EXCEPTION 'Unknown collaborator' USING ERRCODE='23503';
 END IF;
 INSERT INTO public.merchant_portfolios (name,owner_id,role_scope,status,notes)
 VALUES (btrim(p_name),p_owner_id,'marketplace','active',nullif(btrim(p_notes),''))
 RETURNING id INTO v_id;
 RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.marketplace_create_portfolio(text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketplace_create_portfolio(text,uuid,text) TO authenticated;

-- Consistency constraint after historical duplicates are resolved, not automatically
-- applied here: CREATE UNIQUE INDEX ... ON merchant_portfolio_assignments(merchant_id)
-- WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS public.merchant_portfolio_owner_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 portfolio_id uuid NOT NULL REFERENCES public.merchant_portfolios(id),
 previous_owner_id uuid,
 new_owner_id uuid,
 changed_by uuid NOT NULL,
 reason text,
 changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.merchant_portfolio_owner_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.merchant_portfolio_owner_events FROM PUBLIC,anon;
GRANT SELECT ON public.merchant_portfolio_owner_events TO authenticated;
CREATE POLICY merchant_portfolio_owner_events_read
 ON public.merchant_portfolio_owner_events FOR SELECT TO authenticated
 USING (coalesce(public.can_intranet_action('marketplace.merchants','read'),false));

CREATE OR REPLACE FUNCTION public.marketplace_change_portfolio_owner(
 p_portfolio_id uuid,p_new_owner uuid,p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_old uuid;v_actor uuid:=auth.uid();
BEGIN
 IF v_actor IS NULL OR NOT coalesce(public.can_intranet_action('marketplace.merchants','update'),false) THEN
  RAISE EXCEPTION 'Marketplace portfolio transfer denied' USING ERRCODE='42501';
 END IF;
 SELECT owner_id INTO v_old FROM public.merchant_portfolios WHERE id=p_portfolio_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Portfolio not found' USING ERRCODE='23503'; END IF;
 IF p_new_owner IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.profiles WHERE id=p_new_owner AND test_account IS FALSE
  AND app_origin='connect' AND hr_status='active'
  AND (position='ceo' OR 'marketplace'=ANY(poles::text[]))
 ) THEN RAISE EXCEPTION 'Portfolio owner is not an active Marketplace colleague' USING ERRCODE='23503';END IF;
 IF v_old IS NOT DISTINCT FROM p_new_owner THEN RETURN;END IF;
 UPDATE public.merchant_portfolios SET owner_id=p_new_owner,updated_at=now() WHERE id=p_portfolio_id;
 INSERT INTO public.merchant_portfolio_owner_events
 (portfolio_id,previous_owner_id,new_owner_id,changed_by,reason)
 VALUES(p_portfolio_id,v_old,p_new_owner,v_actor,nullif(btrim(p_reason),''));
END;$$;
REVOKE ALL ON FUNCTION public.marketplace_change_portfolio_owner(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.marketplace_change_portfolio_owner(uuid,uuid,text) TO authenticated;
