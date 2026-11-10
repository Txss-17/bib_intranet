-- Additive, service-only projection of the latest audit decision per supplier SKU.
-- The Platform submission UUID is linked immutably to a supplier; never resolve by email.
-- No internal staff notes, payment references, or private audit attachments are returned.
CREATE OR REPLACE FUNCTION public.list_supplier_portal_reference_decisions(p_submission_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  WITH latest AS (
    SELECT DISTINCT ON (btrim(d.entry->>'reference'))
      btrim(d.entry->>'reference') AS reference,
      d.entry->>'decision' AS decision,
      e.case_id, e.created_at AS decided_at,
      e.event_order
    FROM public.supplier_audit_portal_links l
    JOIN public.supplier_audit_cases c
      ON c.supplier_id=l.supplier_id AND c.test_account=false
    JOIN public.supplier_audit_case_events e
      ON e.case_id=c.id AND e.action='decide'
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(e.after_state->'reference_decisions')='array'
      THEN e.after_state->'reference_decisions' ELSE '[]'::jsonb END
    ) AS d(entry)
    WHERE l.platform_submission_id=p_submission_id
      AND e.after_state->>'report_approved_by' IS NOT NULL
      AND length(btrim(coalesce(d.entry->>'reference',''))) BETWEEN 1 AND 200
      AND d.entry->>'decision' IN ('admitted','refused','correction_required')
    ORDER BY btrim(d.entry->>'reference'), e.event_order DESC
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'reference',reference,'decision',decision,
    'case_id',case_id,'decided_at',decided_at
  ) ORDER BY reference),'[]'::jsonb) FROM latest;
$$;
REVOKE ALL ON FUNCTION public.list_supplier_portal_reference_decisions(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_supplier_portal_reference_decisions(uuid) TO service_role;
COMMENT ON FUNCTION public.list_supplier_portal_reference_decisions(uuid)
 IS 'Read-only, submission-scoped latest decision by supplier SKU; internal audit evidence is intentionally omitted.';
