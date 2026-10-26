ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customization_capabilities jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customization_terms jsonb NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.validate_customization_metadata(p_caps jsonb, p_terms jsonb, p_details jsonb)
RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
DECLARE item record; entry jsonb;
BEGIN
  IF p_caps IS NULL OR p_terms IS NULL OR p_details IS NULL OR jsonb_typeof(p_caps) <> 'object' OR jsonb_typeof(p_terms) <> 'object' OR jsonb_typeof(p_details) <> 'object' THEN
    RAISE EXCEPTION 'invalid_customization_object' USING ERRCODE='22023';
  END IF;
  FOR item IN SELECT key,value FROM jsonb_each(p_caps) LOOP
    IF item.key='text' THEN
      IF jsonb_typeof(item.value)<>'boolean' THEN RAISE EXCEPTION 'invalid_text_capability' USING ERRCODE='22023'; END IF;
    ELSIF item.key IN ('logo','colors','materials','finishes','packaging','marking','dimensions') THEN
      IF jsonb_typeof(item.value)<>'array' OR jsonb_array_length(item.value)>50 THEN RAISE EXCEPTION 'invalid_capability_list' USING ERRCODE='22023'; END IF;
      FOR entry IN SELECT value FROM jsonb_array_elements(item.value) LOOP
        IF jsonb_typeof(entry)<>'string' OR char_length(btrim(entry #>> '{}')) NOT BETWEEN 1 AND 120
           OR (item.key='colors' AND (entry #>> '{}') !~ '^#[0-9A-Fa-f]{6}$') THEN
          RAISE EXCEPTION 'invalid_capability_value' USING ERRCODE='22023';
        END IF;
      END LOOP;
    ELSE RAISE EXCEPTION 'unsupported_capability_field' USING ERRCODE='22023';
    END IF;
  END LOOP;
  FOR item IN SELECT key,value FROM jsonb_each(p_terms) LOOP
    IF item.key IN ('moq','lead_time_days','surcharge_cents') THEN
      IF jsonb_typeof(item.value)<>'number' OR item.value::text !~ '^[0-9]+$'
         OR item.value::numeric > 10000000 OR (item.key<>'surcharge_cents' AND item.value::numeric < 1) THEN
        RAISE EXCEPTION 'invalid_customization_term' USING ERRCODE='22023';
      END IF;
    ELSIF item.key='currency' THEN
      IF jsonb_typeof(item.value)<>'string' OR (item.value #>> '{}') !~ '^[A-Z]{3}$' THEN RAISE EXCEPTION 'invalid_customization_currency' USING ERRCODE='22023'; END IF;
    ELSIF item.key='sample_required' THEN
      IF item.value <> 'true'::jsonb THEN RAISE EXCEPTION 'physical_sample_required' USING ERRCODE='22023'; END IF;
    ELSE RAISE EXCEPTION 'unsupported_customization_term' USING ERRCODE='22023'; END IF;
  END LOOP;
  IF p_terms ? 'surcharge_cents' AND NOT (p_terms ? 'currency') THEN
    RAISE EXCEPTION 'customization_currency_required' USING ERRCODE='22023';
  END IF;
  FOR item IN SELECT key,value FROM jsonb_each(p_details) LOOP
    IF item.key IN ('origin','weight','dimensions','ingredients','shelf_life') THEN
      IF jsonb_typeof(item.value)<>'string' OR char_length(item.value #>> '{}') > (CASE WHEN item.key='ingredients' THEN 4000 ELSE 300 END) THEN
        RAISE EXCEPTION 'invalid_catalog_detail' USING ERRCODE='22023';
      END IF;
    ELSIF item.key='gallery' THEN
      IF jsonb_typeof(item.value)<>'array' OR jsonb_array_length(item.value)>20 THEN RAISE EXCEPTION 'invalid_catalog_gallery' USING ERRCODE='22023'; END IF;
      FOR entry IN SELECT value FROM jsonb_array_elements(item.value) LOOP
        IF jsonb_typeof(entry)<>'string' OR char_length(entry #>> '{}')>2048 OR (entry #>> '{}') !~ '^https://[^/@[:space:]]+(/|$)' THEN RAISE EXCEPTION 'https_url_required' USING ERRCODE='22023'; END IF;
      END LOOP;
    ELSE RAISE EXCEPTION 'unsupported_catalog_detail' USING ERRCODE='22023'; END IF;
  END LOOP;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.validate_intranet_customization_metadata()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  PERFORM public.validate_customization_metadata(NEW.customization_capabilities,NEW.customization_terms,'{}'::jsonb);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_intranet_customization_metadata ON public.products;
CREATE TRIGGER validate_intranet_customization_metadata BEFORE INSERT OR UPDATE OF customization_capabilities,customization_terms
ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_intranet_customization_metadata();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.can_access_product_customization(p_product_id uuid,p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT p_user_id IS NOT NULL
  AND (p_user_id=auth.uid() OR auth.role()='service_role')
  AND (
    public.is_leadership(p_user_id) OR public.has_role(p_user_id,'admin'::public.app_role)
    OR public.has_any_pole(p_user_id,ARRAY['tech','product'])
    OR (public.has_any_pole(p_user_id,ARRAY['supplier']) AND EXISTS (
      SELECT 1 FROM public.products p JOIN public.portfolio_assignments a ON a.supplier_id=p.supplier_id
      WHERE p.id=p_product_id AND (a.assigned_to_id=p_user_id OR a.portfolio_id IN (
        SELECT id FROM public.supplier_portfolios WHERE responsible_id=p_user_id OR backup_id=p_user_id
      ))
    ))
  );
$$;
CREATE OR REPLACE FUNCTION public.can_manage_product_customization(p_product_id uuid,p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT public.can_access_product_customization(p_product_id,p_user_id)
    AND (public.is_leadership(p_user_id) OR public.has_role(p_user_id,'admin'::public.app_role) OR public.has_role(p_user_id,'manager'::public.app_role));
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.save_catalog_customization(p_product_id uuid,p_capabilities jsonb,p_terms jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result_row public.products%ROWTYPE;
BEGIN
  IF NOT coalesce(public.can_manage_product_customization(p_product_id),false) THEN RAISE EXCEPTION 'catalog_customization_forbidden' USING ERRCODE='42501'; END IF;
  PERFORM public.validate_customization_metadata(p_capabilities,p_terms,'{}'::jsonb);
  UPDATE public.products SET customization_capabilities=p_capabilities,customization_terms=p_terms,updated_at=clock_timestamp()
  WHERE id=p_product_id RETURNING * INTO result_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'catalog_product_not_found' USING ERRCODE='P0002'; END IF;
  RETURN jsonb_build_object('id',result_row.id,'customization_capabilities',result_row.customization_capabilities,'customization_terms',result_row.customization_terms);
END;
$$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.platform_customization_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), platform_dossier_id uuid NOT NULL UNIQUE,
  platform_product_id uuid NOT NULL, intranet_product_id uuid NOT NULL REFERENCES public.products(id),
  version integer NOT NULL CHECK (version>=1), merchant_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  supplier_status text NOT NULL CHECK (supplier_status IN ('not_requested','submitted','in_review','approved','changes_requested','rejected')),
  supplier_comment text, source_updated_at timestamptz NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_customization_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_customization_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.platform_customization_requests TO authenticated;
GRANT ALL ON public.platform_customization_requests TO service_role;
DROP POLICY IF EXISTS "Staff read assigned customization requests" ON public.platform_customization_requests;
CREATE POLICY "Staff read assigned customization requests" ON public.platform_customization_requests FOR SELECT TO authenticated
USING (public.can_access_product_customization(intranet_product_id));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.upsert_platform_customization_request(p_row jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result_id uuid;
BEGIN
  IF p_row IS NULL OR jsonb_typeof(p_row)<>'object' OR p_row->'merchant_config' IS NULL OR jsonb_typeof(p_row->'merchant_config')<>'object' THEN
    RAISE EXCEPTION 'invalid_customization_request' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.platform_customization_requests(platform_dossier_id,platform_product_id,intranet_product_id,version,merchant_config,supplier_status,supplier_comment,source_updated_at)
  VALUES((p_row->>'platform_dossier_id')::uuid,(p_row->>'platform_product_id')::uuid,(p_row->>'intranet_product_id')::uuid,
    (p_row->>'version')::integer,p_row->'merchant_config',p_row->>'supplier_status',p_row->>'supplier_comment',(p_row->>'source_updated_at')::timestamptz)
  ON CONFLICT(platform_dossier_id) DO UPDATE SET platform_product_id=EXCLUDED.platform_product_id,intranet_product_id=EXCLUDED.intranet_product_id,
    version=EXCLUDED.version,merchant_config=EXCLUDED.merchant_config,supplier_status=EXCLUDED.supplier_status,
    supplier_comment=EXCLUDED.supplier_comment,source_updated_at=EXCLUDED.source_updated_at,updated_at=clock_timestamp()
  WHERE EXCLUDED.version>public.platform_customization_requests.version
    OR (EXCLUDED.version=public.platform_customization_requests.version AND EXCLUDED.source_updated_at>=public.platform_customization_requests.source_updated_at)
  RETURNING id INTO result_id;
  RETURN result_id;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.validate_customization_metadata(jsonb,jsonb,jsonb),public.can_access_product_customization(uuid,uuid),public.can_manage_product_customization(uuid,uuid),public.save_catalog_customization(uuid,jsonb,jsonb),public.upsert_platform_customization_request(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_product_customization(uuid,uuid),public.can_manage_product_customization(uuid,uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.save_catalog_customization(uuid,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_platform_customization_request(jsonb) TO service_role;
