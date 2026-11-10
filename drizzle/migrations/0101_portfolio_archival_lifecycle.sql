-- 0101: portfolio life-cycle reset without destructive deletion.
-- Existing portfolio records and assignment history are kept for audit.
-- Archiving is allowed only for portfolios with zero active assignments.
-- The three independent portfolios (case, marketplace, supplier) stay distinct.

CREATE OR REPLACE FUNCTION public.bib_archive_case_portfolio(
 p_portfolio_id uuid,p_reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,pg_temp AS $$
DECLARE v_pole text;v_status text;
BEGIN
 IF auth.uid() IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 8 AND 500
 THEN RAISE EXCEPTION 'portfolio_archive_reason_required' USING ERRCODE='22023';END IF;
 SELECT pole,status INTO v_pole,v_status FROM public.bib_case_portfolios
 WHERE id=p_portfolio_id FOR UPDATE;
 IF v_pole IS NULL OR NOT public.bib_portfolio_permission(v_pole,'update')
 THEN RAISE EXCEPTION 'portfolio_archive_forbidden' USING ERRCODE='42501';END IF;
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
END;$$;
REVOKE ALL ON FUNCTION public.bib_archive_case_portfolio(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_archive_case_portfolio(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.marketplace_archive_portfolio(
 p_portfolio_id uuid,p_reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,pg_temp AS $$
DECLARE v_scope text;v_status text;v_owner uuid;
BEGIN
 IF auth.uid() IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 8 AND 500
 THEN RAISE EXCEPTION 'portfolio_archive_reason_required' USING ERRCODE='22023';END IF;
 IF NOT coalesce(public.can_intranet_action('marketplace.merchants','update'),false)
 THEN RAISE EXCEPTION 'portfolio_archive_forbidden' USING ERRCODE='42501';END IF;
 SELECT role_scope,status,owner_id INTO v_scope,v_status,v_owner
 FROM public.merchant_portfolios WHERE id=p_portfolio_id FOR UPDATE;
 IF v_scope IS DISTINCT FROM 'marketplace' OR v_status<>'active'
 THEN RAISE EXCEPTION 'marketplace_portfolio_not_active' USING ERRCODE='23514';END IF;
 IF EXISTS(SELECT 1 FROM public.merchant_portfolio_assignments
  WHERE portfolio_id=p_portfolio_id AND ended_at IS NULL)
 THEN RAISE EXCEPTION 'portfolio_has_active_assignments' USING ERRCODE='23514';END IF;
 UPDATE public.merchant_portfolios SET status='inactive',updated_at=now()
 WHERE id=p_portfolio_id;
 INSERT INTO public.merchant_portfolio_owner_events
 (portfolio_id,previous_owner_id,new_owner_id,changed_by,reason)
 VALUES(p_portfolio_id,v_owner,v_owner,auth.uid(),'Archivage : '||btrim(p_reason));
END;$$;
REVOKE ALL ON FUNCTION public.marketplace_archive_portfolio(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.marketplace_archive_portfolio(uuid,text) TO authenticated;

-- Inactive case portfolios must never accept a new owner assignment.
CREATE OR REPLACE FUNCTION public.bib_change_case_portfolio_owner(
 p_portfolio_id uuid,p_new_owner uuid,p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_pole text;v_previous uuid;v_actor uuid:=auth.uid();v_status text;
BEGIN
 SELECT pole,owner_id,status INTO v_pole,v_previous,v_status
 FROM public.bib_case_portfolios WHERE id=p_portfolio_id FOR UPDATE;
 IF v_pole IS NULL OR v_actor IS NULL OR NOT public.bib_portfolio_permission(v_pole,'update') THEN
  RAISE EXCEPTION 'Portfolio transfer denied' USING ERRCODE='42501';END IF;
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
END;$$;

CREATE OR REPLACE FUNCTION public.marketplace_change_portfolio_owner(
 p_portfolio_id uuid,p_new_owner uuid,p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_old uuid;v_actor uuid:=auth.uid();v_status text;v_scope text;
BEGIN
 IF v_actor IS NULL OR NOT coalesce(public.can_intranet_action('marketplace.merchants','update'),false) THEN
  RAISE EXCEPTION 'Marketplace portfolio transfer denied' USING ERRCODE='42501'; END IF;
 SELECT owner_id,status,role_scope INTO v_old,v_status,v_scope
 FROM public.merchant_portfolios WHERE id=p_portfolio_id FOR UPDATE;
 IF v_status IS DISTINCT FROM 'active' OR v_scope IS DISTINCT FROM 'marketplace'
 THEN RAISE EXCEPTION 'Portfolio not active' USING ERRCODE='23514';END IF;
 IF p_new_owner IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.profiles WHERE id=p_new_owner AND test_account IS FALSE
  AND app_origin='connect' AND hr_status='active'
  AND (position='ceo' OR 'marketplace'=ANY(poles::text[]))
 ) THEN RAISE EXCEPTION 'Portfolio owner is not an active Marketplace colleague' USING ERRCODE='23503';END IF;
 IF v_old IS NOT DISTINCT FROM p_new_owner THEN RETURN;END IF;
 UPDATE public.merchant_portfolios SET owner_id=p_new_owner,updated_at=now()
 WHERE id=p_portfolio_id;
 INSERT INTO public.merchant_portfolio_owner_events
 (portfolio_id,previous_owner_id,new_owner_id,changed_by,reason)
 VALUES(p_portfolio_id,v_old,p_new_owner,v_actor,nullif(btrim(p_reason),''));
END;$$;
-- Supplier uses a separate canonical registry and assignment model.
-- Add a non-destructive archive marker instead of deleting supplier links.
ALTER TABLE public.supplier_portfolios
 ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE TABLE IF NOT EXISTS public.supplier_portfolio_archive_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 portfolio_id uuid NOT NULL REFERENCES public.supplier_portfolios(id),
 actor_id uuid NOT NULL REFERENCES public.profiles(id),
 reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_portfolio_archive_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplier_portfolio_archive_events FROM PUBLIC,anon,authenticated;
CREATE POLICY supplier_portfolio_archive_events_read ON public.supplier_portfolio_archive_events
 FOR SELECT TO authenticated USING (
  coalesce(public.can_intranet_action('supplier.portfolios','read'),false)
 );

CREATE FUNCTION public.bib_archive_supplier_portfolio(
 p_portfolio_id uuid,p_reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $
DECLARE v_id uuid;
BEGIN
 IF auth.uid() IS NULL
 OR NOT coalesce(public.can_intranet_action('supplier.portfolios','update'),false)
 THEN RAISE EXCEPTION 'supplier_portfolio_archive_forbidden' USING ERRCODE='42501';END IF;
 IF length(btrim(coalesce(p_reason,''))) NOT BETWEEN 8 AND 500
 THEN RAISE EXCEPTION 'portfolio_archive_reason_required' USING ERRCODE='22023';END IF;
 SELECT id INTO v_id FROM public.supplier_portfolios
 WHERE id=p_portfolio_id AND archived_at IS NULL FOR UPDATE;
 IF v_id IS NULL THEN RAISE EXCEPTION 'supplier_portfolio_not_active' USING ERRCODE='23514';END IF;
 IF EXISTS(SELECT 1 FROM public.portfolio_assignments WHERE portfolio_id=p_portfolio_id)
 THEN RAISE EXCEPTION 'portfolio_has_active_assignments' USING ERRCODE='23514';END IF;
 UPDATE public.supplier_portfolios SET archived_at=now() WHERE id=p_portfolio_id;
 INSERT INTO public.supplier_portfolio_archive_events(portfolio_id,actor_id,reason)
 VALUES(p_portfolio_id,auth.uid(),btrim(p_reason));
END;$;
REVOKE ALL ON FUNCTION public.bib_archive_supplier_portfolio(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_archive_supplier_portfolio(uuid,text) TO authenticated;

-- All supplier assignment writes, including legacy direct table paths, must reject
-- new links to an archived supplier portfolio.
CREATE FUNCTION public.bib_guard_supplier_archive_assignment()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $
BEGIN
 IF NEW.portfolio_id IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.supplier_portfolios
  WHERE id=NEW.portfolio_id AND archived_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'supplier_portfolio_archived' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;$;
CREATE TRIGGER bib_guard_supplier_archive_assignment
 BEFORE INSERT OR UPDATE OF portfolio_id ON public.portfolio_assignments
 FOR EACH ROW EXECUTE FUNCTION public.bib_guard_supplier_archive_assignment();

NOTIFY pgrst,'reload schema';
