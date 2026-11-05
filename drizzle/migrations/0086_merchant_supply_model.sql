-- Shared verbatim with Platform; copied into the two forward migrations.
CREATE FUNCTION public.supply_text(p jsonb,k text,max_length integer DEFAULT 2000) RETURNS text
 LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE v text:=p->>k;
BEGIN
 IF jsonb_typeof(p->k) IS DISTINCT FROM 'string' OR length(btrim(coalesce(v,''))) NOT BETWEEN 1 AND max_length
 THEN RAISE EXCEPTION 'required_supply_text: %',k USING ERRCODE='22023'; END IF; RETURN v;
END; $$;
CREATE FUNCTION public.supply_timestamp(value text) RETURNS timestamptz
 LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
BEGIN
 IF value IS NULL OR value !~ '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?Z$'
 THEN RAISE EXCEPTION 'invalid_supply_validity' USING ERRCODE='22023'; END IF;
 RETURN value::timestamptz;
END; $$;
CREATE FUNCTION public.calculate_supply_quote(p jsonb) RETURNS jsonb
 LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE party jsonb; role text; line jsonb; components text[]:='{}'; net bigint:=0; tax bigint:=0; subtotal bigint; line_tax bigint;
 qty bigint; unit bigint; rate integer; issuer text; by_issuer jsonb:='{"supplier":0,"bib":0,"logistics":0}'; calculated jsonb:='[]'; by_issuer_net jsonb:='{"supplier":0,"bib":0,"logistics":0}';
BEGIN
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p) k WHERE NOT k=ANY(ARRAY['schema_version','model','purpose','merchant_id','boutique_id','catalog_id','supplier_id','quantity','currency','parties','lines','valid_until','mandate_reference','terms_reference','delivery_terms','ownership_terms']))
 OR jsonb_typeof(p->'schema_version') IS DISTINCT FROM 'number' OR p->>'schema_version' IS DISTINCT FROM '1' OR p->>'model' IS DISTINCT FROM 'transparent_intermediation' OR p->>'currency' IS DISTINCT FROM 'EUR'
 OR coalesce(p->>'purpose','') NOT IN('sample','stock','on_demand')
 THEN RAISE EXCEPTION 'invalid_supply_model' USING ERRCODE='22023'; END IF;
 FOREACH role IN ARRAY ARRAY['merchant_id','boutique_id','catalog_id','supplier_id'] LOOP
  PERFORM public.supply_text(p,role)::uuid;
 END LOOP;
 IF jsonb_typeof(p->'quantity') IS DISTINCT FROM 'number' OR (p->>'quantity') !~ '^[0-9]+$' OR (p->>'quantity')::bigint NOT BETWEEN 1 AND 100000
 THEN RAISE EXCEPTION 'invalid_supply_quantity' USING ERRCODE='22023'; END IF;
 IF jsonb_typeof(p->'parties') IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p->'parties') k WHERE NOT k=ANY(ARRAY['merchant','supplier','bib','logistics']))
 THEN RAISE EXCEPTION 'invalid_supply_parties' USING ERRCODE='22023'; END IF;
 FOREACH role IN ARRAY ARRAY['merchant','supplier','bib','logistics'] LOOP
  party:=p->'parties'->role;
  IF role='logistics' AND party IS NULL THEN CONTINUE; END IF;
  IF jsonb_typeof(party) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(party) k WHERE NOT k=ANY(ARRAY['entity_id','legal_name','registration_id','address','email','evidence_reference']))
  THEN RAISE EXCEPTION 'invalid_supply_party' USING ERRCODE='22023'; END IF;
  PERFORM public.supply_text(party,'entity_id')::uuid;
  PERFORM public.supply_text(party,'legal_name',500); PERFORM public.supply_text(party,'registration_id',500);
  PERFORM public.supply_text(party,'address',1000); PERFORM public.supply_text(party,'evidence_reference',500);
  IF public.supply_text(party,'email',500) !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$'
  THEN RAISE EXCEPTION 'invalid_supply_email' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF p->'parties'->'supplier'->>'entity_id' IS DISTINCT FROM p->>'supplier_id'
 THEN RAISE EXCEPTION 'supplier_party_mismatch' USING ERRCODE='22023'; END IF;
 IF jsonb_typeof(p->'lines') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'lines')<>3
 THEN RAISE EXCEPTION 'three_supply_components_required' USING ERRCODE='22023'; END IF;
 FOR line IN SELECT jsonb_array_elements(p->'lines') LOOP
  IF jsonb_typeof(line) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(line) k WHERE NOT k=ANY(ARRAY['component','issuer','label','quantity','unit_net_cents','tax_rate_bps','tax_reason']))
  OR coalesce(line->>'component','') NOT IN('goods','delivery','bib_fee') OR line->>'component'=ANY(components)
  OR coalesce(line->>'issuer','') NOT IN('supplier','bib','logistics')
  THEN RAISE EXCEPTION 'invalid_supply_line' USING ERRCODE='22023'; END IF;
  PERFORM public.supply_text(line,'label',500); PERFORM public.supply_text(line,'tax_reason',1000);
  FOREACH role IN ARRAY ARRAY['quantity','unit_net_cents','tax_rate_bps'] LOOP
   IF jsonb_typeof(line->role) IS DISTINCT FROM 'number' OR (line->>role) !~ '^[0-9]+$'
   THEN RAISE EXCEPTION 'invalid_supply_amount' USING ERRCODE='22023'; END IF;
  END LOOP;
  qty:=(line->>'quantity')::bigint; unit:=(line->>'unit_net_cents')::bigint; rate:=(line->>'tax_rate_bps')::integer; issuer:=line->>'issuer';
  IF qty NOT BETWEEN 1 AND 100000 OR unit NOT BETWEEN 0 AND 100000000 OR rate NOT BETWEEN 0 AND 10000
  OR (line->>'component'='goods' AND (issuer<>'supplier' OR qty<>(p->>'quantity')::bigint OR unit=0))
  OR (line->>'component'='bib_fee' AND issuer<>'bib') OR (issuer='logistics' AND NOT (p->'parties' ? 'logistics'))
  OR (p->'parties'->'merchant'->>'entity_id'=p->'parties'->'bib'->>'entity_id' AND issuer='bib' AND unit<>0)
  THEN RAISE EXCEPTION 'invalid_supply_issuer_or_amount' USING ERRCODE='22023'; END IF;
  subtotal:=qty*unit; line_tax:=floor((subtotal::numeric*rate+5000)/10000)::bigint;
  IF subtotal+line_tax>100000000000 THEN RAISE EXCEPTION 'supply_amount_limit' USING ERRCODE='22023'; END IF;
  net:=net+subtotal; tax:=tax+line_tax;
  by_issuer:=jsonb_set(by_issuer,ARRAY[issuer],to_jsonb((by_issuer->>issuer)::bigint+subtotal+line_tax));
  by_issuer_net:=jsonb_set(by_issuer_net,ARRAY[issuer],to_jsonb((by_issuer_net->>issuer)::bigint+subtotal));
  calculated:=calculated||jsonb_build_array(line||jsonb_build_object('net_cents',subtotal,'tax_cents',line_tax,'total_cents',subtotal+line_tax));
  components:=array_append(components,line->>'component');
 END LOOP;
 IF net+tax NOT BETWEEN 1 AND 100000000000 THEN RAISE EXCEPTION 'supply_amount_limit' USING ERRCODE='22023'; END IF;
 PERFORM public.supply_timestamp(public.supply_text(p,'valid_until'));
 FOREACH role IN ARRAY ARRAY['mandate_reference','terms_reference','delivery_terms','ownership_terms'] LOOP PERFORM public.supply_text(p,role); END LOOP;
 RETURN jsonb_build_object('currency','EUR','net_cents',net,'tax_cents',tax,'total_cents',net+tax,'by_issuer',by_issuer,'by_issuer_net',by_issuer_net,'lines',calculated);
