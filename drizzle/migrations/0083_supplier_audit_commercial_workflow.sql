-- Sandbox isolation for supplier/catalog references: additive, real rows stay false.
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false;
-- Canonical commercial audit dossiers. A payment never admits a reference.
-- SECURITY INVOKER commands retain RLS; the write trigger also guards direct writes.
CREATE TABLE public.supplier_audit_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 supplier_id uuid NOT NULL REFERENCES public.suppliers(id), supplier_name text NOT NULL DEFAULT '',
 kind text NOT NULL CHECK(kind IN ('initial','counter_audit')), scope text[] NOT NULL,
 incident_reference text, state text NOT NULL DEFAULT 'draft'
 CHECK(state IN ('draft','preselected','contracted','in_progress','report_review','reported','decided','cancelled')),
 contract_reference text, contract_effective_on date,
 quote jsonb, quote_version integer NOT NULL DEFAULT 0, quote_hash text,
 quote_state text NOT NULL DEFAULT 'none' CHECK(quote_state IN ('none','draft','review','approved','sent','accepted')),
 quote_author uuid, quote_approved_by uuid, acceptance jsonb,
 invoice jsonb, payments jsonb NOT NULL DEFAULT '[]',
 report jsonb, report_author uuid, report_approved_by uuid, report_hash text,
 reference_decisions jsonb, reason text,
 revision integer NOT NULL DEFAULT 1, test_account boolean NOT NULL DEFAULT false,
 created_by uuid NOT NULL, creation_key uuid NOT NULL, creation_request jsonb NOT NULL,
 command_key uuid NOT NULL, command_revision integer NOT NULL DEFAULT 0,
 last_action text NOT NULL DEFAULT 'create', command_payload jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(created_by,creation_key), CHECK(cardinality(scope) BETWEEN 1 AND 100)
);
CREATE INDEX supplier_audit_cases_supplier ON public.supplier_audit_cases(supplier_id,updated_at DESC);
CREATE UNIQUE INDEX supplier_audit_invoice_unique ON public.supplier_audit_cases(test_account,lower(btrim(invoice->>'reference'))) WHERE invoice IS NOT NULL;
CREATE UNIQUE INDEX supplier_counter_audit_incident_unique ON public.supplier_audit_cases(supplier_id,incident_reference)
 WHERE kind='counter_audit' AND state<>'cancelled';
CREATE TABLE public.supplier_audit_case_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES public.supplier_audit_cases(id),
 event_order bigint GENERATED ALWAYS AS IDENTITY,
 command_key uuid NOT NULL, action text NOT NULL, request jsonb NOT NULL,
 actor_id uuid, portal_submission_id uuid, before_state jsonb, after_state jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(case_id,command_key)
);
CREATE INDEX supplier_audit_case_events_case_date ON public.supplier_audit_case_events(case_id,created_at DESC);
CREATE TABLE public.supplier_audit_portal_links (
 supplier_id uuid PRIMARY KEY REFERENCES public.suppliers(id), platform_submission_id uuid NOT NULL UNIQUE,
 evidence_reference text NOT NULL, bound_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.supplier_audit_payment_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES public.supplier_audit_cases(id),
 payment_reference text NOT NULL, test_account boolean NOT NULL, amount_cents bigint NOT NULL CHECK(amount_cents>0),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(test_account,payment_reference)
);
ALTER TABLE public.supplier_audit_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_audit_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_audit_portal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_audit_payment_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplier_audit_cases,public.supplier_audit_case_events,public.supplier_audit_portal_links,public.supplier_audit_payment_evidence FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.supplier_audit_cases TO authenticated;
GRANT SELECT ON public.supplier_audit_case_events TO authenticated;
GRANT INSERT ON public.supplier_audit_portal_links TO authenticated;
GRANT ALL ON public.supplier_audit_cases,public.supplier_audit_case_events,public.supplier_audit_portal_links,public.supplier_audit_payment_evidence TO service_role;
CREATE POLICY supplier_audit_case_read ON public.supplier_audit_cases FOR SELECT TO authenticated USING (
 test_account=public.intranet_is_test_mode() AND (
  (public.can_intranet_action('supplier.suppliers','read') AND EXISTS(SELECT 1 FROM public.suppliers s WHERE s.id=supplier_id))
  OR public.can_intranet_action('audit.supplier','read') OR public.can_intranet_action('finance.billing','read'))
);
CREATE POLICY supplier_audit_case_create ON public.supplier_audit_cases FOR INSERT TO authenticated WITH CHECK (
 created_by=auth.uid() AND test_account=public.intranet_is_test_mode()
 AND public.can_intranet_action('supplier.suppliers','create')
 AND EXISTS(SELECT 1 FROM public.suppliers s WHERE s.id=supplier_id AND coalesce(s.test_account,false)=test_account)
);
CREATE POLICY supplier_audit_case_update ON public.supplier_audit_cases FOR UPDATE TO authenticated
 USING(test_account=public.intranet_is_test_mode()) WITH CHECK(test_account=public.intranet_is_test_mode());
