-- Pilot capacity governance is separate from recruitment and contracts.
-- No mutation to supplier_applications/logistics_partners or any live service.
CREATE TABLE IF NOT EXISTS public.bib_pilot_partner_selections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 partner_kind text NOT NULL CHECK(partner_kind IN ('supplier','logistics')),
 partner_id uuid NOT NULL,
 platform_submission_id uuid,
 wave integer NOT NULL CHECK(wave BETWEEN 1 AND 3),
 state text NOT NULL DEFAULT 'nominated' CHECK(state IN ('nominated','approved','paused')),
 evidence_reference text,
 nominated_by uuid NOT NULL,
 approved_by uuid,
 approved_at timestamptz,
 updated_by uuid NOT NULL,
 test_account boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(partner_kind,partner_id,test_account),
 CHECK(partner_kind='logistics' OR platform_submission_id IS NULL),
 CHECK(state<>'approved' OR
  (nullif(btrim(coalesce(evidence_reference,'')),'') IS NOT NULL
   AND approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS bib_pilot_logistics_submission_unique
 ON public.bib_pilot_partner_selections(platform_submission_id,test_account)
 WHERE partner_kind='logistics' AND platform_submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bib_pilot_partner_wave_state_idx
 ON public.bib_pilot_partner_selections(test_account,wave,partner_kind,state);
CREATE TABLE IF NOT EXISTS public.bib_pilot_partner_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 selection_id uuid NOT NULL REFERENCES public.bib_pilot_partner_selections(id),
 actor_id uuid NOT NULL,
 action text NOT NULL CHECK(action IN ('nominate','approve','pause')),
 previous_state text,
 next_state text NOT NULL,
 reference text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bib_pilot_partner_events_idx
 ON public.bib_pilot_partner_events(selection_id,created_at DESC);
ALTER TABLE public.bib_pilot_partner_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_pilot_partner_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_pilot_partner_selections,public.bib_pilot_partner_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.bib_pilot_partner_selections TO authenticated;
CREATE POLICY bib_pilot_partner_read ON public.bib_pilot_partner_selections FOR SELECT TO authenticated
 USING(test_account=public.intranet_is_test_mode() AND (
   (partner_kind='supplier' AND public.can_intranet_action('supplier.suppliers','read'))
   OR (partner_kind='logistics' AND public.can_intranet_action('ops.partners','read'))
 ));
CREATE POLICY bib_pilot_partner_events_read ON public.bib_pilot_partner_events FOR SELECT TO authenticated
 USING(EXISTS (SELECT 1 FROM public.bib_pilot_partner_selections s WHERE s.id=selection_id));
GRANT SELECT ON public.bib_pilot_partner_events TO authenticated;

CREATE OR REPLACE FUNCTION public.bib_set_pilot_partner_selection(
 p_kind text, p_partner_id uuid, p_wave integer, p_action text,
 p_reference text DEFAULT NULL, p_platform_submission_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_actor uuid:=auth.uid(); v_test boolean:=public.intranet_is_test_mode();
 v_id uuid; v_previous text; v_nominator uuid;
 v_limit integer; v_active integer; v_next text;
BEGIN
 IF v_actor IS NULL OR (p_kind='supplier' AND p_platform_submission_id IS NOT NULL)
    OR p_kind NOT IN ('supplier','logistics')
    OR p_action NOT IN ('nominate','approve','pause') OR p_wave NOT BETWEEN 1 AND 3
    OR p_partner_id IS NULL THEN
  RAISE EXCEPTION 'invalid_pilot_selection' USING ERRCODE='22023';
 END IF;
 IF NOT ((p_kind='supplier' AND public.can_intranet_action('supplier.suppliers','update'))
      OR (p_kind='logistics' AND public.can_intranet_action('ops.partners','update'))) THEN
  RAISE EXCEPTION 'pilot_selection_not_authorized' USING ERRCODE='42501';
 END IF;
 -- The portfolio is intentionally unlimited. Only approval consumes capacity.
 PERFORM pg_advisory_xact_lock(hashtext('bib_pilot_wave_'||v_test::text||'_'||p_wave::text||'_'||p_kind));
 -- Use the canonical operational supplier UUID, never a candidature UUID.
 -- Platform bridge imports partner onboarding into public.suppliers(platform_id).
 IF p_kind='supplier' AND NOT EXISTS(
   SELECT 1 FROM public.suppliers
   WHERE id=p_partner_id AND status='validated'
     AND coalesce(test_account,false)=v_test
 ) THEN
  RAISE EXCEPTION 'canonical_supplier_must_be_validated' USING ERRCODE='23514';
 END IF;
 IF p_kind='logistics' AND NOT EXISTS(SELECT 1 FROM public.logistics_partners WHERE id=p_partner_id AND status='active') THEN
  RAISE EXCEPTION 'logistics_partner_unavailable' USING ERRCODE='23514';
 END IF;
 SELECT id,state,nominated_by INTO v_id,v_previous,v_nominator
 FROM public.bib_pilot_partner_selections
 WHERE partner_kind=p_kind AND partner_id=p_partner_id AND test_account=v_test FOR UPDATE;
 IF p_action='nominate' THEN
  IF v_id IS NOT NULL AND v_previous='approved' THEN
   RAISE EXCEPTION 'pause_approved_selection_before_changing_wave' USING ERRCODE='23514';
  END IF;
  INSERT INTO public.bib_pilot_partner_selections(
   partner_kind,partner_id,platform_submission_id,wave,state,nominated_by,updated_by,test_account)
  VALUES(p_kind,p_partner_id,p_platform_submission_id,p_wave,'nominated',v_actor,v_actor,v_test)
  ON CONFLICT(partner_kind,partner_id,test_account) DO UPDATE
   SET wave=excluded.wave,platform_submission_id=excluded.platform_submission_id,
       state='nominated',approved_by=NULL,approved_at=NULL,
       evidence_reference=NULL,nominated_by=excluded.nominated_by,updated_by=v_actor,updated_at=now()
  RETURNING id INTO v_id;
  v_next:='nominated';
 ELSIF p_action='approve' THEN
  IF v_id IS NULL OR v_previous<>'nominated' OR v_nominator=v_actor THEN
   RAISE EXCEPTION 'independent_review_required' USING ERRCODE='23514';
  END IF;
  IF p_wave<>(SELECT wave FROM public.bib_pilot_partner_selections WHERE id=v_id)
    OR (p_kind='logistics' AND (SELECT platform_submission_id FROM public.bib_pilot_partner_selections WHERE id=v_id) IS NULL)
    OR length(btrim(coalesce(p_reference,''))) NOT BETWEEN 8 AND 500 THEN
   RAISE EXCEPTION 'approval_evidence_required' USING ERRCODE='23514';
  END IF;
  v_limit:=CASE WHEN p_kind='supplier' THEN CASE p_wave WHEN 1 THEN 2 WHEN 2 THEN 4 ELSE 8 END
                 ELSE CASE p_wave WHEN 1 THEN 1 WHEN 2 THEN 2 ELSE 3 END END;
  SELECT count(*) INTO v_active FROM public.bib_pilot_partner_selections
    WHERE test_account=v_test AND wave=p_wave AND partner_kind=p_kind AND state='approved';
  IF v_active>=v_limit THEN
   RAISE EXCEPTION 'pilot_wave_capacity_exceeded' USING ERRCODE='23514';
  END IF;
  UPDATE public.bib_pilot_partner_selections SET state='approved',
    evidence_reference=btrim(p_reference),approved_by=v_actor,approved_at=now(),
    updated_by=v_actor,updated_at=now() WHERE id=v_id;
  v_next:='approved';
 ELSE
  IF v_id IS NULL THEN RAISE EXCEPTION 'selection_not_found' USING ERRCODE='23514'; END IF;
  UPDATE public.bib_pilot_partner_selections SET state='paused',
    updated_by=v_actor,updated_at=now() WHERE id=v_id;
  v_next:='paused';
 END IF;
 INSERT INTO public.bib_pilot_partner_events(selection_id,actor_id,action,previous_state,next_state,reference)
 VALUES(v_id,v_actor,p_action,v_previous,v_next,nullif(btrim(coalesce(p_reference,'')),''));
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_set_pilot_partner_selection(text,uuid,integer,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_set_pilot_partner_selection(text,uuid,integer,text,text,uuid) TO authenticated;
-- This is a tracked selection only, NEVER a direct authorization to transmit
-- payments, execute stock moves, or mutate partner live-service flags.

-- Operational bridge gate: exact Platform submission ID must have a reviewed
-- canonical logistics mapping in the real pilot register; no name-based joins.
CREATE OR REPLACE FUNCTION public.bib_pilot_logistics_assignment_allowed(p_submission uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.bib_pilot_partner_selections s
  JOIN public.logistics_partners lp ON lp.id=s.partner_id
  WHERE s.partner_kind='logistics' AND s.platform_submission_id=p_submission
    AND s.test_account=false AND s.state='approved' AND lp.status='active'
 );
$$;
REVOKE ALL ON FUNCTION public.bib_pilot_logistics_assignment_allowed(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bib_pilot_logistics_assignment_allowed(uuid) TO service_role;