END; $$;
CREATE FUNCTION public.calculate_catalog_acquisition_price(p jsonb) RETURNS bigint
 LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE key text; total bigint:=0; amount bigint;
BEGIN
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p) k WHERE NOT k=ANY(ARRAY['version','currency','goods_unit_cents','delivery_unit_cents','bib_fee_unit_cents'])) OR p->>'currency' IS DISTINCT FROM 'EUR'
 THEN RAISE EXCEPTION 'invalid_acquisition_price' USING ERRCODE='22023'; END IF;
 PERFORM public.supply_text(p,'version',100);
 FOREACH key IN ARRAY ARRAY['goods_unit_cents','delivery_unit_cents','bib_fee_unit_cents'] LOOP
  IF jsonb_typeof(p->key) IS DISTINCT FROM 'number' OR (p->>key) !~ '^[0-9]+$' THEN RAISE EXCEPTION 'invalid_acquisition_price' USING ERRCODE='22023'; END IF;
  amount:=(p->>key)::bigint;
  IF amount NOT BETWEEN 0 AND 100000000 OR (key='goods_unit_cents' AND amount=0) THEN RAISE EXCEPTION 'invalid_acquisition_price' USING ERRCODE='22023'; END IF;
  total:=total+amount;
 END LOOP;
 IF total NOT BETWEEN 1 AND 100000000 THEN RAISE EXCEPTION 'invalid_acquisition_price' USING ERRCODE='22023'; END IF;
 RETURN total;
END; $$;
REVOKE ALL ON FUNCTION public.supply_text(jsonb,text,integer),public.calculate_supply_quote(jsonb),public.calculate_catalog_acquisition_price(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.calculate_supply_quote(jsonb),public.calculate_catalog_acquisition_price(jsonb) TO authenticated,service_role;

REVOKE ALL ON FUNCTION public.supply_timestamp(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.supply_timestamp(text) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.supply_text(jsonb,text,integer) TO authenticated,service_role;

CREATE SEQUENCE public.merchant_supply_quote_numbers;
CREATE TABLE public.merchant_supply_quotes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), creation_key uuid NOT NULL, created_by uuid NOT NULL,
 reference text NOT NULL UNIQUE DEFAULT('ACQ-'||lpad(nextval('public.merchant_supply_quote_numbers')::text,10,'0')),
 creation_request jsonb NOT NULL, quote_author uuid NOT NULL,
 payload jsonb NOT NULL, totals jsonb NOT NULL DEFAULT '{}', quote_hash text NOT NULL DEFAULT '',
 supplier_id uuid NOT NULL REFERENCES public.suppliers(id), catalog_id uuid NOT NULL REFERENCES public.products(id),
 merchant_id uuid NOT NULL, boutique_id uuid NOT NULL, product_name text NOT NULL DEFAULT '',
 state text NOT NULL DEFAULT 'draft' CHECK(state IN('draft','review','approved','issued','accepted','withdrawn')),
 revision integer NOT NULL DEFAULT 1, quote_version integer NOT NULL DEFAULT 1,
 approved_by uuid, approval_reference text, acceptance jsonb, invoice_documents jsonb NOT NULL DEFAULT '[]',
 coverage jsonb, payment_evidence jsonb NOT NULL DEFAULT '[]', test_account boolean NOT NULL DEFAULT false,
 last_action text NOT NULL DEFAULT 'create', command_key uuid NOT NULL, command_payload jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(created_by,creation_key)
);
CREATE TABLE public.merchant_supply_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quote_id uuid NOT NULL REFERENCES public.merchant_supply_quotes(id),
 command_key uuid NOT NULL, actor_id uuid, action text NOT NULL, request jsonb NOT NULL, result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(quote_id,command_key)
);
CREATE TABLE public.catalog_acquisition_prices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id),
 supplier_id uuid NOT NULL REFERENCES public.suppliers(id), price jsonb NOT NULL, total_cents bigint NOT NULL,
 evidence_reference text NOT NULL, created_by uuid NOT NULL, approved_by uuid, state text NOT NULL DEFAULT 'draft' CHECK(state IN('draft','approved','withdrawn')),
 test_account boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), approved_at timestamptz
);
CREATE TABLE public.merchant_supply_settlements (
 quote_id uuid PRIMARY KEY REFERENCES public.merchant_supply_quotes(id),revision integer NOT NULL,state text NOT NULL,evidence jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.merchant_supply_invoice_refs (
 issuer_entity_id uuid NOT NULL,reference text NOT NULL,test_account boolean NOT NULL,quote_id uuid NOT NULL REFERENCES public.merchant_supply_quotes(id),
 PRIMARY KEY(issuer_entity_id,reference,test_account)
);
ALTER TABLE public.merchant_supply_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_supply_invoice_refs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.merchant_supply_settlements,public.merchant_supply_invoice_refs FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.merchant_supply_settlements,public.merchant_supply_invoice_refs TO service_role;
CREATE UNIQUE INDEX catalog_acquisition_approved ON public.catalog_acquisition_prices(product_id) WHERE state='approved';
CREATE TABLE public.merchant_supply_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_key uuid NOT NULL, merchant_id uuid NOT NULL,boutique_id uuid NOT NULL,
 buyer_entity_id uuid NOT NULL,catalog_id uuid NOT NULL REFERENCES public.products(id),request jsonb NOT NULL,
 test_account boolean NOT NULL,state text NOT NULL DEFAULT 'received' CHECK(state IN('received','quoted')),
 quote_id uuid REFERENCES public.merchant_supply_quotes(id) DEFERRABLE INITIALLY DEFERRED,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(merchant_id,request_key)
);
ALTER TABLE public.merchant_supply_quotes ADD COLUMN source_request_id uuid REFERENCES public.merchant_supply_requests(id);
ALTER TABLE public.merchant_supply_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.merchant_supply_requests FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.merchant_supply_requests TO authenticated,service_role;
CREATE POLICY supply_request_read ON public.merchant_supply_requests FOR SELECT TO authenticated USING(test_account=public.intranet_is_test_mode() AND (public.can_intranet_action('supplier.suppliers','read') OR public.can_intranet_action('finance.billing','read')));
CREATE TABLE public.supply_operator_configuration(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT false,party jsonb,evidence_reference text);
INSERT INTO public.supply_operator_configuration(singleton) VALUES(true);
ALTER TABLE public.supply_operator_configuration ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supply_operator_configuration FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.supply_operator_configuration TO service_role;

