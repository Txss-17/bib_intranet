-- Approved departures revoke the ability to use delegated BIB RH
-- documents, even when the leaver still holds a previously valid JWT.
-- Explicit cleanup of named shares is separate from external Drive ACL work.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_leadership_evidence_reviewer_allowed(p_reviewer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $role$
 SELECT p_reviewer IS NOT NULL
  AND NOT public.rh_departure_access_blocked(p_reviewer)
  AND EXISTS (
   SELECT 1 FROM public.profiles p WHERE p.id=p_reviewer
    AND p.app_origin='connect' AND p.hr_status='active'
    AND p.test_account IS FALSE
    AND (
      public.is_canonical_bib_ceo(p.id)
      OR (
        p.position::text='rh_manager' AND 'rh'=ANY(p.poles::text[])
        AND EXISTS (
         SELECT 1 FROM public.access_assignments aa
         JOIN public.access_roles ar ON ar.id=aa.role_id
         WHERE aa.employee_id=p.id AND aa.status='active'
          AND ar.status='active' AND ar.role_key='responsable_rh'
          AND (aa.starts_at IS NULL OR aa.starts_at<=now())
          AND (aa.ends_at IS NULL OR aa.ends_at>now())
        )
      )
    )
  );
$role$;
REVOKE ALL ON FUNCTION public.rh_leadership_evidence_reviewer_allowed(uuid)
 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rh_may_read_linked_drive_document(p_document_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $can_read$
 SELECT (SELECT auth.uid()) IS NOT NULL
 AND NOT public.rh_departure_access_blocked((SELECT auth.uid()))
 AND NOT EXISTS (
  SELECT 1 FROM public.rh_drive_document_bindings b
  WHERE b.document_id=p_document_id
   AND NOT (
    b.employee_id=(SELECT auth.uid())
    OR public.is_canonical_bib_ceo((SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.bib_case_portfolio_members member
      JOIN public.bib_case_portfolios portfolio ON portfolio.id=member.portfolio_id
      JOIN public.profiles manager ON manager.id=portfolio.owner_id
      WHERE member.entity_kind='employee'
        AND member.entity_id=b.employee_id AND member.ended_at IS NULL
        AND portfolio.pole='rh' AND portfolio.status='active'
        AND portfolio.owner_id=(SELECT auth.uid())
        AND manager.app_origin='connect' AND manager.hr_status='active'
        AND manager.test_account IS FALSE
    )
    OR EXISTS (
      SELECT 1 FROM public.hr_leadership_document_review_grants g
      WHERE g.document_id=b.document_id
       AND g.subject_id=b.employee_id
       AND g.reviewer_id=(SELECT auth.uid())
       AND g.revoked_at IS NULL AND g.expires_at>now()
       AND public.rh_leadership_evidence_reviewer_allowed(g.subject_id)
       AND public.rh_leadership_evidence_reviewer_allowed((SELECT auth.uid()))
    )
   )
 );
$can_read$;
REVOKE ALL ON FUNCTION public.rh_may_read_linked_drive_document(uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_may_read_linked_drive_document(uuid)
 TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.rh_departure_revoke_bib_review_shares(p_case uuid)
RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO ''
AS $revoke$
DECLARE v_actor uuid:=(SELECT auth.uid());
 v_case public.rh_departure_cases%ROWTYPE;
 v_revoked integer:=0;
BEGIN
 IF v_actor IS NULL OR NOT public.is_canonical_bib_ceo(v_actor)
   OR NOT public.can_intranet_action('rh.employees','validate') THEN
  RAISE EXCEPTION 'rh_departure_share_revoke_forbidden' USING ERRCODE='42501';
 END IF;

 SELECT * INTO v_case FROM public.rh_departure_cases c
 WHERE c.id=p_case FOR UPDATE;
 IF NOT FOUND OR v_case.status<>'approved'
   OR v_case.planned_at>current_date
   OR v_case.employee_id=v_actor
   OR v_case.requested_by=v_actor
   OR v_case.decided_by IS DISTINCT FROM v_actor
   OR v_case.requested_by=v_case.employee_id THEN
   RAISE EXCEPTION 'rh_departure_share_revoke_case_not_eligible'
      USING ERRCODE='42501';
 END IF;

 WITH revoked AS (
  UPDATE public.hr_leadership_document_review_grants g
  SET revoked_at=now(),updated_at=now()
  WHERE (g.subject_id=v_case.employee_id OR g.reviewer_id=v_case.employee_id)
    AND g.revoked_at IS NULL
  RETURNING g.document_id,g.subject_id,g.reviewer_id
 ), audit AS (
  INSERT INTO public.hr_leadership_document_review_events(
    document_id,subject_id,reviewer_id,actor_id,action
  )
  SELECT r.document_id,r.subject_id,r.reviewer_id,v_actor,'revoked'
  FROM revoked r RETURNING id
 )
 SELECT count(*) INTO v_revoked FROM audit;

 RETURN v_revoked;
END;
$revoke$;
REVOKE ALL ON FUNCTION public.rh_departure_revoke_bib_review_shares(uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_departure_revoke_bib_review_shares(uuid)
 TO authenticated;

COMMIT;
