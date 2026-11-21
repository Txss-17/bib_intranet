-- Scoped evidence review for existing CEO / RH accounts.
-- A subject chooses a specific registered BIB file and grants a named,
-- eligible reviewer temporary read-only access; never broad RH access.
BEGIN;

CREATE TABLE IF NOT EXISTS public.hr_leadership_document_review_grants (
  document_id uuid NOT NULL REFERENCES public.intranet_drive_documents(id) ON DELETE RESTRICT,
  subject_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  granted_by uuid NOT NULL REFERENCES public.profiles(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(document_id,subject_id,reviewer_id),
  CONSTRAINT leadership_review_grantee_distinct CHECK (subject_id<>reviewer_id),
  CONSTRAINT leadership_review_grant_duration CHECK (
    expires_at>granted_at AND expires_at<=granted_at+interval '14 days'
  )
);
ALTER TABLE public.hr_leadership_document_review_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_leadership_document_review_grants FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.hr_leadership_document_review_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.profiles(id),
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id),
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL CHECK(action IN ('granted','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_leadership_document_review_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_leadership_document_review_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rh_leadership_evidence_reviewer_allowed(p_reviewer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $role$
 SELECT p_reviewer IS NOT NULL AND EXISTS(
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

CREATE OR REPLACE FUNCTION public.rh_my_leadership_evidence_reviewers()
RETURNS TABLE(reviewer_id uuid,display_name text,"position" text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $reviewers$
DECLARE actor uuid:=(SELECT auth.uid());
BEGIN
  IF actor IS NULL OR NOT public.rh_leadership_evidence_reviewer_allowed(actor) THEN
    RAISE EXCEPTION 'rh_evidence_reviewer_list_forbidden' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT p.id,concat_ws(' ',p.first_name,p.last_name)::text,p.position::text
  FROM public.profiles p
  WHERE p.id<>actor AND public.rh_leadership_evidence_reviewer_allowed(p.id)
  ORDER BY p.position::text,p.last_name LIMIT 20;
END;
$reviewers$;

CREATE OR REPLACE FUNCTION public.rh_my_leadership_evidence_files()
RETURNS TABLE(document_id uuid,evidence_ref text,file_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $files$
DECLARE actor uuid:=(SELECT auth.uid());
BEGIN
  IF actor IS NULL OR NOT public.rh_leadership_evidence_reviewer_allowed(actor) THEN
    RAISE EXCEPTION 'rh_evidence_files_forbidden' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT f.id,d.document_reference,d.name
  FROM public.rh_employee_documents d
  JOIN public.intranet_drive_documents f
    ON f.id=public.rh_extract_managed_drive_id(d.document_url)
  WHERE d.employee_id=actor
    AND d.status IN ('valid','active')
    AND f.owner_id=actor
    AND f.test_account IS FALSE
    AND f.size_bytes>0
    AND nullif(btrim(f.file_id),'') IS NOT NULL
    AND d.document_reference IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.rh_drive_document_bindings b
      WHERE b.document_id=f.id AND b.employee_id=actor
    )
  ORDER BY d.created_at DESC LIMIT 100;
END;
$files$;

CREATE OR REPLACE FUNCTION public.rh_my_leadership_evidence_review_grants()
RETURNS TABLE(document_id uuid,reviewer_id uuid,reviewer_label text,evidence_ref text,
              expires_at timestamptz,revoked_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $list$
DECLARE actor uuid:=(SELECT auth.uid());
BEGIN
  IF actor IS NULL OR NOT public.rh_leadership_evidence_reviewer_allowed(actor) THEN
    RAISE EXCEPTION 'rh_evidence_grants_forbidden' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT g.document_id,g.reviewer_id,concat_ws(' ',p.first_name,p.last_name)::text,
    d.document_reference,g.expires_at,g.revoked_at
  FROM public.hr_leadership_document_review_grants g
  JOIN public.profiles p ON p.id=g.reviewer_id
  JOIN public.rh_employee_documents d
    ON d.employee_id=g.subject_id
      AND public.rh_extract_managed_drive_id(d.document_url)=g.document_id
  WHERE g.subject_id=actor
  ORDER BY g.granted_at DESC LIMIT 100;
END;
$list$;

CREATE OR REPLACE FUNCTION public.rh_grant_leadership_evidence_review(
  p_document_id uuid,p_reviewer_id uuid
) RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $grant$
DECLARE
  actor uuid:=(SELECT auth.uid());
  expiration timestamptz:=now()+interval '14 days';
BEGIN
  IF actor IS NULL OR actor=p_reviewer_id
     OR p_document_id IS NULL
     OR NOT public.rh_leadership_evidence_reviewer_allowed(actor)
     OR NOT public.rh_leadership_evidence_reviewer_allowed(p_reviewer_id)
  THEN RAISE EXCEPTION 'rh_evidence_grant_forbidden' USING ERRCODE='42501'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.rh_employee_documents d
    JOIN public.intranet_drive_documents f
      ON f.id=public.rh_extract_managed_drive_id(d.document_url)
    JOIN public.rh_drive_document_bindings b
      ON b.document_id=f.id AND b.employee_id=actor
    WHERE d.employee_id=actor
      AND d.status IN ('valid','active')
      AND d.document_reference IS NOT NULL
      AND f.id=p_document_id AND f.owner_id=actor
      AND f.test_account IS FALSE AND f.size_bytes>0
      AND nullif(btrim(f.file_id),'') IS NOT NULL
  ) THEN RAISE EXCEPTION 'rh_evidence_not_registered_or_owned' USING ERRCODE='42501'; END IF;

  INSERT INTO public.hr_leadership_document_review_grants (
    document_id,subject_id,reviewer_id,granted_by,granted_at,expires_at,revoked_at,updated_at
  ) VALUES(p_document_id,actor,p_reviewer_id,actor,now(),expiration,NULL,now())
  ON CONFLICT(document_id,subject_id,reviewer_id) DO UPDATE
    SET granted_by=excluded.granted_by,granted_at=excluded.granted_at,
        expires_at=excluded.expires_at,revoked_at=NULL,updated_at=now();

  INSERT INTO public.hr_leadership_document_review_events (
    document_id,subject_id,reviewer_id,actor_id,action
  ) VALUES(p_document_id,actor,p_reviewer_id,actor,'granted');
  RETURN expiration;
END;
$grant$;

CREATE OR REPLACE FUNCTION public.rh_revoke_leadership_evidence_review(
  p_document_id uuid,p_reviewer_id uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $revoke$
DECLARE actor uuid:=(SELECT auth.uid()); changed integer;
BEGIN
  IF actor IS NULL OR NOT public.rh_leadership_evidence_reviewer_allowed(actor)
  THEN RAISE EXCEPTION 'rh_evidence_revoke_forbidden' USING ERRCODE='42501'; END IF;
  UPDATE public.hr_leadership_document_review_grants
     SET revoked_at=now(),updated_at=now()
   WHERE document_id=p_document_id AND subject_id=actor
     AND reviewer_id=p_reviewer_id AND revoked_at IS NULL;
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed=1 THEN
    INSERT INTO public.hr_leadership_document_review_events(
      document_id,subject_id,reviewer_id,actor_id,action
    ) VALUES(p_document_id,actor,p_reviewer_id,actor,'revoked');
  END IF;
  RETURN changed=1;
END;
$revoke$;

-- The existing reader continues to be bound to ALL RH-employee bindings on
-- the document. An explicit grant covers only its matching subject and UUID.
CREATE OR REPLACE FUNCTION public.rh_may_read_linked_drive_document(p_document_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $can_read$
 SELECT (SELECT auth.uid()) IS NOT NULL
 AND NOT EXISTS(
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
         SELECT 1 FROM public.hr_leadership_document_review_grants grant_
         WHERE grant_.document_id=b.document_id
           AND grant_.subject_id=b.employee_id
           AND grant_.reviewer_id=(SELECT auth.uid())
           AND grant_.revoked_at IS NULL AND grant_.expires_at>now()
           AND public.rh_leadership_evidence_reviewer_allowed(grant_.subject_id)
           AND public.rh_leadership_evidence_reviewer_allowed((SELECT auth.uid()))
       )
     )
 );
$can_read$;

REVOKE ALL ON FUNCTION public.rh_may_read_linked_drive_document(uuid)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_may_read_linked_drive_document(uuid)
  TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.rh_open_leadership_evidence(
 p_subject_id uuid,p_evidence_ref text
) RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $open$
DECLARE
  v_actor uuid:=(SELECT auth.uid());
  v_document public.intranet_drive_documents%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR p_subject_id IS NULL
  THEN RAISE EXCEPTION 'rh_evidence_open_forbidden' USING ERRCODE='42501'; END IF;
  SELECT f.* INTO v_document
  FROM public.rh_employee_documents d
  JOIN public.intranet_drive_documents f
    ON f.id=public.rh_extract_managed_drive_id(d.document_url)
  WHERE d.employee_id=p_subject_id
    AND d.document_reference=p_evidence_ref
    AND d.status IN ('valid','active')
    AND f.test_account IS FALSE AND f.size_bytes>0
  LIMIT 1;
  IF NOT FOUND OR NOT public.can_read_intranet_drive_document(v_document) THEN
    RAISE EXCEPTION 'rh_evidence_open_forbidden' USING ERRCODE='42501';
  END IF;
  RETURN v_document.id;
END;
$open$;

DO $grants$
DECLARE item record;
BEGIN
  FOR item IN
    SELECT oid::regprocedure AS signature
    FROM pg_proc
    WHERE pronamespace='public'::regnamespace
      AND proname IN (
        'rh_leadership_evidence_reviewer_allowed',
        'rh_my_leadership_evidence_reviewers',
        'rh_my_leadership_evidence_files',
        'rh_my_leadership_evidence_review_grants',
        'rh_grant_leadership_evidence_review',
        'rh_revoke_leadership_evidence_review',
        'rh_open_leadership_evidence'
      )
  LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',item.signature); END LOOP;
END;
$grants$;

GRANT EXECUTE ON FUNCTION public.rh_my_leadership_evidence_reviewers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_my_leadership_evidence_files() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_my_leadership_evidence_review_grants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_grant_leadership_evidence_review(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_revoke_leadership_evidence_review(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_open_leadership_evidence(uuid,text) TO authenticated;

COMMIT;