CREATE FUNCTION public.supply_buyer_identity(p_merchant_id uuid,p_boutique_id uuid,p_test boolean) RETURNS jsonb
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.legal_governance_records; f jsonb;
BEGIN
 SELECT * INTO r FROM public.legal_governance_records WHERE kind='identity' AND test_account=p_test AND payload->>'store_id'=p_boutique_id::text ORDER BY activation_sequence DESC NULLS LAST,created_at DESC LIMIT 1;
 IF r.id IS NULL OR r.state<>'published' OR r.payload->>'owner_id' IS DISTINCT FROM p_merchant_id::text THEN RETURN NULL; END IF;
 f:=r.payload->'fields';
 RETURN jsonb_build_object('entity_id',r.payload->>'legal_entity_id','legal_name',f->>'VENDEUR_NOM_LEGAL','registration_id',f->>'SIREN_SIRET','address',f->>'ADRESSE','email',f->>'CONTACT_VENDEUR','evidence_reference','Dossier juridique '||r.id::text);
END; $$;
CREATE FUNCTION public.supply_quote_options() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb; mode boolean:=public.intranet_is_test_mode();
BEGIN
 IF auth.uid() IS NULL OR NOT(public.can_intranet_action('supplier.suppliers','read') OR public.can_intranet_action('finance.billing','read')) THEN RAISE EXCEPTION 'supply_read_required' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('operator',(SELECT party FROM public.supply_operator_configuration WHERE singleton AND enabled),
 'buyers',coalesce((SELECT jsonb_agg(x) FROM (SELECT s.platform_id AS boutique_id,u.platform_id AS merchant_id,s.name,public.supply_buyer_identity(u.platform_id::uuid,s.platform_id::uuid,mode) AS party FROM public.shops s JOIN public.user_accounts u ON u.id=s.merchant_id WHERE s.platform_id IS NOT NULL AND u.platform_id IS NOT NULL AND public.supply_buyer_identity(u.platform_id::uuid,s.platform_id::uuid,mode) IS NOT NULL ORDER BY s.name LIMIT 500) x),'[]')) INTO result;
 RETURN result;
END; $$;
-- Rechecked at issue, acceptance, payment reservation and production. Historical documents remain readable.
CREATE FUNCTION public.supply_quote_eligible(q public.merchant_supply_quotes) RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(q.payload->'parties'->'merchant'=public.supply_buyer_identity(q.merchant_id,q.boutique_id,q.test_account)
  AND q.payload->'parties'->'bib'=(SELECT party FROM public.supply_operator_configuration WHERE singleton AND enabled)
  AND EXISTS(SELECT 1 FROM public.products p JOIN public.suppliers s ON s.id=p.supplier_id
   WHERE p.id=q.catalog_id AND p.supplier_id=q.supplier_id AND coalesce(p.test_account,false)=q.test_account AND coalesce(s.test_account,false)=q.test_account
   AND p.status IN('validated','approved','active') AND s.status IN('validated','approved','active')
   AND length(btrim(p.sku))>0 AND public.get_supplier_reference_admission(p.supplier_id,p.sku,q.test_account))
  AND (q.payload->>'purpose'='sample' OR EXISTS(SELECT 1 FROM public.merchant_supply_requests r WHERE r.id=q.source_request_id AND r.request ? 'verified_sample')),false);
$$;
REVOKE ALL ON FUNCTION public.supply_quote_eligible(public.merchant_supply_quotes) FROM PUBLIC,anon,authenticated;
ALTER TABLE public.merchant_supply_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_supply_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_acquisition_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.merchant_supply_quotes,public.merchant_supply_events,public.catalog_acquisition_prices FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE ON public.merchant_supply_quotes TO authenticated;
GRANT USAGE ON SEQUENCE public.merchant_supply_quote_numbers TO authenticated;
REVOKE INSERT ON public.merchant_supply_quotes FROM authenticated;
GRANT INSERT(creation_key,created_by,creation_request,quote_author,payload,supplier_id,catalog_id,merchant_id,boutique_id,command_key,source_request_id) ON public.merchant_supply_quotes TO authenticated;
GRANT SELECT ON public.merchant_supply_events,public.catalog_acquisition_prices TO authenticated;
GRANT SELECT ON public.merchant_supply_quotes,public.merchant_supply_events,public.catalog_acquisition_prices TO service_role;
CREATE POLICY supply_quote_read ON public.merchant_supply_quotes FOR SELECT TO authenticated USING (
 test_account=public.intranet_is_test_mode() AND ((public.can_intranet_action('supplier.suppliers','read') AND EXISTS(SELECT 1 FROM public.suppliers s WHERE s.id=supplier_id)) OR public.can_intranet_action('finance.billing','read')));
CREATE POLICY supply_quote_create ON public.merchant_supply_quotes FOR INSERT TO authenticated WITH CHECK (
 created_by=auth.uid() AND public.can_intranet_action('supplier.suppliers','create') AND test_account=public.intranet_is_test_mode()
 AND EXISTS(SELECT 1 FROM public.products p WHERE p.id=catalog_id AND p.supplier_id=merchant_supply_quotes.supplier_id)
 AND EXISTS(SELECT 1 FROM public.suppliers s WHERE s.id=supplier_id));
CREATE POLICY supply_quote_update ON public.merchant_supply_quotes FOR UPDATE TO authenticated USING(test_account=public.intranet_is_test_mode()) WITH CHECK(test_account=public.intranet_is_test_mode());
CREATE POLICY supply_event_read ON public.merchant_supply_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.merchant_supply_quotes q WHERE q.id=quote_id));
CREATE POLICY supply_price_read ON public.catalog_acquisition_prices FOR SELECT TO authenticated USING(test_account=public.intranet_is_test_mode() AND (public.can_intranet_action('supplier.suppliers','read') OR public.can_intranet_action('finance.billing','read')));

