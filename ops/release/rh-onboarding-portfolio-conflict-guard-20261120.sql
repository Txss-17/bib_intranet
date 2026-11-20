-- Staging follow-up: reject completion in a conflicting HR portfolio.
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
