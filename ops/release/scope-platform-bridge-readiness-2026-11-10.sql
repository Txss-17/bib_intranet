-- READ-ONLY BIB Intranet RBAC/Platform bridge readiness, 2026-11-10.
-- Run against the intended Intranet database; no writes, grants or migrations.
-- This audit does NOT prove that role scopes are enforced by each business RPC/RLS.
SELECT
 (SELECT count(*) FROM public.access_business_portfolios) AS access_portfolios,
 (SELECT count(*) FROM public.access_business_portfolios WHERE status='active') AS active_access_portfolios,
 (SELECT count(*) FROM public.access_scope_portfolios WHERE status='active') AS mapped_scope_portfolios,
 (SELECT count(*) FROM public.supplier_portfolios) AS supplier_business_portfolios,
 (SELECT count(*) FROM public.merchant_portfolios) AS merchant_business_portfolios,
 (SELECT count(*) FROM public.bib_case_portfolios) AS case_business_portfolios,
 (SELECT max(finished_at) FROM public.platform_sync_runs
  WHERE direction='pull' AND action='pull' AND status='success') AS last_successful_platform_pull,
 (SELECT max(finished_at) FROM public.platform_sync_runs
  WHERE direction='pull' AND action='pull') AS last_platform_pull;

SELECT r.role_key,s.scope_key,rs.scope_value
FROM public.access_role_scopes rs
JOIN public.access_roles r ON r.id=rs.role_id
JOIN public.access_scopes s ON s.id=rs.scope_id
WHERE r.status='active'
ORDER BY r.role_key,s.scope_key,rs.scope_value;

-- Verify organizational dimensions without exposing employee identities.
SELECT p.subsidiary,pole.pole,count(*) AS current_real_staff
FROM public.profiles p
CROSS JOIN LATERAL unnest(p.poles::text[]) AS pole(pole)
WHERE p.test_account=false AND p.subsidiary IS NOT NULL
GROUP BY p.subsidiary,pole.pole
ORDER BY p.subsidiary,pole.pole;

SELECT direction,action,status,items_count,started_at,finished_at,errors
FROM public.platform_sync_runs
ORDER BY started_at DESC LIMIT 10;

SELECT asp.subsidiary,asp.pole,abp.status AS portfolio_status,
 apt.business_pole AS declared_business_pole,
 count(*) AS links
FROM public.access_scope_portfolios asp
JOIN public.access_business_portfolios abp ON abp.id=asp.portfolio_id
JOIN public.access_portfolio_types apt ON apt.id=abp.portfolio_type_id
WHERE asp.status='active'
GROUP BY asp.subsidiary,asp.pole,abp.status,apt.business_pole
ORDER BY asp.subsidiary,asp.pole;