CREATE FUNCTION public.guard_merchant_supply_quote() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); request jsonb:=NEW.command_payload; action text:=NEW.last_action; key uuid:=NEW.command_key; calculated jsonb; prod public.products; doc jsonb;
BEGIN
 IF TG_OP='INSERT' THEN
  IF actor IS NULL OR NOT public.can_intranet_action('supplier.suppliers','create') OR NEW.created_by<>actor OR NEW.state<>'draft'
  OR NEW.revision<>1 OR NEW.quote_version<>1 OR NEW.approved_by IS NOT NULL OR NEW.acceptance IS NOT NULL OR NEW.coverage IS NOT NULL OR NEW.invoice_documents<>'[]' OR NEW.payment_evidence<>'[]'
  THEN RAISE EXCEPTION 'supply_creation_forbidden' USING ERRCODE='42501'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['last_action','command_key','command_payload']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['last_action','command_key','command_payload'])
  THEN RAISE EXCEPTION 'supply_direct_write_forbidden' USING ERRCODE='42501'; END IF;
  NEW:=OLD; NEW.last_action:=action; NEW.command_key:=key; NEW.command_payload:=request;
  IF action='portal_accept' THEN
   IF auth.role() IS DISTINCT FROM 'service_role' OR NEW.test_account IS DISTINCT FROM (request->>'environment'='sandbox') OR NEW.state<>'issued' OR request->>'merchant_id' IS DISTINCT FROM NEW.merchant_id::text
   OR request->>'boutique_id' IS DISTINCT FROM NEW.boutique_id::text OR request->>'buyer_entity_id' IS DISTINCT FROM NEW.payload->'parties'->'merchant'->>'entity_id'
   OR request->>'quote_hash' IS DISTINCT FROM NEW.quote_hash OR request->>'quote_version' IS DISTINCT FROM NEW.quote_version::text OR request->>'accepted' IS DISTINCT FROM 'true'
   THEN RAISE EXCEPTION 'supply_acceptance_conflict' USING ERRCODE='40001'; END IF;
   IF (NEW.payload->>'valid_until')::timestamptz<=now() THEN RAISE EXCEPTION 'supply_quote_expired' USING ERRCODE='40001'; END IF;
   NEW.acceptance:=jsonb_build_object('actor_id',NEW.merchant_id,'signatory',public.supply_text(request,'signatory',250),'capacity',public.supply_text(request,'capacity',500),
    'at',now(),'quote_version',NEW.quote_version,'quote_hash',NEW.quote_hash,'payload',NEW.payload,'statement','supplier sells to merchant; BIB acts within its disclosed mandate');
   NEW.state:='accepted';
  ELSIF action='payment_evidence' THEN
   IF auth.role() IS DISTINCT FROM 'service_role' OR NEW.state<>'accepted' OR request->>'currency'<>'EUR' OR request->>'amount_cents' IS DISTINCT FROM NEW.totals->>'total_cents'
   OR request->>'quote_hash' IS DISTINCT FROM NEW.quote_hash OR request->>'environment' IS DISTINCT FROM (CASE WHEN NEW.test_account THEN 'sandbox' ELSE 'live' END)
   THEN RAISE EXCEPTION 'invalid_supply_payment_evidence' USING ERRCODE='22023'; END IF;
   PERFORM public.supply_text(request,'stripe_session_id',200); PERFORM public.supply_text(request,'event_id',200);
   NEW.payment_evidence:=NEW.payment_evidence||jsonb_build_array(request||jsonb_build_object('recorded_at',now()));
  ELSE
   IF actor IS NULL OR NEW.test_account IS DISTINCT FROM public.intranet_is_test_mode() THEN RAISE EXCEPTION 'supply_actor_forbidden' USING ERRCODE='42501'; END IF;
   IF action IN('revise','submit','issue','withdraw') AND NOT(public.can_intranet_action('supplier.suppliers','read') AND public.can_intranet_action('supplier.suppliers','update'))
   THEN RAISE EXCEPTION 'supplier_permission_required' USING ERRCODE='42501'; END IF;
   IF action IN('approve','attach_invoice','record_coverage') AND NOT(public.can_intranet_action('finance.billing','read') AND public.can_intranet_action('finance.billing','validate'))
   THEN RAISE EXCEPTION 'finance_permission_required' USING ERRCODE='42501'; END IF;
   CASE action
   WHEN 'revise' THEN
    IF NEW.state IN('accepted','withdrawn') THEN RAISE EXCEPTION 'accepted_supply_quote_immutable' USING ERRCODE='55000'; END IF;
    NEW.payload:=request->'payload'; NEW.state:='draft'; NEW.quote_version:=NEW.quote_version+1; NEW.quote_author:=actor; NEW.approved_by:=NULL; NEW.approval_reference:=NULL;
   WHEN 'submit' THEN IF NEW.state<>'draft' THEN RAISE EXCEPTION 'supply_transition_conflict' USING ERRCODE='40001'; END IF; NEW.state:='review';
   WHEN 'approve' THEN
    IF NEW.state<>'review' OR NEW.quote_author=actor THEN RAISE EXCEPTION 'independent_supply_review_required' USING ERRCODE='42501'; END IF;
    NEW.approval_reference:=public.supply_text(request,'evidence_reference',500); NEW.approved_by:=actor; NEW.state:='approved';
   WHEN 'issue' THEN IF NEW.state<>'approved' THEN RAISE EXCEPTION 'finance_approval_required' USING ERRCODE='40001'; END IF; NEW.state:='issued';
   WHEN 'withdraw' THEN
    IF NEW.state IN('accepted','withdrawn') THEN RAISE EXCEPTION 'accepted_supply_quote_immutable' USING ERRCODE='55000'; END IF;
    PERFORM public.supply_text(request,'reason',2000); NEW.state:='withdrawn';
   WHEN 'attach_invoice' THEN
    IF NEW.state<>'accepted' THEN RAISE EXCEPTION 'accepted_supply_quote_required' USING ERRCODE='40001'; END IF;
    doc:=request; PERFORM public.supply_text(doc,'reference',200); PERFORM public.supply_text(doc,'document_reference',500);
    IF coalesce(doc->>'issuer','') NOT IN('supplier','bib','logistics') OR (NEW.totals->'by_issuer'->>(doc->>'issuer'))::bigint<=0
    OR doc->>'amount_cents' IS DISTINCT FROM NEW.totals->'by_issuer'->>(doc->>'issuer') OR doc->>'debtor' IS DISTINCT FROM 'merchant'
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.invoice_documents) i WHERE i->>'issuer'=doc->>'issuer')
    THEN RAISE EXCEPTION 'invoice_issuer_or_amount_mismatch' USING ERRCODE='22023'; END IF;
    NEW.invoice_documents:=NEW.invoice_documents||jsonb_build_array(doc||jsonb_build_object('recorded_by',actor,'recorded_at',now()));
    INSERT INTO public.merchant_supply_invoice_refs VALUES((NEW.payload->'parties'->(doc->>'issuer')->>'entity_id')::uuid,lower(btrim(doc->>'reference')),NEW.test_account,NEW.id);
   WHEN 'record_coverage' THEN
    IF NEW.state<>'accepted' OR coalesce((request->>'amount_cents')::bigint,0)<(NEW.totals->>'total_cents')::bigint THEN RAISE EXCEPTION 'supply_coverage_insufficient' USING ERRCODE='22023'; END IF;
    PERFORM public.supply_text(request,'evidence_reference',500); PERFORM public.supply_text(request,'coverage_terms');
    IF public.supply_timestamp(public.supply_text(request,'valid_until'))<=now() THEN RAISE EXCEPTION 'supply_coverage_expired' USING ERRCODE='22023'; END IF;
    NEW.coverage:=request||jsonb_build_object('recorded_by',actor,'recorded_at',now());
   ELSE RAISE EXCEPTION 'unknown_supply_action' USING ERRCODE='22023';
   END CASE;
  END IF;
  NEW.revision:=OLD.revision+1;
 END IF;
 IF TG_OP='INSERT' OR action='revise' THEN
  calculated:=public.calculate_supply_quote(NEW.payload); NEW.totals:=calculated;
  NEW.supplier_id:=(NEW.payload->>'supplier_id')::uuid; NEW.catalog_id:=(NEW.payload->>'catalog_id')::uuid;
  NEW.merchant_id:=(NEW.payload->>'merchant_id')::uuid; NEW.boutique_id:=(NEW.payload->>'boutique_id')::uuid;
  SELECT * INTO prod FROM public.products WHERE id=NEW.catalog_id AND supplier_id=NEW.supplier_id;
  IF prod.id IS NULL THEN RAISE EXCEPTION 'supply_product_supplier_mismatch' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.suppliers s WHERE s.id=NEW.supplier_id AND coalesce(s.test_account,false)=public.intranet_is_test_mode())
  OR NOT EXISTS(SELECT 1 FROM public.shops s JOIN public.user_accounts u ON u.id=s.merchant_id WHERE s.platform_id::text=NEW.boutique_id::text AND u.platform_id::text=NEW.merchant_id::text)
  THEN RAISE EXCEPTION 'verified_supply_owner_link_required' USING ERRCODE='42501'; END IF;
  NEW.test_account:=public.intranet_is_test_mode(); NEW.product_name:=prod.name;
  IF TG_OP='INSERT' THEN NEW.quote_author:=actor; NEW.creation_request:=NEW.payload; NEW.created_at:=now(); NEW.last_action:='create'; NEW.approval_reference:=NULL; END IF;
  NEW.quote_hash:=encode(sha256(convert_to(NEW.payload::text,'UTF8')),'hex');
  IF TG_OP='INSERT' AND NEW.source_request_id IS NOT NULL THEN
   UPDATE public.merchant_supply_requests SET state='quoted',quote_id=NEW.id WHERE id=NEW.source_request_id AND merchant_id=NEW.merchant_id AND boutique_id=NEW.boutique_id AND catalog_id=NEW.catalog_id AND test_account=NEW.test_account AND state='received';
   IF NOT FOUND THEN RAISE EXCEPTION 'supply_request_link_conflict' USING ERRCODE='40001'; END IF;
  END IF;
 END IF;
 IF (TG_OP='INSERT' OR action='revise') AND NEW.payload->>'purpose'<>'sample' AND NOT EXISTS(SELECT 1 FROM public.merchant_supply_requests r WHERE r.id=NEW.source_request_id AND r.request ? 'verified_sample' AND r.catalog_id=NEW.catalog_id AND r.merchant_id=NEW.merchant_id AND r.boutique_id=NEW.boutique_id) THEN RAISE EXCEPTION 'verified_sample_request_required_before_stock_quote' USING ERRCODE='55000'; END IF;
 IF TG_OP='INSERT' OR action IN('revise','approve','issue','portal_accept') THEN
  IF NEW.payload->'parties'->'merchant' IS DISTINCT FROM public.supply_buyer_identity(NEW.merchant_id,NEW.boutique_id,NEW.test_account)
  OR NEW.payload->'parties'->'bib' IS DISTINCT FROM (SELECT party FROM public.supply_operator_configuration WHERE singleton AND enabled)
  THEN RAISE EXCEPTION 'current_supply_legal_parties_required' USING ERRCODE='40001'; END IF;
 END IF;
 IF action IN('approve','issue','portal_accept') AND NOT public.supply_quote_eligible(NEW) THEN RAISE EXCEPTION 'current_supplier_admission_required' USING ERRCODE='55000'; END IF;
 NEW.updated_at:=now();
 INSERT INTO public.merchant_supply_events(quote_id,command_key,actor_id,action,request,result)
 VALUES(NEW.id,key,actor,action,request,to_jsonb(NEW));
 RETURN NEW;