CREATE POLICY supplier_audit_case_event_read ON public.supplier_audit_case_events FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.supplier_audit_cases c WHERE c.id=case_id));
CREATE POLICY supplier_audit_portal_link_create ON public.supplier_audit_portal_links FOR INSERT TO authenticated WITH CHECK(
 bound_by=auth.uid() AND NOT public.intranet_is_test_mode() AND public.can_intranet_action('supplier.suppliers','validate')
 AND EXISTS(SELECT 1 FROM public.suppliers s WHERE s.id=supplier_id AND NOT coalesce(s.test_account,false))
 AND length(btrim(evidence_reference)) BETWEEN 1 AND 500
);

CREATE FUNCTION public.supplier_audit_require_text(p jsonb,k text) RETURNS text
 LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE v text:=btrim(p->>k);
BEGIN
 IF jsonb_typeof(p->k) IS DISTINCT FROM 'string' OR length(coalesce(v,'')) NOT BETWEEN 1 AND 10000 THEN
  RAISE EXCEPTION 'required_audit_field: %',k USING ERRCODE='22023'; END IF;
 RETURN v;
END; $$;

CREATE FUNCTION public.calculate_supplier_audit_quote(p jsonb) RETURNS jsonb
 LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE line jsonb; net bigint:=0; tax bigint; discount bigint; rate integer; total bigint;
BEGIN
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR
 EXISTS(SELECT 1 FROM jsonb_object_keys(p) k WHERE NOT k=ANY(ARRAY['lines','discount_cents','tax_rate_bps','tax_basis','currency','tariff_version','valid_until','payment_condition','payment_terms','scope_note','issuer_identity','recipient_identity','additional_control','supplier_attribution','ordinary_logistics_excluded']))
 OR jsonb_typeof(p->'lines') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'invalid_quote' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(p->'lines') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'invalid_quote_lines' USING ERRCODE='22023'; END IF;
 FOR line IN SELECT jsonb_array_elements(p->'lines') LOOP
  PERFORM public.supplier_audit_require_text(line,'label');
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(line) k WHERE NOT k=ANY(ARRAY['label','quantity','unit_cents']))
   OR coalesce(line->>'quantity','') !~ '^[0-9]{1,4}$' OR (line->>'quantity')::integer NOT BETWEEN 1 AND 1000
   OR coalesce(line->>'unit_cents','') !~ '^[0-9]{1,9}$' THEN RAISE EXCEPTION 'invalid_quote_line' USING ERRCODE='22023'; END IF;
  net:=net+(line->>'quantity')::bigint*(line->>'unit_cents')::bigint;
 END LOOP;
 IF coalesce(p->>'discount_cents','') !~ '^[0-9]{1,12}$' OR coalesce(p->>'tax_rate_bps','') !~ '^[0-9]{1,5}$'
  THEN RAISE EXCEPTION 'invalid_quote_tax_discount' USING ERRCODE='22023'; END IF;
 discount:=(p->>'discount_cents')::bigint; rate:=(p->>'tax_rate_bps')::integer;
 IF discount>net OR rate>10000 OR net>9000000000 OR p->>'currency' IS DISTINCT FROM 'EUR'
 OR p->>'payment_condition' IS NULL OR p->>'payment_condition' NOT IN('prepaid','after_service')
 OR coalesce(p->>'valid_until','') !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'invalid_quote_terms' USING ERRCODE='22023'; END IF;
 PERFORM (p->>'valid_until')::date;
 PERFORM public.supplier_audit_require_text(p,'tax_basis');
 PERFORM public.supplier_audit_require_text(p,'tariff_version');
 PERFORM public.supplier_audit_require_text(p,'payment_terms');
 PERFORM public.supplier_audit_require_text(p,'scope_note');
 PERFORM public.supplier_audit_require_text(p,'issuer_identity');
 PERFORM public.supplier_audit_require_text(p,'recipient_identity');
 net:=net-discount; tax:=round(net::numeric*rate/10000)::bigint; total:=net+tax;
 RETURN p||jsonb_build_object('net_cents',net,'tax_cents',tax,'total_cents',total);
