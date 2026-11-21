-- Offer only registered proof references for the seven leadership stages.
-- The UI uses these server-owned references instead of asking HR to invent one.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_leadership_evidence_options()
RETURNS TABLE(subject_id uuid, step_key text, evidence_ref text, label text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $options$
DECLARE
  actor uuid := (SELECT auth.uid());
  rights jsonb;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000';
  END IF;
  SELECT to_jsonb(public.get_hr_onboarding_permissions()) INTO rights;
  IF coalesce((rights->>'read')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  WITH leadership AS (
    SELECT p.id FROM public.profiles p
    WHERE p.position::text IN ('ceo','rh_manager')
      AND p.app_origin='connect' AND p.hr_status='active' AND p.test_account IS FALSE
  ), options AS (
    SELECT p.id AS id, 'assignment'::text AS stage,
      ('ACCESS:'||a.id::text)::text AS ref,
      (role.label||coalesce(' — '||nullif(a.scope_value,''),' — portée globale'))::text AS display
    FROM leadership p
    JOIN public.access_assignments a ON a.employee_id=p.id
    JOIN public.access_roles role ON role.id=a.role_id
    WHERE public.rh_leadership_evidence_verifiable(
      p.id,'assignment','ACCESS:'||a.id::text
    )

    UNION ALL
    SELECT r.created_user_id AS id,'identity'::text AS stage,
      r.reference::text AS ref,
      ('Dossier RH '||r.reference)::text AS display
    FROM public.hr_employee_requests r
    JOIN leadership p ON p.id=r.created_user_id
    WHERE public.rh_leadership_evidence_verifiable(p.id,'identity',r.reference)

    UNION ALL
    SELECT r.created_user_id AS id,'identity'::text AS stage,
      r.document_register_reference::text AS ref,
      ('Registre RH '||r.document_register_reference)::text AS display
    FROM public.hr_employee_requests r
    JOIN leadership p ON p.id=r.created_user_id
    WHERE r.document_register_reference IS NOT NULL
      AND public.rh_leadership_evidence_verifiable(p.id,'identity',r.document_register_reference)

    UNION ALL
    SELECT d.employee_id AS id, step.key::text AS stage,
      d.document_reference::text AS ref,
      (d.name||' — '||d.document_reference)::text AS display
    FROM public.rh_employee_documents d
    JOIN leadership p ON p.id=d.employee_id
    CROSS JOIN (VALUES ('identity'),('documents'),('hr_review'),
                       ('independent_review'),('access_security'),('integration')) step(key)
    WHERE d.document_reference IS NOT NULL
      AND public.rh_leadership_evidence_verifiable(p.id,step.key,d.document_reference)
  )
  SELECT o.id,o.stage,o.ref,o.display
  FROM options o ORDER BY o.id,o.stage,o.ref LIMIT 300;
END;
$options$;

REVOKE ALL ON FUNCTION public.rh_leadership_evidence_options()
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_leadership_evidence_options()
  TO authenticated;

COMMIT;