END; $$;
-- Deferred FK: the creation event is recorded by the BEFORE trigger in the same transaction.
ALTER TABLE public.merchant_supply_events DROP CONSTRAINT merchant_supply_events_quote_id_fkey;
ALTER TABLE public.merchant_supply_events ADD CONSTRAINT merchant_supply_events_quote_id_fkey FOREIGN KEY(quote_id) REFERENCES public.merchant_supply_quotes(id) DEFERRABLE INITIALLY DEFERRED;
CREATE TRIGGER merchant_supply_quote_guard BEFORE INSERT OR UPDATE ON public.merchant_supply_quotes FOR EACH ROW EXECUTE FUNCTION public.guard_merchant_supply_quote();

CREATE FUNCTION public.create_merchant_supply_quote(p_key uuid,p_payload jsonb,p_request_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE q public.merchant_supply_quotes;
BEGIN
 IF auth.uid() IS NULL OR p_key IS NULL THEN RAISE EXCEPTION 'supply_actor_required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 SELECT * INTO q FROM public.merchant_supply_quotes WHERE created_by=auth.uid() AND creation_key=p_key;
 IF FOUND THEN IF q.creation_request IS DISTINCT FROM p_payload OR q.source_request_id IS DISTINCT FROM p_request_id THEN RAISE EXCEPTION 'supply_key_conflict' USING ERRCODE='40001'; END IF; RETURN to_jsonb(q); END IF;
 INSERT INTO public.merchant_supply_quotes(creation_key,created_by,creation_request,quote_author,payload,supplier_id,catalog_id,merchant_id,boutique_id,command_key,source_request_id)
 VALUES(p_key,auth.uid(),p_payload,auth.uid(),p_payload,(p_payload->>'supplier_id')::uuid,(p_payload->>'catalog_id')::uuid,(p_payload->>'merchant_id')::uuid,(p_payload->>'boutique_id')::uuid,p_key,p_request_id) RETURNING * INTO q;
 RETURN to_jsonb(q);
END; $$;
CREATE FUNCTION public.advance_merchant_supply_quote(p_id uuid,p_revision integer,p_key uuid,p_action text,p_payload jsonb DEFAULT '{}') RETURNS jsonb
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE q public.merchant_supply_quotes; e public.merchant_supply_events;
BEGIN
 IF p_key IS NULL OR p_revision IS NULL OR p_action IN('portal_accept','payment_evidence') THEN RAISE EXCEPTION 'invalid_supply_command' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text||p_key::text,0));
 SELECT * INTO e FROM public.merchant_supply_events WHERE quote_id=p_id AND command_key=p_key;
 IF FOUND THEN IF e.action IS DISTINCT FROM p_action OR e.request IS DISTINCT FROM p_payload OR e.actor_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'supply_key_conflict' USING ERRCODE='40001'; END IF; RETURN e.result; END IF;
 UPDATE public.merchant_supply_quotes SET last_action=p_action,command_key=p_key,command_payload=p_payload WHERE id=p_id AND revision=p_revision RETURNING * INTO q;
 IF NOT FOUND THEN RAISE EXCEPTION 'supply_revision_or_access_conflict' USING ERRCODE='40001'; END IF; RETURN to_jsonb(q);
