-- Sourcing is an unlimited prospecting activity, never partner activation.
CREATE TABLE IF NOT EXISTS public.bib_sourcing_missions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 pole text NOT NULL CHECK(pole IN ('supplier','ops')),
 purpose text NOT NULL CHECK(purpose IN ('proactive','merchant_request','substitution')),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 5 AND 180),
 requirements text NOT NULL CHECK(length(btrim(requirements)) BETWEEN 10 AND 5000),
 merchant_reference text,
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
 SELECT m.* INTO m FROM public.bib_sourcing_missions m JOIN public.bib_sourcing_candidates c
 ON c.mission_id=m.id WHERE c.id=p_candidate FOR UPDATE OF m;
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
