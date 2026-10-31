-- BIB Intranet schema drift inspection. READ-ONLY.
-- Execute against target database before any migration. Never treats missing objects
-- as a reason to automatically apply historical migrations to production.
WITH expected_columns(table_name,column_name) AS (
 VALUES
 ('quality_alerts','is_nonconformity'),('quality_alerts','corrective_action'),
 ('quality_alerts','evidence'),('quality_alerts','document_ids'),
 ('quality_alerts','archived_at'),('quality_alerts','revision'),
 ('anomalies','team'),('anomalies','closure_kind'),('anomalies','closed_by'),
 ('support_tickets','archived_at'),('support_tickets','revision'),
 ('support_tickets','change_note'),('field_audits','change_note'),
 ('field_audits','correction_evidence'),('work_tasks','task_poles'),
 ('work_tasks','archived_at')
), expected_tables(table_name) AS (
 VALUES ('work_task_comments'),('work_task_history'),('support_ticket_notes'),
 ('intranet_business_tables'),('intranet_business_history'),
 ('intranet_drive_documents')
), expected_functions(function_name) AS (
 VALUES ('get_work_task_permissions'),('can_intranet_action'),
 ('can_intranet_action_for'),('create_support_ticket'),
 ('create_ops_anomaly'),('create_audit_mission')
)
SELECT 'column' AS object_kind,c.table_name||'.'||c.column_name AS object_name,
       EXISTS(SELECT 1 FROM information_schema.columns i
              WHERE i.table_schema='public' AND i.table_name=c.table_name
                AND i.column_name=c.column_name) AS present
FROM expected_columns c
UNION ALL
SELECT 'table',t.table_name,EXISTS(SELECT 1 FROM information_schema.tables i
             WHERE i.table_schema='public' AND i.table_name=t.table_name)
FROM expected_tables t
UNION ALL
SELECT 'function',f.function_name,EXISTS(SELECT 1 FROM pg_proc p
             WHERE p.pronamespace='public'::regnamespace AND p.proname=f.function_name)
FROM expected_functions f
ORDER BY object_kind,object_name;
