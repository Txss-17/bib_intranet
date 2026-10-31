-- Supplier dossier: transactional portfolio / employee assignment and immutable change journal.
-- Keeps the existing supplier_portfolios / portfolio_assignments entities as the source of truth.
CREATE TABLE IF NOT EXISTS public.supplier_assignment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  previous_portfolio_id uuid REFERENCES public.supplier_portfolios(id) ON DELETE SET NULL,
  portfolio_id uuid REFERENCES public.supplier_portfolios(id) ON DELETE SET NULL,
  previous_employee_id uuid,
  employee_id uuid,
  actor_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_assignment_events_supplier_date_idx
 ON public.supplier_assignment_events(supplier_id,created_at DESC);
ALTER TABLE public.supplier_assignment_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplier_assignment_events FROM PUBLIC,anon;
GRANT SELECT ON public.supplier_assignment_events TO authenticated;
CREATE POLICY supplier_assignment_events_read_20261031
 ON public.supplier_assignment_events FOR SELECT TO authenticated
 USING (coalesce(public.can_intranet_action('supplier.suppliers','read'),false));

CREATE OR REPLACE FUNCTION public.assign_validated_supplier_dossier(
 p_supplier_id uuid,p_portfolio_id uuid DEFAULT NULL,p_employee_id uuid DEFAULT NULL,p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_actor uuid:=auth.uid(); v_prior_id uuid; v_prior_portfolio uuid; v_prior_employee uuid;
 v_employee_name text:='';v_exists boolean;
BEGIN
 IF v_actor IS NULL OR NOT coalesce(public.can_intranet_action('supplier.suppliers','update'),false)
 THEN RAISE EXCEPTION 'Supplier assignment not permitted' USING ERRCODE='42501';END IF;
 IF p_supplier_id IS NULL OR (p_portfolio_id IS NULL AND p_employee_id IS NULL)
 THEN RAISE EXCEPTION 'Select a portfolio or collaborator' USING ERRCODE='22023';END IF;
 IF length(coalesce(p_reason,''))>2000
 THEN RAISE EXCEPTION 'Assignment reason is too long' USING ERRCODE='22023';END IF;
 SELECT true INTO v_exists FROM public.suppliers
  WHERE id=p_supplier_id AND status='validated';
 IF NOT coalesce(v_exists,false)
 THEN RAISE EXCEPTION 'Supplier must be validated' USING ERRCODE='23503';END IF;
 IF p_portfolio_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.supplier_portfolios WHERE id=p_portfolio_id
 ) THEN RAISE EXCEPTION 'Supplier portfolio does not exist' USING ERRCODE='23503';END IF;
 IF p_employee_id IS NOT NULL THEN
  SELECT btrim(concat_ws(' ',p.first_name,p.last_name)) INTO v_employee_name
  FROM public.profiles p WHERE p.id=p_employee_id
   AND p.app_origin='connect' AND p.hr_status='active'
   AND coalesce(p.test_account,false)=public.intranet_is_test_mode()
   AND 'supplier'=ANY(coalesce(p.poles::text[],'{}'::text[]))
   AND public.can_intranet_action_for(p.id,'supplier.suppliers','read')
   AND public.can_intranet_action_for(p.id,'supplier.suppliers','update');
  IF NOT FOUND THEN RAISE EXCEPTION 'Collaborator is not an eligible supplier team member' USING ERRCODE='42501';END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('supplier-assignment:'||p_supplier_id::text,0));
 SELECT id,portfolio_id,assigned_to_id
 INTO v_prior_id,v_prior_portfolio,v_prior_employee
 FROM public.portfolio_assignments
 WHERE supplier_id=p_supplier_id
 ORDER BY assigned_at DESC NULLS LAST,id DESC LIMIT 1 FOR UPDATE;
 IF FOUND AND v_prior_portfolio IS NOT DISTINCT FROM p_portfolio_id
   AND v_prior_employee IS NOT DISTINCT FROM p_employee_id THEN RETURN;END IF;
 IF v_prior_id IS NOT NULL THEN
  UPDATE public.portfolio_assignments SET
   portfolio_id=p_portfolio_id,assigned_to_id=p_employee_id,
   assigned_to_name=coalesce(v_employee_name,''),
   assigned_at=now()
  WHERE id=v_prior_id;
 ELSE
  INSERT INTO public.portfolio_assignments
   (supplier_id,portfolio_id,assigned_to_id,assigned_to_name,assigned_at)
  VALUES(p_supplier_id,p_portfolio_id,p_employee_id,coalesce(v_employee_name,''),now());
 END IF;
 INSERT INTO public.supplier_assignment_events
  (supplier_id,previous_portfolio_id,portfolio_id,previous_employee_id,employee_id,actor_id,reason)
 VALUES(p_supplier_id,v_prior_portfolio,p_portfolio_id,v_prior_employee,p_employee_id,v_actor,nullif(btrim(p_reason),''));
END $$;
REVOKE ALL ON FUNCTION public.assign_validated_supplier_dossier(uuid,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.assign_validated_supplier_dossier(uuid,uuid,uuid,text) TO authenticated;
NOTIFY pgrst,'reload schema';
