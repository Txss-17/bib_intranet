-- An approved, effective departure stops new RH vault submissions and
-- access to RH file metadata, including with an old but not-yet-expired JWT.
-- This is NOT physical deletion, session revocation or closure of Auth.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_departure_access_blocked(p_employee uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $blocked$
 SELECT p_employee IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.rh_departure_cases c
  WHERE c.employee_id=p_employee AND c.status='approved'
    AND c.planned_at<=current_date
 );
$blocked$;
REVOKE ALL ON FUNCTION public.rh_departure_access_blocked(uuid)
 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rh_private_vault_guard_departure()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $guard$
BEGIN
 IF public.rh_departure_access_blocked(NEW.subject_id) THEN
   RAISE EXCEPTION 'rh_vault_departure_restriction'
     USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;
$guard$;
REVOKE ALL ON FUNCTION public.rh_private_vault_guard_departure()
 FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS trg_rh_private_vault_departure_guard
 ON public.rh_private_vault_documents;
CREATE TRIGGER trg_rh_private_vault_departure_guard
 BEFORE INSERT OR UPDATE OF subject_id,storage_path
 ON public.rh_private_vault_documents
 FOR EACH ROW EXECUTE FUNCTION public.rh_private_vault_guard_departure();

CREATE OR REPLACE FUNCTION public.rh_private_vault_status()
RETURNS TABLE(upload_enabled boolean,read_enabled boolean,max_size_bytes bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $status$
DECLARE v_actor uuid:=(SELECT auth.uid());
BEGIN
 IF v_actor IS NULL OR public.rh_departure_access_blocked(v_actor)
    OR NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id=v_actor
        AND p.app_origin='connect' AND p.hr_status='active'
        AND p.test_account IS FALSE
    ) THEN
   RAISE EXCEPTION 'rh_vault_access_denied' USING ERRCODE='42501';
 END IF;
 RETURN QUERY
 SELECT s.upload_enabled,s.read_enabled,s.max_size_bytes
 FROM public.rh_private_vault_settings s WHERE s.singleton IS TRUE;
END;
$status$;