END; $$;

CREATE FUNCTION public.guard_supplier_audit_case() RETURNS trigger
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); a text:=NEW.last_action; p jsonb:=NEW.command_payload;
 allowed text[]; page text; permission text:='update'; q jsonb; paid bigint; amount bigint; decision jsonb;
 supplier_row record;
BEGIN
 IF TG_OP='INSERT' THEN
  IF actor IS NULL OR NOT public.can_intranet_action('supplier.suppliers','create')
   OR NEW.created_by IS DISTINCT FROM actor OR NEW.last_action<>'create'
   OR NEW.state<>'draft' OR NEW.quote IS NOT NULL OR NEW.report IS NOT NULL OR NEW.invoice IS NOT NULL
   OR NEW.reference_decisions IS NOT NULL OR NEW.acceptance IS NOT NULL OR NEW.payments<>'[]'::jsonb
   OR NEW.contract_reference IS NOT NULL OR NEW.quote_state<>'none' OR NEW.quote_version<>0
   OR NEW.quote_approved_by IS NOT NULL OR NEW.report_approved_by IS NOT NULL
   OR NEW.quote_author IS NOT NULL OR NEW.report_author IS NOT NULL OR NEW.quote_hash IS NOT NULL
   OR NEW.report_hash IS NOT NULL OR NEW.contract_effective_on IS NOT NULL OR NEW.reason IS NOT NULL THEN
   RAISE EXCEPTION 'audit_creation_forbidden' USING ERRCODE='42501'; END IF;
  SELECT s.id,s.name,coalesce(s.test_account,false) AS test_account INTO supplier_row FROM public.suppliers s WHERE s.id=NEW.supplier_id;
  IF NOT FOUND OR supplier_row.test_account IS DISTINCT FROM public.intranet_is_test_mode() THEN RAISE EXCEPTION 'supplier_not_accessible' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(NEW.scope) s WHERE s IS NULL OR length(btrim(s)) NOT BETWEEN 1 AND 200)
   OR cardinality(NEW.scope)<>(SELECT count(DISTINCT s) FROM unnest(NEW.scope) s)
   OR (NEW.kind='counter_audit' AND length(btrim(coalesce(NEW.incident_reference,'')))=0) THEN RAISE EXCEPTION 'invalid_audit_scope' USING ERRCODE='22023'; END IF;
  NEW.supplier_name:=supplier_row.name; NEW.test_account:=supplier_row.test_account;
  NEW.revision:=1; NEW.command_revision:=0; NEW.created_at:=now(); NEW.updated_at:=now();
  RETURN NEW;
 END IF;
 IF (to_jsonb(NEW)-ARRAY['command_key','command_revision','last_action','command_payload'])
 IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['command_key','command_revision','last_action','command_payload']) THEN
  RAISE EXCEPTION 'audit_direct_write_forbidden' USING ERRCODE='42501'; END IF;
 IF NEW.command_revision IS DISTINCT FROM OLD.revision THEN RAISE EXCEPTION 'audit_revision_conflict' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR octet_length(p::text)>100000 THEN RAISE EXCEPTION 'invalid_audit_payload' USING ERRCODE='22023'; END IF;
 IF a='portal_accept' THEN
  IF auth.role() IS DISTINCT FROM 'service_role' OR NOT EXISTS(SELECT 1 FROM public.supplier_audit_portal_links l WHERE l.supplier_id=OLD.supplier_id AND l.platform_submission_id=(p->>'submission_id')::uuid)
   OR OLD.test_account THEN RAISE EXCEPTION 'audit_portal_forbidden' USING ERRCODE='42501'; END IF;
 ELSE
  page:=CASE WHEN a IN('draft_quote','submit_quote','start','submit_report','approve_report') THEN 'audit.supplier'
   WHEN a IN('approve_quote','record_invoice','record_payment') THEN 'finance.billing' ELSE 'supplier.suppliers' END;
  permission:=CASE WHEN a IN('approve_quote','approve_report','decide') THEN 'validate' ELSE 'update' END;
  IF actor IS NULL OR OLD.test_account IS DISTINCT FROM public.intranet_is_test_mode()
   OR NOT public.can_intranet_action(page,'read') OR NOT public.can_intranet_action(page,permission)
   OR (page='supplier.suppliers' AND NOT EXISTS(SELECT 1 FROM public.suppliers s WHERE s.id=OLD.supplier_id))
  THEN RAISE EXCEPTION 'audit_action_forbidden' USING ERRCODE='42501'; END IF;
 END IF;
 allowed:=CASE a
 WHEN 'preselect' THEN ARRAY['reason'] WHEN 'contract' THEN ARRAY['contract_reference','effective_on']
 WHEN 'draft_quote' THEN ARRAY['quote'] WHEN 'submit_quote' THEN ARRAY[]::text[] WHEN 'approve_quote' THEN ARRAY['reason']
 WHEN 'send_quote' THEN ARRAY[]::text[] WHEN 'record_acceptance' THEN ARRAY['signatory','evidence_reference','quote_hash']
 WHEN 'portal_accept' THEN ARRAY['submission_id','signatory','quote_hash']
 WHEN 'record_invoice' THEN ARRAY['reference','issue_date','document_reference']
 WHEN 'record_payment' THEN ARRAY['reference','paid_on','amount_cents']
 WHEN 'start' THEN ARRAY[]::text[] WHEN 'submit_report' THEN ARRAY['findings','conclusion','evidence_reference']
 WHEN 'approve_report' THEN ARRAY['reason'] WHEN 'decide' THEN ARRAY['decisions','reason']
 WHEN 'cancel' THEN ARRAY['reason'] ELSE NULL END;
 IF allowed IS NULL OR EXISTS(SELECT 1 FROM jsonb_object_keys(p) k WHERE NOT k=ANY(allowed)) THEN RAISE EXCEPTION 'unknown_audit_command_field' USING ERRCODE='22023'; END IF;
 IF OLD.state IN('decided','cancelled') AND a NOT IN('record_invoice','record_payment') THEN RAISE EXCEPTION 'audit_case_closed' USING ERRCODE='55000'; END IF;
 CASE a
 WHEN 'preselect' THEN
  IF OLD.state<>'draft' THEN RAISE EXCEPTION 'invalid_audit_transition' USING ERRCODE='22023'; END IF;
  NEW.reason:=public.supplier_audit_require_text(p,'reason'); NEW.state:='preselected';
 WHEN 'contract' THEN
  IF OLD.state<>'preselected' THEN RAISE EXCEPTION 'invalid_audit_transition' USING ERRCODE='22023'; END IF;
  NEW.contract_reference:=public.supplier_audit_require_text(p,'contract_reference');
  NEW.contract_effective_on:=public.supplier_audit_require_text(p,'effective_on')::date; NEW.state:='contracted';
 WHEN 'draft_quote' THEN
  IF OLD.state NOT IN('preselected','contracted') OR OLD.quote_state='accepted' OR OLD.invoice IS NOT NULL THEN RAISE EXCEPTION 'quote_locked' USING ERRCODE='55000'; END IF;
  q:=public.calculate_supplier_audit_quote(p->'quote');
  IF (q->>'valid_until')::date<current_date THEN RAISE EXCEPTION 'quote_expired' USING ERRCODE='22023'; END IF;
  IF OLD.kind='counter_audit' AND (q->>'payment_condition'<>'after_service'
   OR q->'ordinary_logistics_excluded' IS DISTINCT FROM 'true'::jsonb) THEN RAISE EXCEPTION 'ordinary_logistics_not_billable_as_audit' USING ERRCODE='22023'; END IF;
  IF OLD.kind='counter_audit' THEN PERFORM public.supplier_audit_require_text(q,'additional_control'); PERFORM public.supplier_audit_require_text(q,'supplier_attribution'); END IF;
  NEW.quote_version:=OLD.quote_version+1;
  NEW.quote:=q||jsonb_build_object('scope',OLD.scope,'case_id',OLD.id,'version',NEW.quote_version,'number','BIB-AUD-'||OLD.id::text||'-'||NEW.quote_version);
  NEW.quote_hash:=encode(sha256(convert_to(NEW.quote::text,'UTF8')),'hex'); NEW.quote_state:='draft';
  NEW.quote_author:=actor; NEW.quote_approved_by:=NULL; NEW.acceptance:=NULL;
 WHEN 'submit_quote' THEN
  IF OLD.quote_state<>'draft' THEN RAISE EXCEPTION 'invalid_quote_transition' USING ERRCODE='22023'; END IF; NEW.quote_state:='review';
 WHEN 'approve_quote' THEN
  IF OLD.quote_state<>'review' OR OLD.quote_author IS NOT DISTINCT FROM actor THEN RAISE EXCEPTION 'independent_finance_review_required' USING ERRCODE='42501'; END IF;
  NEW.reason:=public.supplier_audit_require_text(p,'reason'); NEW.quote_state:='approved'; NEW.quote_approved_by:=actor;
 WHEN 'send_quote' THEN
  IF OLD.quote_state<>'approved' OR (OLD.quote->>'valid_until')::date<current_date THEN RAISE EXCEPTION 'quote_not_issuable' USING ERRCODE='22023'; END IF; NEW.quote_state:='sent';
 WHEN 'record_acceptance','portal_accept' THEN
  IF OLD.quote_state<>'sent' OR p->>'quote_hash' IS DISTINCT FROM OLD.quote_hash OR (OLD.quote->>'valid_until')::date<current_date THEN RAISE EXCEPTION 'quote_not_acceptible' USING ERRCODE='40001'; END IF;
  PERFORM public.supplier_audit_require_text(p,'signatory');
  IF a='record_acceptance' THEN PERFORM public.supplier_audit_require_text(p,'evidence_reference'); END IF;
  NEW.acceptance:=p||jsonb_build_object('recorded_at',now(),'recorded_by',actor,'channel',CASE WHEN a='portal_accept' THEN 'partner_portal' ELSE 'external_evidence' END,'quote_version',OLD.quote_version);
  NEW.quote_state:='accepted';
 WHEN 'record_invoice' THEN
  IF OLD.quote_state<>'accepted' OR OLD.invoice IS NOT NULL OR OLD.state='cancelled'
   OR (OLD.kind='counter_audit' AND OLD.report_approved_by IS NULL) THEN RAISE EXCEPTION 'audit_invoice_not_allowed' USING ERRCODE='22023'; END IF;
  PERFORM public.supplier_audit_require_text(p,'reference'); PERFORM public.supplier_audit_require_text(p,'document_reference');
  IF public.supplier_audit_require_text(p,'issue_date')::date>current_date THEN RAISE EXCEPTION 'invalid_invoice_date' USING ERRCODE='22023'; END IF;
  NEW.invoice:=p||jsonb_build_object('total_cents',OLD.quote->'total_cents','currency',OLD.quote->'currency','recorded_by',actor,'recorded_at',now());
 WHEN 'record_payment' THEN
  IF OLD.invoice IS NULL OR coalesce(p->>'amount_cents','')!~'^[0-9]{1,12}$' THEN RAISE EXCEPTION 'invoice_payment_evidence_required' USING ERRCODE='22023'; END IF;
  PERFORM public.supplier_audit_require_text(p,'reference');
  IF public.supplier_audit_require_text(p,'paid_on')::date>current_date THEN RAISE EXCEPTION 'invalid_payment_date' USING ERRCODE='22023'; END IF;
  amount:=(p->>'amount_cents')::bigint;
  SELECT coalesce(sum((x->>'amount_cents')::bigint),0) INTO paid FROM jsonb_array_elements(OLD.payments) x;
  IF amount<=0 OR paid+amount>(OLD.quote->>'total_cents')::bigint OR EXISTS(SELECT 1 FROM jsonb_array_elements(OLD.payments)x WHERE x->>'reference'=p->>'reference') THEN RAISE EXCEPTION 'duplicate_or_excess_payment' USING ERRCODE='22023'; END IF;
  NEW.payments:=OLD.payments||jsonb_build_array(p||jsonb_build_object('recorded_by',actor,'recorded_at',now()));
 WHEN 'start' THEN
  IF OLD.state<>'contracted' OR OLD.contract_effective_on>current_date OR OLD.quote_state<>'accepted' THEN RAISE EXCEPTION 'audit_start_not_authorized' USING ERRCODE='22023'; END IF;
  SELECT coalesce(sum((x->>'amount_cents')::bigint),0) INTO paid FROM jsonb_array_elements(OLD.payments) x;
  IF OLD.quote->>'payment_condition'='prepaid' AND paid<(OLD.quote->>'total_cents')::bigint THEN RAISE EXCEPTION 'audit_prepayment_required' USING ERRCODE='22023'; END IF;
  NEW.state:='in_progress';
 WHEN 'submit_report' THEN
  IF OLD.state<>'in_progress' THEN RAISE EXCEPTION 'audit_not_in_progress' USING ERRCODE='22023'; END IF;
  PERFORM public.supplier_audit_require_text(p,'findings'); PERFORM public.supplier_audit_require_text(p,'conclusion'); PERFORM public.supplier_audit_require_text(p,'evidence_reference');
  NEW.report:=p||jsonb_build_object('scope',OLD.scope,'author_id',actor,'submitted_at',now()); NEW.report_author:=actor;
  NEW.report_hash:=encode(sha256(convert_to(NEW.report::text,'UTF8')),'hex'); NEW.state:='report_review';
 WHEN 'approve_report' THEN
  IF OLD.state<>'report_review' OR OLD.report IS NULL OR OLD.report_author IS NOT DISTINCT FROM actor THEN RAISE EXCEPTION 'independent_report_review_required' USING ERRCODE='42501'; END IF;
  NEW.reason:=public.supplier_audit_require_text(p,'reason'); NEW.report_approved_by:=actor; NEW.state:='reported';
 WHEN 'decide' THEN
  IF OLD.state<>'reported' OR OLD.report_approved_by IS NULL OR jsonb_typeof(p->'decisions') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'validated_report_required' USING ERRCODE='22023'; END IF;
  IF jsonb_array_length(p->'decisions')<>cardinality(OLD.scope) OR (SELECT count(DISTINCT x->>'reference')FROM jsonb_array_elements(p->'decisions')x)<>cardinality(OLD.scope) THEN RAISE EXCEPTION 'decision_scope_mismatch' USING ERRCODE='22023'; END IF;
  FOR decision IN SELECT jsonb_array_elements(p->'decisions') LOOP
   IF NOT coalesce(decision->>'reference'=ANY(OLD.scope),false) OR coalesce(decision->>'decision','') NOT IN('admitted','correction_required','refused') THEN RAISE EXCEPTION 'invalid_reference_decision' USING ERRCODE='22023'; END IF;
  END LOOP;
  NEW.reason:=public.supplier_audit_require_text(p,'reason'); NEW.reference_decisions:=p->'decisions'; NEW.state:='decided';
 WHEN 'cancel' THEN
  IF OLD.state NOT IN('draft','preselected','contracted') THEN RAISE EXCEPTION 'audit_cannot_cancel_started_service' USING ERRCODE='22023'; END IF;
  NEW.reason:=public.supplier_audit_require_text(p,'reason'); NEW.state:='cancelled';
 ELSE RAISE EXCEPTION 'unknown_audit_action' USING ERRCODE='22023';
 END CASE;
 NEW.revision:=OLD.revision+1; NEW.updated_at:=now(); RETURN NEW;