END; $$;
CREATE FUNCTION public.merchant_supply_portal(p_merchant_id uuid,p_boutique_id uuid,p_buyer_entity_id uuid,p_environment text,p_action text,p_quote_id uuid DEFAULT NULL,p_payload jsonb DEFAULT '{}') RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE q public.merchant_supply_quotes; result jsonb;
BEGIN
 IF p_environment IS NULL OR p_environment NOT IN('sandbox','live') THEN RAISE EXCEPTION 'invalid_supply_environment' USING ERRCODE='22023'; END IF;
 IF p_action='list' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'reference',reference,'payload',payload,'totals',totals,'product_name',product_name,'quote_hash',quote_hash,'quote_version',quote_version,'state',state,'acceptance',acceptance,'invoice_documents',invoice_documents,'payment_evidence',payment_evidence,'revision',revision,'checkout_eligible',public.supply_quote_eligible(list)) ORDER BY updated_at DESC),'[]') INTO result
  FROM (SELECT * FROM public.merchant_supply_quotes WHERE merchant_id=p_merchant_id AND boutique_id=p_boutique_id AND payload->'parties'->'merchant'->>'entity_id'=p_buyer_entity_id::text AND test_account=(p_environment='sandbox') AND state IN('issued','accepted','withdrawn') ORDER BY updated_at DESC LIMIT 200) list;
  RETURN result;
 END IF;
 IF p_action<>'accept' THEN RAISE EXCEPTION 'invalid_supply_portal_action' USING ERRCODE='22023'; END IF;
 SELECT * INTO q FROM public.merchant_supply_quotes WHERE id=p_quote_id FOR UPDATE;
 IF q.id IS NULL OR q.merchant_id IS DISTINCT FROM p_merchant_id OR q.boutique_id IS DISTINCT FROM p_boutique_id OR q.test_account IS DISTINCT FROM (p_environment='sandbox') OR q.payload->'parties'->'merchant'->>'entity_id' IS DISTINCT FROM p_buyer_entity_id::text THEN RAISE EXCEPTION 'supply_portal_forbidden' USING ERRCODE='42501'; END IF;
 IF q.state='accepted' AND q.quote_hash=p_payload->>'quote_hash' AND q.quote_version::text=p_payload->>'quote_version' THEN RETURN to_jsonb(q)-ARRAY['approval_reference','coverage','command_payload','creation_key','command_key']; END IF;
 UPDATE public.merchant_supply_quotes SET last_action='portal_accept',command_key=gen_random_uuid(),command_payload=p_payload||jsonb_build_object('merchant_id',p_merchant_id,'boutique_id',p_boutique_id,'buyer_entity_id',p_buyer_entity_id,'environment',p_environment) WHERE id=q.id RETURNING * INTO q;
 RETURN to_jsonb(q)-ARRAY['approval_reference','coverage','command_payload','creation_key','command_key'];
END; $$;

CREATE FUNCTION public.propose_catalog_acquisition_price(p_product_id uuid,p_price jsonb,p_evidence_reference text) RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE id uuid; supplier uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT(public.can_intranet_action('supplier.suppliers','read') AND public.can_intranet_action('supplier.suppliers','create')) THEN RAISE EXCEPTION 'supplier_permission_required' USING ERRCODE='42501'; END IF;
 SELECT supplier_id INTO supplier FROM public.products WHERE products.id=p_product_id AND coalesce(test_account,false)=public.intranet_is_test_mode();
 IF supplier IS NULL OR length(btrim(coalesce(p_evidence_reference,''))) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'supply_price_evidence_required' USING ERRCODE='22023'; END IF;
 INSERT INTO public.catalog_acquisition_prices(product_id,supplier_id,price,total_cents,evidence_reference,created_by,test_account)
 VALUES(p_product_id,supplier,p_price,public.calculate_catalog_acquisition_price(p_price),p_evidence_reference,auth.uid(),public.intranet_is_test_mode()) RETURNING catalog_acquisition_prices.id INTO id; RETURN id;
