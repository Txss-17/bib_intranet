-- Sourcing is an unlimited prospecting activity, never partner activation.
CREATE TABLE IF NOT EXISTS public.bib_sourcing_missions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 pole text NOT NULL CHECK(pole IN ('supplier','ops')),
 purpose text NOT NULL CHECK(purpose IN ('proactive','merchant_request','substitution')),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 5 AND 180),
 requirements text NOT NULL CHECK(length(btrim(requirements)) BETWEEN 10 AND 5000),
 merchant_reference text,
 merchant_id uuid REFERENCES public.user_accounts(id),
 priority text NOT NULL DEFAULT 'standard' CHECK(priority IN ('low','standard','high','critical')),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','researching','comparing','shortlisted','closed','cancelled')),
 owner_id uuid NOT NULL,
 due_date date,
 evidence_reference text,
 test_account boolean NOT NULL DEFAULT false,
 created_by uuid NOT NULL,
 updated_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bib_sourcing_missions_search_idx ON public.bib_sourcing_missions(test_account,pole,status,priority);
CREATE TABLE IF NOT EXISTS public.bib_sourcing_candidates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 mission_id uuid NOT NULL REFERENCES public.bib_sourcing_missions(id),
 organization_name text NOT NULL CHECK(length(btrim(organization_name)) BETWEEN 2 AND 200),
 contact_reference text,
 offer_summary text NOT NULL CHECK(length(btrim(offer_summary)) BETWEEN 5 AND 3000),
 candidate_status text NOT NULL DEFAULT 'identified'
 CHECK(candidate_status IN ('identified','contacted','responded','evaluating','shortlisted','not_selected')),
 comparison_notes text,
 currency text CHECK(currency IS NULL OR currency ~ '^[A-Z]{3} uuid,
 evidence_reference text,
 created_by uuid NOT NULL,
 updated_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bib_sourcing_candidates_mission_idx ON public.bib_sourcing_candidates(mission_id,candidate_status);
ALTER TABLE public.bib_sourcing_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_sourcing_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_sourcing_missions,public.bib_sourcing_candidates FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.bib_sourcing_missions,public.bib_sourcing_candidates TO authenticated;
CREATE POLICY bib_sourcing_missions_read ON public.bib_sourcing_missions FOR SELECT TO authenticated
 USING(test_account=public.intranet_is_test_mode() AND (
   (pole='supplier' AND public.can_intranet_action('supplier.applications','read')) OR
   (pole='ops' AND public.can_intranet_action('ops.partners','read'))
 ));
CREATE POLICY bib_sourcing_candidates_read ON public.bib_sourcing_candidates FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.bib_sourcing_missions m WHERE m.id=mission_id));
CREATE OR REPLACE FUNCTION public.bib_sourcing_allowed(p_pole text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT CASE p_pole WHEN 'supplier' THEN coalesce(public.can_intranet_action('supplier.applications','update'),false)
 WHEN 'ops' THEN coalesce(public.can_intranet_action('ops.partners','update'),false) ELSE false END
$$;
REVOKE ALL ON FUNCTION public.bib_sourcing_allowed(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_sourcing_allowed(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.bib_create_sourcing_mission(
 p_pole text,p_purpose text,p_title text,p_requirements text,p_priority text,
 p_merchant_reference text DEFAULT NULL,p_due_date date DEFAULT NULL,p_merchant_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a uuid:=auth.uid(); new_id uuid;
BEGIN
 IF a IS NULL OR NOT public.bib_sourcing_allowed(p_pole)
 OR p_purpose NOT IN ('proactive','merchant_request','substitution')
 OR length(btrim(coalesce(p_title,''))) NOT BETWEEN 5 AND 180
 OR length(btrim(coalesce(p_requirements,''))) NOT BETWEEN 10 AND 5000
 OR p_priority NOT IN ('low','standard','high','critical')
 OR length(coalesce(p_merchant_reference,''))>250
 OR (p_purpose='merchant_request' AND p_merchant_id IS NULL)
 OR (p_merchant_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.user_accounts WHERE id=p_merchant_id)) THEN
 RAISE EXCEPTION 'invalid_sourcing_mission' USING ERRCODE='42501'; END IF;
 INSERT INTO public.bib_sourcing_missions(pole,purpose,title,requirements,priority,merchant_reference,
 due_date,merchant_id,owner_id,created_by,updated_by,test_account)
 VALUES(p_pole,p_purpose,btrim(p_title),btrim(p_requirements),p_priority,
 nullif(btrim(coalesce(p_merchant_reference,'')),''),p_due_date,p_merchant_id,a,a,a,public.intranet_is_test_mode())
 RETURNING id INTO new_id;
 RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_create_sourcing_mission(text,text,text,text,text,text,date,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_create_sourcing_mission(text,text,text,text,text,text,date) TO authenticated;

CREATE OR REPLACE FUNCTION public.bib_add_sourcing_candidate(
 p_mission uuid,p_name text,p_offer text,p_contact_reference text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m public.bib_sourcing_missions%ROWTYPE; a uuid:=auth.uid(); new_id uuid;
BEGIN
 SELECT * INTO m FROM public.bib_sourcing_missions WHERE id=p_mission FOR UPDATE;
 IF a IS NULL OR m.id IS NULL OR m.test_account<>public.intranet_is_test_mode()
 OR NOT public.bib_sourcing_allowed(m.pole) OR m.status IN ('closed','cancelled')
 OR length(btrim(coalesce(p_name,''))) NOT BETWEEN 2 AND 200
 OR length(btrim(coalesce(p_offer,''))) NOT BETWEEN 5 AND 3000
 OR length(coalesce(p_contact_reference,''))>500 THEN
 RAISE EXCEPTION 'invalid_sourcing_candidate' USING ERRCODE='42501'; END IF;
 INSERT INTO public.bib_sourcing_candidates(mission_id,organization_name,offer_summary,
 contact_reference,created_by,updated_by)
 VALUES(m.id,btrim(p_name),btrim(p_offer),nullif(btrim(coalesce(p_contact_reference,'')),''),a,a)
 RETURNING id INTO new_id;
 RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_add_sourcing_candidate(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_add_sourcing_candidate(uuid,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.bib_update_sourcing_review(
 p_candidate uuid,p_status text,p_comparison_notes text,p_evidence_reference text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m public.bib_sourcing_missions%ROWTYPE; a uuid:=auth.uid(); candidate_id uuid;
BEGIN
 SELECT c.id INTO candidate_id FROM public.bib_sourcing_candidates c WHERE c.id=p_candidate;
 SELECT sm.* INTO m FROM public.bib_sourcing_missions sm JOIN public.bib_sourcing_candidates c
 ON c.mission_id=sm.id WHERE c.id=p_candidate FOR UPDATE OF sm;
 IF a IS NULL OR candidate_id IS NULL OR m.test_account<>public.intranet_is_test_mode()
 OR NOT public.bib_sourcing_allowed(m.pole) OR m.status IN ('closed','cancelled')
 OR p_status NOT IN ('identified','contacted','responded','evaluating','shortlisted','not_selected')
 OR length(coalesce(p_comparison_notes,''))>5000
 OR (p_status IN ('shortlisted','not_selected') AND length(btrim(coalesce(p_evidence_reference,''))) NOT BETWEEN 8 AND 500)
 THEN RAISE EXCEPTION 'invalid_sourcing_review' USING ERRCODE='42501'; END IF;
 UPDATE public.bib_sourcing_candidates
 SET candidate_status=p_status,comparison_notes=nullif(btrim(coalesce(p_comparison_notes,'')),''),
 evidence_reference=nullif(btrim(coalesce(p_evidence_reference,'')),''),
 updated_by=a,updated_at=now() WHERE id=candidate_id;
 RETURN candidate_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_update_sourcing_review(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_update_sourcing_review(uuid,text,text,text) TO authenticated;
-- No triggers write to supplier_applications, suppliers, logistics_partners,
-- contracts, pilot selections, product catalog, orders, or payments.
),
 price_amount numeric(14,2) CHECK(price_amount IS NULL OR price_amount>=0),
 moq integer CHECK(moq IS NULL OR moq>=0),
 lead_time_days integer CHECK(lead_time_days IS NULL OR lead_time_days BETWEEN 0 AND 3650),
 sla_percent numeric(5,2) CHECK(sla_percent IS NULL OR sla_percent BETWEEN 0 AND 100),
 coverage text,
 followup_due_at timestamptz,
 converted_application_id uuid REFERENCES public.supplier_applications(id),
 partner_reference uuid,
 evidence_reference text,
 created_by uuid NOT NULL,
 updated_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bib_sourcing_candidates_mission_idx ON public.bib_sourcing_candidates(mission_id,candidate_status);
ALTER TABLE public.bib_sourcing_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_sourcing_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_sourcing_missions,public.bib_sourcing_candidates FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.bib_sourcing_missions,public.bib_sourcing_candidates TO authenticated;
CREATE POLICY bib_sourcing_missions_read ON public.bib_sourcing_missions FOR SELECT TO authenticated
 USING(test_account=public.intranet_is_test_mode() AND (
   (pole='supplier' AND public.can_intranet_action('supplier.applications','read')) OR
   (pole='ops' AND public.can_intranet_action('ops.partners','read'))
 ));
CREATE POLICY bib_sourcing_candidates_read ON public.bib_sourcing_candidates FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.bib_sourcing_missions m WHERE m.id=mission_id));
CREATE OR REPLACE FUNCTION public.bib_sourcing_allowed(p_pole text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT CASE p_pole WHEN 'supplier' THEN coalesce(public.can_intranet_action('supplier.applications','update'),false)
 WHEN 'ops' THEN coalesce(public.can_intranet_action('ops.partners','update'),false) ELSE false END
$$;
REVOKE ALL ON FUNCTION public.bib_sourcing_allowed(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_sourcing_allowed(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.bib_create_sourcing_mission(
 p_pole text,p_purpose text,p_title text,p_requirements text,p_priority text,
 p_merchant_reference text DEFAULT NULL,p_due_date date DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a uuid:=auth.uid(); new_id uuid;
BEGIN
 IF a IS NULL OR NOT public.bib_sourcing_allowed(p_pole)
 OR p_purpose NOT IN ('proactive','merchant_request','substitution')
 OR length(btrim(coalesce(p_title,''))) NOT BETWEEN 5 AND 180
 OR length(btrim(coalesce(p_requirements,''))) NOT BETWEEN 10 AND 5000
 OR p_priority NOT IN ('low','standard','high','critical')
 OR length(coalesce(p_merchant_reference,''))>250 THEN
 RAISE EXCEPTION 'invalid_sourcing_mission' USING ERRCODE='42501'; END IF;
 INSERT INTO public.bib_sourcing_missions(pole,purpose,title,requirements,priority,merchant_reference,
 due_date,owner_id,created_by,updated_by,test_account)
 VALUES(p_pole,p_purpose,btrim(p_title),btrim(p_requirements),p_priority,
 nullif(btrim(coalesce(p_merchant_reference,'')),''),p_due_date,a,a,a,public.intranet_is_test_mode())
 RETURNING id INTO new_id;
 RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_create_sourcing_mission(text,text,text,text,text,text,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_create_sourcing_mission(text,text,text,text,text,text,date) TO authenticated;

CREATE OR REPLACE FUNCTION public.bib_add_sourcing_candidate(
 p_mission uuid,p_name text,p_offer text,p_contact_reference text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m public.bib_sourcing_missions%ROWTYPE; a uuid:=auth.uid(); new_id uuid;
BEGIN
 SELECT * INTO m FROM public.bib_sourcing_missions WHERE id=p_mission FOR UPDATE;
 IF a IS NULL OR m.id IS NULL OR m.test_account<>public.intranet_is_test_mode()
 OR NOT public.bib_sourcing_allowed(m.pole) OR m.status IN ('closed','cancelled')
 OR length(btrim(coalesce(p_name,''))) NOT BETWEEN 2 AND 200
 OR length(btrim(coalesce(p_offer,''))) NOT BETWEEN 5 AND 3000
 OR length(coalesce(p_contact_reference,''))>500 THEN
 RAISE EXCEPTION 'invalid_sourcing_candidate' USING ERRCODE='42501'; END IF;
 INSERT INTO public.bib_sourcing_candidates(mission_id,organization_name,offer_summary,
 contact_reference,created_by,updated_by)
 VALUES(m.id,btrim(p_name),btrim(p_offer),nullif(btrim(coalesce(p_contact_reference,'')),''),a,a)
 RETURNING id INTO new_id;
 RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_add_sourcing_candidate(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_add_sourcing_candidate(uuid,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.bib_update_sourcing_review(
 p_candidate uuid,p_status text,p_comparison_notes text,p_evidence_reference text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m public.bib_sourcing_missions%ROWTYPE; a uuid:=auth.uid(); candidate_id uuid;
BEGIN
 SELECT c.id INTO candidate_id FROM public.bib_sourcing_candidates c WHERE c.id=p_candidate;
 SELECT sm.* INTO m FROM public.bib_sourcing_missions sm JOIN public.bib_sourcing_candidates c
 ON c.mission_id=sm.id WHERE c.id=p_candidate FOR UPDATE OF sm;
 IF a IS NULL OR candidate_id IS NULL OR m.test_account<>public.intranet_is_test_mode()
 OR NOT public.bib_sourcing_allowed(m.pole) OR m.status IN ('closed','cancelled')
 OR p_status NOT IN ('identified','contacted','responded','evaluating','shortlisted','not_selected')
 OR length(coalesce(p_comparison_notes,''))>5000
 OR (p_status IN ('shortlisted','not_selected') AND length(btrim(coalesce(p_evidence_reference,''))) NOT BETWEEN 8 AND 500)
 THEN RAISE EXCEPTION 'invalid_sourcing_review' USING ERRCODE='42501'; END IF;
 UPDATE public.bib_sourcing_candidates
 SET candidate_status=p_status,comparison_notes=nullif(btrim(coalesce(p_comparison_notes,'')),''),
 evidence_reference=nullif(btrim(coalesce(p_evidence_reference,'')),''),
 updated_by=a,updated_at=now() WHERE id=candidate_id;
 RETURN candidate_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_update_sourcing_review(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_update_sourcing_review(uuid,text,text,text) TO authenticated;
-- No triggers write to supplier_applications, suppliers, logistics_partners,
-- contracts, pilot selections, product catalog, orders, or payments.

-- Structured offer figures support comparison without implying verified prices.
CREATE OR REPLACE FUNCTION public.bib_set_sourcing_offer_metrics(
 p_candidate uuid,p_currency text,p_price numeric,p_moq integer,
 p_lead_days integer,p_sla_percent numeric,p_coverage text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m public.bib_sourcing_missions%ROWTYPE; a uuid:=auth.uid();
BEGIN
 SELECT sm.* INTO m FROM public.bib_sourcing_missions sm
 JOIN public.bib_sourcing_candidates c ON c.mission_id=sm.id
 WHERE c.id=p_candidate FOR UPDATE OF sm;
 IF a IS NULL OR m.id IS NULL OR m.test_account<>public.intranet_is_test_mode()
 OR NOT public.bib_sourcing_allowed(m.pole) OR m.status IN ('closed','cancelled')
 OR (p_currency IS NOT NULL AND p_currency !~ '^[A-Z]{3}$')
 OR (p_price IS NOT NULL AND (p_price<0 OR p_price>1000000000000))
 OR (p_moq IS NOT NULL AND (p_moq<0 OR p_moq>100000000))
 OR (p_lead_days IS NOT NULL AND p_lead_days NOT BETWEEN 0 AND 3650)
 OR (p_sla_percent IS NOT NULL AND p_sla_percent NOT BETWEEN 0 AND 100)
 OR length(coalesce(p_coverage,''))>2000 THEN
  RAISE EXCEPTION 'invalid_sourcing_offer' USING ERRCODE='42501'; END IF;
 UPDATE public.bib_sourcing_candidates SET currency=p_currency,price_amount=p_price,moq=p_moq,
 lead_time_days=p_lead_days,sla_percent=p_sla_percent,coverage=nullif(btrim(coalesce(p_coverage,'')),''),
 updated_by=a,updated_at=now() WHERE id=p_candidate;
 RETURN p_candidate;
END $$;
REVOKE ALL ON FUNCTION public.bib_set_sourcing_offer_metrics(uuid,text,numeric,integer,integer,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_set_sourcing_offer_metrics(uuid,text,numeric,integer,integer,numeric,text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.bib_sourcing_followups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 candidate_id uuid NOT NULL REFERENCES public.bib_sourcing_candidates(id),
 due_at timestamptz NOT NULL,
 outcome text NOT NULL CHECK(outcome IN ('scheduled','contacted','responded','cancelled')),
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 5 AND 2000),
 recorded_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bib_sourcing_followups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_sourcing_followups FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.bib_sourcing_followups TO authenticated;
CREATE POLICY bib_sourcing_followups_read ON public.bib_sourcing_followups
 FOR SELECT TO authenticated USING(EXISTS(
  SELECT 1 FROM public.bib_sourcing_candidates c WHERE c.id=candidate_id
 ));
CREATE OR REPLACE FUNCTION public.bib_record_sourcing_followup(
 p_candidate uuid,p_due_at timestamptz,p_outcome text,p_note text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m public.bib_sourcing_missions%ROWTYPE; a uuid:=auth.uid(); v_id uuid;
BEGIN
 SELECT sm.* INTO m FROM public.bib_sourcing_missions sm JOIN public.bib_sourcing_candidates c
 ON c.mission_id=sm.id WHERE c.id=p_candidate FOR UPDATE OF sm;
 IF a IS NULL OR m.id IS NULL OR m.test_account<>public.intranet_is_test_mode()
 OR NOT public.bib_sourcing_allowed(m.pole) OR m.status IN ('closed','cancelled')
 OR p_due_at IS NULL OR p_outcome NOT IN ('scheduled','contacted','responded','cancelled')
 OR length(btrim(coalesce(p_note,''))) NOT BETWEEN 5 AND 2000
 THEN RAISE EXCEPTION 'invalid_sourcing_followup' USING ERRCODE='42501'; END IF;
 INSERT INTO public.bib_sourcing_followups(candidate_id,due_at,outcome,note,recorded_by)
 VALUES(p_candidate,p_due_at,p_outcome,btrim(p_note),a) RETURNING id INTO v_id;
 UPDATE public.bib_sourcing_candidates SET followup_due_at=
  CASE WHEN p_outcome='scheduled' THEN p_due_at ELSE NULL END,updated_by=a,updated_at=now()
 WHERE id=p_candidate;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_record_sourcing_followup(uuid,timestamptz,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_record_sourcing_followup(uuid,timestamptz,text,text) TO authenticated;

-- Explicit controlled conversion to a *draft application*, never to an
-- approved supplier, a signed contract, or an operational account.
CREATE OR REPLACE FUNCTION public.bib_convert_sourcing_to_supplier_application(
 p_candidate uuid,p_email text,p_evidence text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m public.bib_sourcing_missions%ROWTYPE; c public.bib_sourcing_candidates%ROWTYPE;
 a uuid:=auth.uid(); v_id uuid; normalized_email text:=lower(btrim(coalesce(p_email,'')));
BEGIN
 SELECT * INTO c FROM public.bib_sourcing_candidates WHERE id=p_candidate FOR UPDATE;
 IF c.id IS NULL THEN RAISE EXCEPTION 'sourcing_candidate_missing' USING ERRCODE='23514'; END IF;
 SELECT * INTO m FROM public.bib_sourcing_missions WHERE id=c.mission_id FOR UPDATE;
 IF a IS NULL OR public.intranet_is_test_mode() OR m.test_account IS DISTINCT FROM false OR m.pole<>'supplier'
 OR NOT public.bib_sourcing_allowed('supplier') OR c.candidate_status<>'shortlisted'
 OR length(btrim(coalesce(p_evidence,''))) NOT BETWEEN 8 AND 500
 OR normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
 THEN RAISE EXCEPTION 'sourcing_conversion_not_allowed' USING ERRCODE='42501'; END IF;
 IF c.converted_application_id IS NOT NULL THEN RETURN c.converted_application_id; END IF;
 -- Fail closed on duplicates: an existing application is reviewed manually.
 IF EXISTS(SELECT 1 FROM public.supplier_applications
  WHERE lower(contact_email)=normalized_email AND lower(company_name)=lower(c.organization_name)
 ) THEN RAISE EXCEPTION 'existing_supplier_application_requires_manual_link' USING ERRCODE='23505'; END IF;
 INSERT INTO public.supplier_applications
 (type,company_name,contact_email,category,audit_accepted,raw_payload,source,status)
 VALUES('supplier',c.organization_name,normalized_email,NULL,false,
  jsonb_build_object('origin','sourcing','mission_id',m.id,'candidate_id',c.id,
    'conversion_evidence',btrim(p_evidence)),
  'sourcing','new') RETURNING id INTO v_id;
 UPDATE public.bib_sourcing_candidates SET converted_application_id=v_id,
 updated_at=now(),updated_by=a WHERE id=c.id;
 INSERT INTO public.supplier_application_events
 (application_id,event_type,from_status,to_status,notes,performed_by,metadata)
 VALUES(v_id,'created_from_sourcing',NULL,'new','Qualification documentaire et consentements à collecter',a,
  jsonb_build_object('mission_id',m.id,'candidate_id',c.id));
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_convert_sourcing_to_supplier_application(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_convert_sourcing_to_supplier_application(uuid,text,text) TO authenticated;