END; $$;
CREATE TRIGGER supplier_audit_case_guard BEFORE INSERT OR UPDATE ON public.supplier_audit_cases
 FOR EACH ROW EXECUTE FUNCTION public.guard_supplier_audit_case();

CREATE FUNCTION public.log_supplier_audit_case_event() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 INSERT INTO public.supplier_audit_case_events(case_id,command_key,action,request,actor_id,portal_submission_id,before_state,after_state)
 VALUES(NEW.id,NEW.command_key,NEW.last_action,NEW.command_payload,auth.uid(),CASE WHEN NEW.last_action='portal_accept' THEN (NEW.command_payload->>'submission_id')::uuid END,
  CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) END,to_jsonb(NEW));
 IF NEW.last_action='record_payment' THEN
  INSERT INTO public.supplier_audit_payment_evidence(case_id,payment_reference,test_account,amount_cents)
  VALUES(NEW.id,NEW.command_payload->>'reference',NEW.test_account,(NEW.command_payload->>'amount_cents')::bigint);
 END IF;
 RETURN NULL;
END; $$;
CREATE TRIGGER supplier_audit_case_event AFTER INSERT OR UPDATE ON public.supplier_audit_cases
 FOR EACH ROW EXECUTE FUNCTION public.log_supplier_audit_case_event();