END; $$;
CREATE FUNCTION public.approve_catalog_acquisition_price(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE price public.catalog_acquisition_prices;
BEGIN
 IF auth.uid() IS NULL OR NOT(public.can_intranet_action('finance.billing','read') AND public.can_intranet_action('finance.billing','validate')) THEN RAISE EXCEPTION 'finance_permission_required' USING ERRCODE='42501'; END IF;
 SELECT * INTO price FROM public.catalog_acquisition_prices WHERE id=p_id FOR UPDATE;
 IF price.id IS NULL OR price.state<>'draft' OR price.created_by=auth.uid() OR price.test_account IS DISTINCT FROM public.intranet_is_test_mode() THEN RAISE EXCEPTION 'independent_supply_review_required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('acquisition-price:'||price.product_id::text,0));
 UPDATE public.catalog_acquisition_prices SET state='withdrawn' WHERE product_id=price.product_id AND state='approved';
 UPDATE public.catalog_acquisition_prices SET state='approved',approved_by=auth.uid(),approved_at=now() WHERE id=p_id;
END; $$;
CREATE FUNCTION public.get_catalog_acquisition_price(p_product_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT price FROM public.catalog_acquisition_prices p WHERE p.product_id=p_product_id AND p.state='approved' AND NOT p.test_account
 AND EXISTS(SELECT 1 FROM public.products x WHERE x.id=p.product_id AND x.supplier_id=p.supplier_id AND NOT coalesce(x.test_account,false));
$$;
CREATE FUNCTION public.create_merchant_supply_request(p_merchant_id uuid,p_boutique_id uuid,p_buyer_entity_id uuid,p_environment text,p_key uuid,p_payload jsonb) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.merchant_supply_requests; buyer jsonb;
BEGIN
 IF p_environment IS NULL OR p_environment NOT IN('sandbox','live') OR p_key IS NULL OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object'
 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload) k WHERE NOT k=ANY(ARRAY['catalog_id','quantity','purpose','note','verified_sample']))
 OR coalesce(p_payload->>'purpose','') NOT IN('sample','stock','on_demand') OR jsonb_typeof(p_payload->'quantity') IS DISTINCT FROM 'number'
 OR (p_payload->>'quantity') !~ '^[0-9]+$' OR (p_payload->>'quantity')::bigint NOT BETWEEN 1 AND 100000 OR length(coalesce(p_payload->>'note',''))>2000 OR (p_payload ? 'note' AND jsonb_typeof(p_payload->'note') IS DISTINCT FROM 'string')
 THEN RAISE EXCEPTION 'invalid_supply_request' USING ERRCODE='22023'; END IF;
 buyer:=public.supply_buyer_identity(p_merchant_id,p_boutique_id,p_environment='sandbox');
 IF buyer IS NULL OR buyer->>'entity_id' IS DISTINCT FROM p_buyer_entity_id::text OR NOT EXISTS(SELECT 1 FROM public.products WHERE id=(p_payload->>'catalog_id')::uuid AND coalesce(test_account,false)=(p_environment='sandbox'))
 THEN RAISE EXCEPTION 'verified_supply_request_parties_required' USING ERRCODE='42501'; END IF;
 IF p_payload->>'purpose'<>'sample' AND (jsonb_typeof(p_payload->'verified_sample') IS DISTINCT FROM 'object'
 OR p_payload->'verified_sample'->>'merchant_id' IS DISTINCT FROM p_merchant_id::text OR p_payload->'verified_sample'->>'boutique_id' IS DISTINCT FROM p_boutique_id::text
 OR p_payload->'verified_sample'->>'catalog_id' IS DISTINCT FROM p_payload->>'catalog_id' OR p_payload->'verified_sample'->>'environment' IS DISTINCT FROM p_environment)
 THEN RAISE EXCEPTION 'verified_paid_sample_required_before_stock_quote' USING ERRCODE='55000'; END IF;
 IF p_payload->>'purpose'<>'sample' THEN
  PERFORM public.supply_text(p_payload->'verified_sample','sample_id')::uuid; PERFORM public.supply_text(p_payload->'verified_sample','purchase_id')::uuid;
  PERFORM public.supply_text(p_payload->'verified_sample','product_id')::uuid; PERFORM public.supply_text(p_payload->'verified_sample','visual_confirmed_at')::timestamptz;
  PERFORM public.supply_timestamp(public.supply_text(p_payload->'verified_sample','verified_at'));
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_merchant_id::text||p_key::text,0));
 SELECT * INTO r FROM public.merchant_supply_requests WHERE merchant_id=p_merchant_id AND request_key=p_key;
 IF FOUND THEN IF r.request IS DISTINCT FROM p_payload OR r.boutique_id IS DISTINCT FROM p_boutique_id OR r.buyer_entity_id IS DISTINCT FROM p_buyer_entity_id THEN RAISE EXCEPTION 'supply_request_key_conflict' USING ERRCODE='40001'; END IF;
 ELSE INSERT INTO public.merchant_supply_requests(request_key,merchant_id,boutique_id,buyer_entity_id,catalog_id,request,test_account)
 VALUES(p_key,p_merchant_id,p_boutique_id,p_buyer_entity_id,(p_payload->>'catalog_id')::uuid,p_payload,p_environment='sandbox') RETURNING * INTO r; END IF;
 RETURN jsonb_build_object('request_id',r.id,'state',r.state);
END; $$;
CREATE FUNCTION public.receive_merchant_supply_settlement(p_quote_id uuid,p_environment text,p_evidence jsonb) RETURNS text
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE q public.merchant_supply_quotes; prior public.merchant_supply_settlements; revision integer;
BEGIN
 SELECT * INTO q FROM public.merchant_supply_quotes WHERE id=p_quote_id FOR UPDATE;
 IF q.id IS NULL OR q.state<>'accepted' OR p_environment IS NULL OR p_environment NOT IN('sandbox','live') OR q.test_account IS DISTINCT FROM (p_environment='sandbox')
 OR p_evidence->>'quote_id' IS DISTINCT FROM q.id::text OR p_evidence->>'quote_hash' IS DISTINCT FROM q.quote_hash OR p_evidence->>'environment' IS DISTINCT FROM p_environment
 OR p_evidence->>'amount_cents' IS DISTINCT FROM q.totals->>'total_cents' OR p_evidence->>'currency' IS DISTINCT FROM 'EUR'
 OR p_evidence->>'supplier_cents' IS DISTINCT FROM q.totals->'by_issuer'->>'supplier'
 OR p_evidence->>'bib_revenue_cents' IS DISTINCT FROM q.totals->'by_issuer_net'->>'bib'
 OR coalesce(p_evidence->>'state','') NOT IN('paid','refunded','partially_refunded','disputed')
 THEN RAISE EXCEPTION 'invalid_supply_settlement' USING ERRCODE='22023'; END IF;
 PERFORM public.supply_text(p_evidence,'stripe_session_id',200); PERFORM public.supply_text(p_evidence,'event_id',200);
 revision:=(p_evidence->>'revision')::integer;IF revision IS NULL OR revision<1 THEN RAISE EXCEPTION 'invalid_supply_revision' USING ERRCODE='22023'; END IF;
 SELECT * INTO prior FROM public.merchant_supply_settlements WHERE quote_id=q.id;
 IF FOUND THEN
  IF revision<prior.revision THEN RETURN 'stale'; END IF;
  IF revision=prior.revision THEN IF p_evidence IS DISTINCT FROM prior.evidence THEN RAISE EXCEPTION 'supply_settlement_conflict' USING ERRCODE='40001'; END IF; RETURN 'replayed'; END IF;
 END IF;
 INSERT INTO public.merchant_supply_settlements(quote_id,revision,state,evidence) VALUES(q.id,revision,p_evidence->>'state',p_evidence)
 ON CONFLICT(quote_id) DO UPDATE SET revision=excluded.revision,state=excluded.state,evidence=excluded.evidence,updated_at=now();
 UPDATE public.merchant_supply_quotes SET last_action='payment_evidence',command_key=gen_random_uuid(),command_payload=p_evidence WHERE id=q.id;
 RETURN 'applied';
