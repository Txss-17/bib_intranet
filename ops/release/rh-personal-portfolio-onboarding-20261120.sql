-- HR collaborator membership: the portfolio belongs to the HR case manager,
-- not to the collaborator's destination pole. Applied to preproduction first.
-- No name/email matching: identity is the provisioned auth.users UUID.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_my_portfolio_employee_ids()
RETURNS TABLE(employee_id uuid, portfolio_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=''
AS $fn$
  SELECT DISTINCT m.entity_id, p.id
  FROM public.bib_case_portfolios p
  JOIN public.bib_case_portfolio_members m ON m.portfolio_id=p.id
  JOIN public.profiles manager ON manager.id=p.owner_id
  WHERE p.pole='rh' AND p.status='active'
    AND p.owner_id=(SELECT auth.uid())
    AND manager.app_origin='connect' AND manager.hr_status='active'
    AND manager.test_account IS FALSE
    AND m.entity_kind='employee' AND m.ended_at IS NULL;
$fn$;
REVOKE ALL ON FUNCTION public.rh_my_portfolio_employee_ids() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rh_my_portfolio_employee_ids() TO authenticated,service_role;

-- A portfolio belongs to its RH manager; CEO oversight is explicit.
CREATE OR REPLACE FUNCTION public.rh_can_read_case_portfolio(p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
 SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.bib_case_portfolios p
  WHERE p.id=p_id AND p.pole='rh'
   AND (p.owner_id=(SELECT auth.uid())
       OR public.is_canonical_bib_ceo((SELECT auth.uid())))
 );
$fn$;
REVOKE ALL ON FUNCTION public.rh_can_read_case_portfolio(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rh_can_read_case_portfolio(uuid) TO authenticated,service_role;

DROP POLICY IF EXISTS "rh_case_portfolios_owner_select" ON public.bib_case_portfolios;
CREATE POLICY "rh_case_portfolios_owner_select" ON public.bib_case_portfolios
AS RESTRICTIVE FOR SELECT TO authenticated
USING (pole<>'rh' OR public.rh_can_read_case_portfolio(id));

DROP POLICY IF EXISTS "rh_case_members_owner_select" ON public.bib_case_portfolio_members;
CREATE POLICY "rh_case_members_owner_select" ON public.bib_case_portfolio_members
AS RESTRICTIVE FOR SELECT TO authenticated
USING (NOT EXISTS(SELECT 1 FROM public.bib_case_portfolios p
    WHERE p.id=bib_case_portfolio_members.portfolio_id AND p.pole='rh')
    OR public.rh_can_read_case_portfolio(portfolio_id));

CREATE OR REPLACE FUNCTION public.rh_link_onboarded_employee_to_referent_portfolio()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_portfolio uuid; v_total integer; v_existing uuid;
BEGIN
  IF NEW.request_kind IS DISTINCT FROM 'onboarding' OR NEW.created_user_id IS NULL
     OR NEW.status NOT IN ('account_created','completed') THEN
    RETURN NEW;
  END IF;
  -- Link once when the identity is provisioned, or on completion if not
  -- previously linked. Never alter a legitimately transferred assignment.
  IF TG_OP='UPDATE' AND OLD.created_user_id IS NOT DISTINCT FROM NEW.created_user_id
    AND OLD.status='completed' THEN
    RETURN NEW;
  END IF;
  IF NEW.manager_id IS NULL THEN
    IF NEW.status='completed' THEN
      RAISE EXCEPTION 'rh_portfolio_referent_missing' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;
  SELECT count(*),min(id::text)::uuid INTO v_total,v_portfolio
  FROM public.bib_case_portfolios
  WHERE pole='rh' AND owner_id=NEW.manager_id AND status='active';

  -- One active RH portfolio per referent must be selected explicitly.
  -- Do not silently attribute a new employee to an unrelated RH manager.
  IF v_total<>1 THEN
    IF NEW.status='completed' THEN
      RAISE EXCEPTION 'rh_portfolio_required_before_completion' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.id=NEW.created_user_id AND p.app_origin='connect'
                   AND p.test_account IS FALSE) THEN
    RAISE EXCEPTION 'rh_portfolio_employee_identity_invalid' USING ERRCODE='23503';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('employee:'||NEW.created_user_id::text,0));
  -- Do not silently claim a collaborator held by another RH manager.
  SELECT m.portfolio_id INTO v_existing
  FROM public.bib_case_portfolio_members m
  WHERE m.entity_kind='employee' AND m.entity_id=NEW.created_user_id
    AND m.ended_at IS NULL;
  IF v_existing IS NOT NULL THEN
    IF NEW.status='completed' AND v_existing IS DISTINCT FROM v_portfolio THEN
      RAISE EXCEPTION 'rh_onboarding_portfolio_conflict' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;
  INSERT INTO public.bib_case_portfolio_members
  (portfolio_id,entity_kind,entity_id,assigned_by,reason)
  VALUES(v_portfolio,'employee',NEW.created_user_id,NEW.manager_id,
    'Rattachement automatique après création du compte RH — demande '||NEW.id::text);
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.rh_link_onboarded_employee_to_referent_portfolio() FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS trg_rh_link_onboarded_employee_to_portfolio ON public.hr_employee_requests;
CREATE TRIGGER trg_rh_link_onboarded_employee_to_portfolio
AFTER UPDATE OF created_user_id,status,manager_id
ON public.hr_employee_requests
FOR EACH ROW EXECUTE FUNCTION public.rh_link_onboarded_employee_to_referent_portfolio();

COMMIT;