CREATE FUNCTION public.create_supplier_audit_case(p_key uuid,p_supplier_id uuid,p_kind text,p_scope text[],p_incident_reference text DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE c public.supplier_audit_cases; request jsonb:=jsonb_build_object('supplier_id',p_supplier_id,'kind',p_kind,'scope',p_scope,'incident_reference',p_incident_reference);
BEGIN
 IF auth.uid() IS NULL OR p_key IS NULL THEN RAISE EXCEPTION 'audit_creation_forbidden' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 SELECT * INTO c FROM public.supplier_audit_cases WHERE created_by=auth.uid() AND creation_key=p_key;
 IF FOUND THEN IF c.creation_request IS DISTINCT FROM request THEN RAISE EXCEPTION 'audit_key_conflict' USING ERRCODE='40001'; END IF; RETURN to_jsonb(c); END IF;
 INSERT INTO public.supplier_audit_cases(supplier_id,kind,scope,incident_reference,created_by,creation_key,creation_request,command_key,test_account)
 VALUES(p_supplier_id,p_kind,p_scope,p_incident_reference,auth.uid(),p_key,request,p_key,public.intranet_is_test_mode()) RETURNING * INTO c;
 RETURN to_jsonb(c);
END; $$;
CREATE FUNCTION public.advance_supplier_audit_case(p_id uuid,p_revision integer,p_key uuid,p_action text,p_payload jsonb DEFAULT '{}')
 RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE event public.supplier_audit_case_events; c public.supplier_audit_cases;
BEGIN
 IF p_key IS NULL OR p_revision IS NULL THEN RAISE EXCEPTION 'invalid_audit_command' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text||p_key::text,0));
 SELECT * INTO event FROM public.supplier_audit_case_events WHERE case_id=p_id AND command_key=p_key;
 IF FOUND THEN
  IF event.action IS DISTINCT FROM p_action OR event.request IS DISTINCT FROM p_payload OR event.actor_id IS DISTINCT FROM auth.uid()
   OR (p_action='portal_accept' AND event.portal_submission_id IS DISTINCT FROM (p_payload->>'submission_id')::uuid)
  THEN RAISE EXCEPTION 'audit_key_conflict' USING ERRCODE='40001'; END IF;
  RETURN event.after_state;
 END IF;
 UPDATE public.supplier_audit_cases SET command_key=p_key,command_revision=p_revision,last_action=p_action,command_payload=p_payload
 WHERE id=p_id AND revision=p_revision RETURNING * INTO c;
 IF NOT FOUND THEN RAISE EXCEPTION 'audit_revision_or_access_conflict' USING ERRCODE='40001'; END IF;
 RETURN to_jsonb(c);