END; $$;
REVOKE ALL ON FUNCTION public.receive_merchant_supply_settlement(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.receive_merchant_supply_settlement(uuid,text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.guard_merchant_supply_quote(),public.create_merchant_supply_quote(uuid,jsonb,uuid),public.advance_merchant_supply_quote(uuid,integer,uuid,text,jsonb),public.merchant_supply_portal(uuid,uuid,uuid,text,text,uuid,jsonb),public.propose_catalog_acquisition_price(uuid,jsonb,text),public.approve_catalog_acquisition_price(uuid),public.get_catalog_acquisition_price(uuid),public.create_merchant_supply_request(uuid,uuid,uuid,text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_merchant_supply_quote(uuid,jsonb,uuid),public.advance_merchant_supply_quote(uuid,integer,uuid,text,jsonb),public.propose_catalog_acquisition_price(uuid,jsonb,text),public.approve_catalog_acquisition_price(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_merchant_supply_request(uuid,uuid,uuid,text,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.merchant_supply_portal(uuid,uuid,uuid,text,text,uuid,jsonb),public.get_catalog_acquisition_price(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.supply_buyer_identity(uuid,uuid,boolean),public.supply_quote_options() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.supply_quote_options() TO authenticated;

ALTER TABLE public.supplier_restock_orders ADD COLUMN supply_quote_id uuid REFERENCES public.merchant_supply_quotes(id),
 ADD COLUMN source_product_id uuid REFERENCES public.products(id),ADD COLUMN buyer_merchant_id uuid,ADD COLUMN buyer_boutique_id uuid;
CREATE UNIQUE INDEX restock_supply_quote_once ON public.supplier_restock_orders(supply_quote_id) WHERE supply_quote_id IS NOT NULL;
CREATE FUNCTION public.guard_supply_restock_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE q public.merchant_supply_quotes; settlement public.merchant_supply_settlements;
BEGIN
 IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
  IF auth.uid() IS NULL OR NOT public.can_intranet_action('supplier.restock','read') OR NOT public.can_intranet_action('supplier.restock',CASE WHEN TG_OP='INSERT' THEN 'create' ELSE 'update' END)
  THEN RAISE EXCEPTION 'restock_permission_required' USING ERRCODE='42501'; END IF;
 END IF;
 IF TG_OP='UPDATE' AND OLD.supply_quote_id IS NOT NULL AND (NEW.supply_quote_id IS DISTINCT FROM OLD.supply_quote_id OR NEW.supplier_id IS DISTINCT FROM OLD.supplier_id OR NEW.source_product_id IS DISTINCT FROM OLD.source_product_id OR NEW.quantity IS DISTINCT FROM OLD.quantity OR NEW.buyer_merchant_id IS DISTINCT FROM OLD.buyer_merchant_id OR NEW.buyer_boutique_id IS DISTINCT FROM OLD.buyer_boutique_id)
 THEN RAISE EXCEPTION 'supply_restock_identity_immutable' USING ERRCODE='42501'; END IF;
 IF NEW.supply_quote_id IS NULL THEN
  IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN RAISE EXCEPTION 'accepted_supply_quote_required' USING ERRCODE='22023'; END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO q FROM public.merchant_supply_quotes WHERE id=NEW.supply_quote_id;
 IF q.id IS NULL OR q.state<>'accepted' OR q.test_account IS DISTINCT FROM public.intranet_is_test_mode()
 THEN RAISE EXCEPTION 'accepted_supply_quote_required' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' THEN
  NEW.supplier_id:=q.supplier_id; NEW.source_product_id:=q.catalog_id; NEW.buyer_merchant_id:=q.merchant_id; NEW.buyer_boutique_id:=q.boutique_id;
  NEW.quantity:=(q.payload->>'quantity')::integer; NEW.product_name:=q.product_name; NEW.status:='draft'; NEW.created_by:=auth.uid();
 END IF;
 IF NEW.destination_type NOT IN('warehouse','logistics_partner') OR NEW.destination_id IS NULL
 OR NOT EXISTS(SELECT 1 FROM public.logistics_partners WHERE id=NEW.destination_id AND status='active')
 THEN RAISE EXCEPTION 'bib_logistics_destination_required' USING ERRCODE='22023'; END IF;
 NEW.destination_name:=(SELECT name FROM public.logistics_partners WHERE id=NEW.destination_id);
 IF TG_OP='UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NOT (
  (OLD.status='draft' AND NEW.status IN('sent','cancelled')) OR
  (OLD.status='sent' AND NEW.status IN('acknowledged','in_production','cancelled')) OR
  (OLD.status='acknowledged' AND NEW.status IN('in_production','cancelled')) OR
  (OLD.status='in_production' AND NEW.status IN('shipped','cancelled')) OR
  (OLD.status='shipped' AND NEW.status='received'))
 THEN RAISE EXCEPTION 'supply_restock_transition_conflict' USING ERRCODE='40001'; END IF;
 IF NEW.status IN('sent','acknowledged','in_production','shipped') AND NOT public.supply_quote_eligible(q)
 THEN RAISE EXCEPTION 'current_supplier_admission_required' USING ERRCODE='55000'; END IF;
 IF NEW.status IN('in_production','shipped') THEN
  SELECT * INTO settlement FROM public.merchant_supply_settlements WHERE quote_id=q.id;
  IF settlement.state IN('refunded','partially_refunded','disputed') OR NOT(coalesce((q.coverage->>'amount_cents')::bigint,0)>=(q.totals->>'total_cents')::bigint AND coalesce((q.coverage->>'valid_until')::timestamptz,'-infinity')>now())
  THEN RAISE EXCEPTION 'financial_coverage_required_before_production' USING ERRCODE='55000'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER supply_restock_guard BEFORE INSERT OR UPDATE ON public.supplier_restock_orders FOR EACH ROW EXECUTE FUNCTION public.guard_supply_restock_order();
REVOKE ALL ON FUNCTION public.guard_supply_restock_order() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.supply_restock_in_mode(p_quote_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.merchant_supply_quotes q WHERE q.id=p_quote_id AND q.test_account=public.intranet_is_test_mode());
$$;
REVOKE ALL ON FUNCTION public.supply_restock_in_mode(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.supply_restock_in_mode(uuid) TO authenticated;
CREATE POLICY supply_restock_test_isolation ON public.supplier_restock_orders AS RESTRICTIVE FOR ALL TO authenticated
 USING(supply_quote_id IS NULL OR public.supply_restock_in_mode(supply_quote_id)) WITH CHECK(supply_quote_id IS NULL OR public.supply_restock_in_mode(supply_quote_id));
