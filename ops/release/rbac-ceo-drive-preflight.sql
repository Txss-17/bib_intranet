-- BIB Intranet: read-only RBAC/CEO and managed-document rollout preflight.
-- Run with the same database target as the Intranet before applying migrations.
-- No identities, emails, sensitive role assignments or documents are disclosed.
WITH ceo AS (
  SELECT id FROM public.access_roles WHERE role_key='ceo' AND status='active'
), expected AS (
  SELECT COUNT(*) AS total FROM public.access_interfaces i CROSS JOIN public.access_actions a
  WHERE i.status='active'
), permissions AS (
  SELECT count(*) FILTER (WHERE p.allowed) AS granted,
    count(DISTINCT p.interface_id) FILTER (WHERE p.allowed) AS interfaces_granted
  FROM public.access_permissions p JOIN ceo c ON c.id=p.role_id
), scope AS (
  SELECT bool_or(s.scope_key='global' AND rs.scope_value IS NULL) AS global_scope
  FROM ceo c JOIN public.access_role_scopes rs ON rs.role_id=c.id
  JOIN public.access_scopes s ON s.id=rs.scope_id
), accounts AS (
  SELECT count(*) AS assignments,
    count(*) FILTER(WHERE EXISTS(
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id=aa.employee_id AND ur.role='admin'
    )) AS technical_admin_assignments
  FROM public.access_assignments aa JOIN ceo c ON c.id=aa.role_id
  WHERE aa.status='active'
)
SELECT (SELECT count(*) FROM ceo) AS active_ceo_roles,
  (SELECT total FROM expected) AS required_interface_actions,
  (SELECT granted FROM permissions) AS ceo_allowed_actions,
  (SELECT interfaces_granted FROM permissions) AS ceo_allowed_interfaces,
  (SELECT coalesce(global_scope,false) FROM scope) AS ceo_global_scope,
  (SELECT assignments FROM accounts) AS ceo_active_assignments,
  (SELECT technical_admin_assignments FROM accounts) AS ceo_assignees_with_admin
;
SELECT name AS required_backend_function,
       EXISTS(SELECT 1 FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname=functions.name) AS present
FROM (VALUES ('replace_access_role_scopes'),('get_intranet_permissions'),
 ('list_intranet_documents')) AS functions(name)
ORDER BY name;
SELECT name AS required_document_table,
  EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace='public'::regnamespace
     AND c.relname=tables.name AND c.relkind IN ('r','p')) AS present
FROM (VALUES ('intranet_drive_documents'),('intranet_business_history')) AS tables(name)
ORDER BY name;