END; $$;

-- Binding is explicit, evidenced and immutable. No lookup by company/name/email.
CREATE FUNCTION public.bind_supplier_audit_portal(p_supplier_id uuid,p_submission_id uuid,p_evidence_reference text)
 RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.can_intranet_action('supplier.suppliers','validate')
 OR public.intranet_is_test_mode() OR length(btrim(coalesce(p_evidence_reference,''))) NOT BETWEEN 1 AND 500
 OR NOT EXISTS(SELECT 1 FROM public.suppliers s WHERE s.id=p_supplier_id AND NOT coalesce(s.test_account,false))
 THEN RAISE EXCEPTION 'supplier_portal_binding_forbidden' USING ERRCODE='42501'; END IF;
 INSERT INTO public.supplier_audit_portal_links VALUES(p_supplier_id,p_submission_id,p_evidence_reference,auth.uid(),now());
END; $$;
CREATE FUNCTION public.list_supplier_audit_portal(p_submission_id uuid) RETURNS jsonb
 LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'kind',c.kind,'scope',c.scope,'state',c.state,'revision',c.revision,
  'quote',CASE WHEN c.quote_state IN('sent','accepted') THEN c.quote END,'quote_state',c.quote_state,'quote_hash',CASE WHEN c.quote_state IN('sent','accepted') THEN c.quote_hash END,
  'acceptance',CASE WHEN c.acceptance IS NOT NULL THEN jsonb_build_object('signatory',c.acceptance->>'signatory','recorded_at',c.acceptance->>'recorded_at','quote_version',c.quote_version)END,
  'invoice',CASE WHEN c.invoice IS NOT NULL THEN c.invoice-ARRAY['recorded_by','document_reference'] END,
  'paid_cents',(SELECT coalesce(sum((p->>'amount_cents')::bigint),0) FROM jsonb_array_elements(c.payments)p),
  'report',CASE WHEN c.report_approved_by IS NOT NULL THEN c.report-ARRAY['author_id','evidence_reference'] END,
  'report_hash',CASE WHEN c.report_approved_by IS NOT NULL THEN c.report_hash END,'reference_decisions',c.reference_decisions) ORDER BY c.created_at DESC),'[]'::jsonb)
 FROM public.supplier_audit_cases c JOIN public.supplier_audit_portal_links l USING(supplier_id)
 WHERE l.platform_submission_id=p_submission_id AND NOT c.test_account AND c.quote_state IN('sent','accepted');