CREATE OR REPLACE FUNCTION public.rh_my_private_vault_documents()
RETURNS TABLE(reference text,category text,state text,created_at timestamptz,retention_until timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $list$
DECLARE v_actor uuid:=(SELECT auth.uid());
BEGIN
 IF v_actor IS NULL OR public.rh_departure_access_blocked(v_actor)
   OR NOT EXISTS(
     SELECT 1 FROM public.profiles p WHERE p.id=v_actor
       AND p.app_origin='connect' AND p.hr_status='active'
       AND p.test_account IS FALSE
   ) THEN RAISE EXCEPTION 'rh_vault_access_denied' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT d.reference,d.category,d.state,d.created_at,d.retention_until
 FROM public.rh_private_vault_documents d WHERE d.subject_id=v_actor
 ORDER BY d.created_at DESC LIMIT 100;
END;
$list$;
REVOKE ALL ON FUNCTION public.rh_private_vault_status()
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rh_my_private_vault_documents()
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_private_vault_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_my_private_vault_documents() TO authenticated;

-- Explicit restrictive policies close the older-token RH document gap when
-- a departure is effective. They add to existing portfolio RLS; no grants.
DROP POLICY IF EXISTS rh_departure_stop_documents_select ON public.rh_employee_documents;
CREATE POLICY rh_departure_stop_documents_select
 ON public.rh_employee_documents AS RESTRICTIVE
 FOR SELECT TO authenticated
 USING (NOT public.rh_departure_access_blocked((SELECT auth.uid())));

DROP POLICY IF EXISTS rh_departure_stop_documents_insert ON public.rh_employee_documents;
CREATE POLICY rh_departure_stop_documents_insert
 ON public.rh_employee_documents AS RESTRICTIVE
 FOR INSERT TO authenticated
 WITH CHECK(NOT public.rh_departure_access_blocked((SELECT auth.uid())));

DROP POLICY IF EXISTS rh_departure_stop_documents_update ON public.rh_employee_documents;
CREATE POLICY rh_departure_stop_documents_update
 ON public.rh_employee_documents AS RESTRICTIVE
 FOR UPDATE TO authenticated
 USING(NOT public.rh_departure_access_blocked((SELECT auth.uid())))
 WITH CHECK(NOT public.rh_departure_access_blocked((SELECT auth.uid())));

DROP POLICY IF EXISTS rh_departure_stop_documents_delete ON public.rh_employee_documents;
CREATE POLICY rh_departure_stop_documents_delete
 ON public.rh_employee_documents AS RESTRICTIVE
 FOR DELETE TO authenticated
 USING(NOT public.rh_departure_access_blocked((SELECT auth.uid())));

-- CEO/security lead view: only counts, no document bytes, file names, IDs or
-- file paths. An approved case does NOT authorize automatic legal deletion.
CREATE OR REPLACE FUNCTION public.rh_departure_documentary_preflight(p_case uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $preflight$
DECLARE
 v_actor uuid:=(SELECT auth.uid());
 v_target uuid;
 v_case public.rh_departure_cases%ROWTYPE;
 v_role boolean;
 v_rh_docs bigint;
 v_vault_docs bigint;
 v_quarantined bigint;
 v_unscanned bigint;
 v_retained bigint;
 v_grants bigint;
 v_rules_missing bigint;
 v_attestations bigint;
BEGIN
 IF v_actor IS NULL OR p_case IS NULL
   OR NOT EXISTS (
     SELECT 1 FROM public.profiles p WHERE p.id=v_actor
       AND p.app_origin='connect' AND p.hr_status='active' AND p.test_account IS FALSE
   ) THEN RAISE EXCEPTION 'rh_departure_documents_forbidden' USING ERRCODE='42501'; END IF;
 v_role:=public.is_canonical_bib_ceo(v_actor)
   OR EXISTS (
     SELECT 1 FROM public.access_assignments aa
     JOIN public.access_roles ar ON ar.id=aa.role_id
     WHERE aa.employee_id=v_actor AND aa.status='active'
       AND ar.status='active' AND ar.role_key='responsable_tech'
       AND (aa.starts_at IS NULL OR aa.starts_at<=now())
       AND (aa.ends_at IS NULL OR aa.ends_at>now())
   );
 IF NOT v_role THEN RAISE EXCEPTION 'rh_departure_documents_forbidden' USING ERRCODE='42501'; END IF;

 SELECT * INTO v_case FROM public.rh_departure_cases c WHERE c.id=p_case;
 IF NOT FOUND THEN RAISE EXCEPTION 'rh_departure_case_missing' USING ERRCODE='P0002'; END IF;
 IF v_actor=v_case.employee_id THEN
   RAISE EXCEPTION 'rh_departure_documents_subject_forbidden' USING ERRCODE='42501';
 END IF;
 v_target:=v_case.employee_id;

 SELECT count(*) INTO v_rh_docs FROM public.rh_employee_documents d
  WHERE d.employee_id=v_target;
 SELECT count(*) INTO v_vault_docs FROM public.rh_private_vault_documents d
  WHERE d.subject_id=v_target AND d.state<>'deleted';
 SELECT count(*) INTO v_quarantined FROM public.rh_private_vault_documents d
  WHERE d.subject_id=v_target AND d.state='quarantined';
 SELECT count(*) INTO v_unscanned FROM public.rh_private_vault_documents d
  WHERE d.subject_id=v_target AND d.state IN('reserved','quarantined','failed','scan_rejected');
 SELECT count(*) INTO v_retained FROM public.rh_private_vault_documents d
  WHERE d.subject_id=v_target AND d.state<>'deleted'
    AND d.retention_until>now();
 SELECT count(*) INTO v_grants FROM public.hr_leadership_document_review_grants g
  WHERE (g.subject_id=v_target OR g.reviewer_id=v_target)
    AND g.revoked_at IS NULL AND g.expires_at>now();
 SELECT count(*) INTO v_attestations FROM public.hr_leadership_identity_attestations a
  WHERE (a.subject_id=v_target OR a.verifier_id=v_target) AND a.status='verified';
 SELECT count(*) INTO v_rules_missing FROM public.rh_private_vault_retention_rules r
   WHERE r.purpose_code IS NULL OR r.retention_days IS NULL
      OR r.legal_reviewed_at IS NULL OR r.approved_by IS NULL;

 RETURN jsonb_build_object(
  'case_id',v_case.id,
  'status',v_case.status,
  'effective_date_reached',v_case.planned_at<=current_date,
  'ordinary_rh_documents',v_rh_docs,
  'private_vault_documents',v_vault_docs,
  'private_vault_quarantined',v_quarantined,
  'private_vault_unreleased_or_failed',v_unscanned,
  'private_vault_under_retention',v_retained,
  'active_leadership_document_shares',v_grants,
  'active_leadership_identity_attestations',v_attestations,
  'unapproved_retention_categories',v_rules_missing,
  'documents_deleted',false,
  'sessions_revoked',false,
  'safe_to_close',false,
  'warning','Ce bilan ne supprime aucune donnée. Révoquer les droits, organiser la passation et décider la conservation légale avant toute clôture.'
 );
END;
$preflight$;

REVOKE ALL ON FUNCTION public.rh_departure_documentary_preflight(uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_departure_documentary_preflight(uuid)
 TO authenticated;

COMMIT;
