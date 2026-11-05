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
