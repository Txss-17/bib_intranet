CREATE TABLE IF NOT EXISTS public.platform_stock_restock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_request_id uuid NOT NULL UNIQUE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  platform_product_id uuid NOT NULL,
  platform_supplier_product_id uuid NOT NULL,
  platform_boutique_id uuid NOT NULL,
  boutique_name text,
  product_name text NOT NULL CHECK (char_length(btrim(product_name))>0),
  requested_quantity integer NOT NULL CHECK (requested_quantity>0),
  catalog_moq integer NOT NULL CHECK (catalog_moq>0),
  status text NOT NULL CHECK (status IN ('requested','approved','ordered','received','rejected','cancelled')),
  note text,
  review_comment text CHECK (char_length(review_comment)<=2000),
  version integer NOT NULL CHECK (version>=1),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL CHECK (updated_at>=created_at),
  platform_synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_restock_review_queue ON public.platform_stock_restock_requests(status,updated_at DESC);
ALTER TABLE public.platform_stock_restock_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_stock_restock_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.platform_stock_restock_requests TO authenticated;
GRANT ALL ON public.platform_stock_restock_requests TO service_role;
CREATE POLICY "Staff read assigned Platform restock requests" ON public.platform_stock_restock_requests
FOR SELECT TO authenticated USING (public.can_access_product_customization(product_id));
--> statement-breakpoint
-- Service-only mirror. Never touches stock or supplier purchasing tables.
CREATE OR REPLACE FUNCTION public.upsert_platform_stock_restock_request(p_row jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE incoming public.platform_stock_restock_requests%ROWTYPE;
  current_row public.platform_stock_restock_requests%ROWTYPE;
  result_id uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'platform_restock_mirror_forbidden' USING ERRCODE='42501';
  END IF;
  IF p_row IS NULL OR jsonb_typeof(p_row)<>'object' THEN
    RAISE EXCEPTION 'invalid_platform_restock_request' USING ERRCODE='22023';
  END IF;
  incoming := jsonb_populate_record(NULL::public.platform_stock_restock_requests,p_row);
  IF incoming.platform_request_id IS NULL OR incoming.product_id IS NULL
      OR incoming.platform_product_id IS NULL OR incoming.platform_supplier_product_id IS NULL
      OR incoming.platform_boutique_id IS NULL OR incoming.version IS NULL OR incoming.version<1
      OR incoming.requested_quantity IS NULL OR incoming.requested_quantity<1
      OR incoming.catalog_moq IS NULL OR incoming.catalog_moq<1
      OR incoming.status IS NULL OR incoming.status NOT IN ('requested','approved','ordered','received','rejected','cancelled')
      OR incoming.product_name IS NULL OR char_length(btrim(incoming.product_name))<1
      OR char_length(incoming.review_comment)>2000
      OR incoming.created_at IS NULL OR incoming.updated_at IS NULL OR incoming.updated_at<incoming.created_at THEN
    RAISE EXCEPTION 'invalid_platform_restock_request' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id=incoming.product_id AND platform_id=incoming.platform_supplier_product_id) THEN
    RAISE EXCEPTION 'platform_restock_catalog_mapping_missing' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(incoming.platform_request_id::text,0));
  SELECT * INTO current_row FROM public.platform_stock_restock_requests
    WHERE platform_request_id=incoming.platform_request_id FOR UPDATE;
  IF FOUND THEN
    IF current_row.product_id<>incoming.product_id OR current_row.platform_product_id<>incoming.platform_product_id
        OR current_row.platform_supplier_product_id<>incoming.platform_supplier_product_id
        OR current_row.platform_boutique_id<>incoming.platform_boutique_id OR current_row.created_at<>incoming.created_at THEN
      RAISE EXCEPTION 'platform_restock_identity_conflict' USING ERRCODE='40001';
    END IF;
    IF incoming.version<current_row.version THEN RETURN current_row.id; END IF;
    IF incoming.version=current_row.version THEN
      IF incoming.updated_at<>current_row.updated_at OR incoming.status<>current_row.status
          OR incoming.requested_quantity<>current_row.requested_quantity OR incoming.catalog_moq<>current_row.catalog_moq
          OR incoming.review_comment IS DISTINCT FROM current_row.review_comment
          OR incoming.note IS DISTINCT FROM current_row.note OR incoming.product_name<>current_row.product_name
          OR incoming.boutique_name IS DISTINCT FROM current_row.boutique_name THEN
        RAISE EXCEPTION 'platform_restock_version_conflict' USING ERRCODE='40001';
      END IF;
      RETURN current_row.id;
    END IF;
    IF incoming.updated_at<current_row.updated_at THEN
      RAISE EXCEPTION 'platform_restock_timestamp_conflict' USING ERRCODE='40001';
    END IF;
  END IF;
  INSERT INTO public.platform_stock_restock_requests (
    platform_request_id,product_id,platform_product_id,platform_supplier_product_id,platform_boutique_id,
    boutique_name,product_name,requested_quantity,catalog_moq,status,note,review_comment,version,created_at,updated_at
  ) VALUES (
    incoming.platform_request_id,incoming.product_id,incoming.platform_product_id,incoming.platform_supplier_product_id,incoming.platform_boutique_id,
    incoming.boutique_name,incoming.product_name,incoming.requested_quantity,incoming.catalog_moq,incoming.status,incoming.note,incoming.review_comment,
    incoming.version,incoming.created_at,incoming.updated_at
  ) ON CONFLICT(platform_request_id) DO UPDATE SET boutique_name=EXCLUDED.boutique_name,product_name=EXCLUDED.product_name,
    requested_quantity=EXCLUDED.requested_quantity,catalog_moq=EXCLUDED.catalog_moq,status=EXCLUDED.status,note=EXCLUDED.note,
    review_comment=EXCLUDED.review_comment,version=EXCLUDED.version,updated_at=EXCLUDED.updated_at,platform_synced_at=clock_timestamp()
  RETURNING id INTO result_id;
  RETURN result_id;
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_platform_stock_restock_request(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_platform_stock_restock_request(jsonb) TO service_role;
