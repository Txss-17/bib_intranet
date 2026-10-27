\set ON_ERROR_STOP on
BEGIN;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.role',true),'') $$;
GRANT USAGE ON SCHEMA public,auth TO authenticated,service_role;
CREATE TYPE public.app_role AS ENUM ('admin','manager','employee');
CREATE TABLE public.test_staff(id uuid PRIMARY KEY,role public.app_role,poles text[],leadership boolean DEFAULT false);
CREATE FUNCTION public.is_leadership(p_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT coalesce((SELECT leadership FROM public.test_staff WHERE id=p_uid),false) $$;
CREATE FUNCTION public.has_role(p_uid uuid,p_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM public.test_staff WHERE id=p_uid AND role=p_role) $$;
CREATE FUNCTION public.has_any_pole(p_uid uuid,p_poles text[]) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM public.test_staff WHERE id=p_uid AND poles && p_poles) $$;
CREATE TABLE public.products(id uuid PRIMARY KEY,platform_id uuid,supplier_id uuid,updated_at timestamptz DEFAULT now());
CREATE TABLE public.supplier_portfolios(id uuid PRIMARY KEY,responsible_id uuid,backup_id uuid);
CREATE TABLE public.portfolio_assignments(supplier_id uuid,assigned_to_id uuid,portfolio_id uuid);
\ir ../../drizzle/migrations/0029_product_customization_bridge.sql
\ir ../../drizzle/migrations/0030_platform_restock_review.sql
INSERT INTO public.products(id,platform_id,supplier_id) VALUES
('10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000006');
INSERT INTO public.test_staff VALUES
('20000000-0000-4000-8000-000000000001','manager',ARRAY['supplier'],false),
('20000000-0000-4000-8000-000000000002','manager',ARRAY['supplier'],false),
('20000000-0000-4000-8000-000000000003','employee',ARRAY['supplier'],false);
INSERT INTO public.portfolio_assignments VALUES
('10000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000001',null),
('10000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000003',null);
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $$
DECLARE payload jsonb := '{
"platform_request_id":"10000000-0000-4000-8000-000000000001","platform_product_id":"10000000-0000-4000-8000-000000000002",
"platform_supplier_product_id":"10000000-0000-4000-8000-000000000003","product_id":"10000000-0000-4000-8000-000000000004",
"platform_boutique_id":"10000000-0000-4000-8000-000000000005","boutique_name":"Boutique","product_name":"Produit",
"requested_quantity":20,"catalog_moq":10,"status":"requested","note":null,"review_comment":null,"version":1,
"created_at":"2026-10-27T09:00:00Z","updated_at":"2026-10-27T09:00:00Z"}'::jsonb;
  saved uuid; again uuid; decided jsonb;
BEGIN
  saved:=public.upsert_platform_stock_restock_request(payload);
  again:=public.upsert_platform_stock_restock_request(payload);
  IF saved<>again THEN RAISE EXCEPTION 'replay duplicated request'; END IF;
  decided:=payload||'{"status":"approved","version":2,"review_comment":"Confirmé","updated_at":"2026-10-27T10:00:00Z"}'::jsonb;
  PERFORM public.upsert_platform_stock_restock_request(decided);
  PERFORM public.upsert_platform_stock_restock_request(payload);
  PERFORM public.upsert_platform_stock_restock_request(decided||'{"product_name":"Produit renommé","boutique_name":"Boutique renommée"}'::jsonb);
  IF (SELECT product_name FROM public.platform_stock_restock_requests WHERE id=saved)<>'Produit renommé' THEN RAISE EXCEPTION 'live enrichment rename rejected'; END IF;
  IF (SELECT status FROM public.platform_stock_restock_requests WHERE id=saved)<>'approved' THEN RAISE EXCEPTION 'late snapshot regressed decision'; END IF;
  BEGIN
    PERFORM public.upsert_platform_stock_restock_request(decided||'{"status":"rejected"}'::jsonb);
    RAISE EXCEPTION 'same version conflict accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN
    PERFORM public.upsert_platform_stock_restock_request(decided||'{"platform_product_id":"10000000-0000-4000-8000-000000000009","version":3}'::jsonb);
    RAISE EXCEPTION 'identity change accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN
    PERFORM public.upsert_platform_stock_restock_request(payload||'{"platform_supplier_product_id":"10000000-0000-4000-8000-000000000009"}'::jsonb);
    RAISE EXCEPTION 'catalog mismatch accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.upsert_platform_stock_restock_request(payload||'{"requested_quantity":0}'::jsonb);
    RAISE EXCEPTION 'zero quantity accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END;
$$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.platform_stock_restock_requests)<>1 THEN RAISE EXCEPTION 'assigned manager cannot read request'; END IF;
  IF NOT public.can_manage_product_customization('10000000-0000-4000-8000-000000000004') THEN RAISE EXCEPTION 'assigned manager cannot review'; END IF;
  IF public.can_manage_product_customization('10000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'caller can impersonate another manager'; END IF;
  BEGIN
    PERFORM public.upsert_platform_stock_restock_request('{}'::jsonb);
    RAISE EXCEPTION 'authenticated client can write mirror';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.platform_stock_restock_requests SET status='rejected';
    RAISE EXCEPTION 'authenticated client can update mirror';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.platform_stock_restock_requests) THEN RAISE EXCEPTION 'unassigned manager can read request'; END IF;
  IF public.can_manage_product_customization('10000000-0000-4000-8000-000000000004') THEN RAISE EXCEPTION 'unassigned manager can review'; END IF;
END;
$$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.platform_stock_restock_requests)<>1 THEN RAISE EXCEPTION 'assigned reader cannot read'; END IF;
  IF public.can_manage_product_customization('10000000-0000-4000-8000-000000000004') THEN RAISE EXCEPTION 'employee can review without manager role'; END IF;
END;
$$;
RESET ROLE;
DO $$
BEGIN
  IF has_table_privilege('anon','public.platform_stock_restock_requests','SELECT') THEN RAISE EXCEPTION 'anonymous can read requests'; END IF;
  IF has_function_privilege('authenticated','public.upsert_platform_stock_restock_request(jsonb)','EXECUTE') THEN RAISE EXCEPTION 'client can invoke privileged mirror'; END IF;
END;
$$;
ROLLBACK;