$$;
REVOKE ALL ON FUNCTION public.guard_supplier_audit_case(),public.log_supplier_audit_case_event() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_supplier_audit_case(uuid,uuid,text,text[],text),public.advance_supplier_audit_case(uuid,integer,uuid,text,jsonb),public.bind_supplier_audit_portal(uuid,uuid,text),public.list_supplier_audit_portal(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_supplier_audit_case(uuid,uuid,text,text[],text),public.advance_supplier_audit_case(uuid,integer,uuid,text,jsonb),public.bind_supplier_audit_portal(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_supplier_audit_case(uuid,integer,uuid,text,jsonb),public.list_supplier_audit_portal(uuid) TO service_role;
COMMENT ON TABLE public.supplier_audit_cases IS 'Commercial audit workflow; invoice/payment references record external evidence and never execute a payment or certify a product.';

-- Latest immutable decision, not the case's updated_at (later payments must
-- never resurrect a superseded admission). Only the trusted bridge reads it.
CREATE FUNCTION public.get_supplier_reference_admission(p_supplier_id uuid,p_reference text,p_test_account boolean DEFAULT false)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce((
  SELECT d->>'decision'='admitted'
  FROM public.supplier_audit_case_events e JOIN public.supplier_audit_cases c ON c.id=e.case_id
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(e.after_state->'reference_decisions')='array'
   THEN e.after_state->'reference_decisions' ELSE '[]'::jsonb END) d
  WHERE e.action='decide' AND c.supplier_id=p_supplier_id AND c.test_account=p_test_account
   AND d->>'reference'=p_reference AND e.after_state->>'report_approved_by' IS NOT NULL
  ORDER BY e.event_order DESC LIMIT 1
 ),false);
$$;
REVOKE ALL ON FUNCTION public.get_supplier_reference_admission(uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_reference_admission(uuid,text,boolean) TO service_role;
