-- Keep the one-argument live API for older callers. New callers choose the
-- data mode explicitly; only the private bridge can read this publication DTO.
CREATE FUNCTION public.get_catalog_acquisition_publication(p_product_id uuid,p_test_account boolean) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $publication$
 SELECT jsonb_build_object('price',p.price,'source_updated_at',p.approved_at)
 FROM public.catalog_acquisition_prices p
 JOIN public.products x ON x.id=p.product_id AND x.supplier_id=p.supplier_id
 WHERE p.product_id=p_product_id AND p.state='approved'
  AND p.test_account=p_test_account AND coalesce(x.test_account,false)=p_test_account;
$publication$;
CREATE OR REPLACE FUNCTION public.get_catalog_acquisition_publication(p_product_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $publication$
 SELECT public.get_catalog_acquisition_publication(p_product_id,false);
$publication$;
REVOKE ALL ON FUNCTION public.get_catalog_acquisition_publication(uuid,boolean),public.get_catalog_acquisition_publication(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_catalog_acquisition_publication(uuid,boolean),public.get_catalog_acquisition_publication(uuid) TO service_role;
