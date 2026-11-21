-- BIB RH private vault, initially DISABLED. This is a quarantine-only
-- technical foundation; no sensitive document can be uploaded until a
-- security/RGPD officer configures a purpose + retention rule and enables it.
-- A separate approved malware scanner and access gateway are required
-- BEFORE any file is made available for review.
BEGIN;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES (
 'rh-personnel-vault','rh-personnel-vault',FALSE,5242880,
 ARRAY['application/pdf','image/png','image/jpeg']::text[]
)
ON CONFLICT(id) DO UPDATE
 SET public=FALSE,
     file_size_limit=5242880,
     allowed_mime_types=ARRAY['application/pdf','image/png','image/jpeg']::text[];

-- No SELECT/INSERT/UPDATE/DELETE policy is granted to browser users for
-- storage.objects in this bucket. Existing storage policies are specific
-- to other buckets. Only the authenticated Edge service may use service_role.
DO $policy$
BEGIN
 IF EXISTS (
   SELECT 1 FROM pg_policies p
   WHERE p.schemaname='storage' AND p.tablename='objects'
     AND (
       p.qual ILIKE '%rh-personnel-vault%'
       OR p.with_check ILIKE '%rh-personnel-vault%'
     )
 ) THEN RAISE EXCEPTION 'rh_vault_storage_policy_must_be_reviewed_before_release';
 END IF;
 IF NOT EXISTS (
   SELECT 1 FROM storage.buckets
   WHERE id='rh-personnel-vault' AND public IS FALSE
     AND file_size_limit<=5242880
 ) THEN RAISE EXCEPTION 'rh_vault_bucket_not_private'; END IF;
END;
$policy$;

CREATE TABLE IF NOT EXISTS public.rh_private_vault_settings (
 singleton boolean PRIMARY KEY DEFAULT TRUE CHECK (singleton),
 upload_enabled boolean NOT NULL DEFAULT FALSE,
 read_enabled boolean NOT NULL DEFAULT FALSE,
 max_size_bytes bigint NOT NULL DEFAULT 5242880
   CHECK (max_size_bytes BETWEEN 1024 AND 5242880),
 last_approved_by uuid REFERENCES public.profiles(id),
 last_approved_at timestamptz,
 CONSTRAINT rh_vault_activation_requires_approval CHECK (
  (upload_enabled IS FALSE AND read_enabled IS FALSE)
  OR (last_approved_by IS NOT NULL AND last_approved_at IS NOT NULL)
 )
);
INSERT INTO public.rh_private_vault_settings (singleton,upload_enabled,read_enabled)
VALUES(TRUE,FALSE,FALSE) ON CONFLICT(singleton) DO NOTHING;
ALTER TABLE public.rh_private_vault_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rh_private_vault_settings FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.rh_private_vault_retention_rules (
 category text PRIMARY KEY
   CHECK(category IN ('identity','medical','payroll','disciplinary')),
 purpose_code text,
 retention_days integer CHECK(retention_days BETWEEN 1 AND 3650),
 legal_reviewed_at timestamptz,
 approved_by uuid REFERENCES public.profiles(id),
 CONSTRAINT vault_purpose_configuration_consistent CHECK (
   (purpose_code IS NULL AND retention_days IS NULL AND legal_reviewed_at IS NULL AND approved_by IS NULL)
   OR (nullif(btrim(purpose_code),'') IS NOT NULL
       AND retention_days IS NOT NULL AND legal_reviewed_at IS NOT NULL
       AND approved_by IS NOT NULL)
 )
);
INSERT INTO public.rh_private_vault_retention_rules(category)
VALUES('identity'),('medical'),('payroll'),('disciplinary')
ON CONFLICT(category) DO NOTHING;
ALTER TABLE public.rh_private_vault_retention_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rh_private_vault_retention_rules FROM PUBLIC,anon,authenticated;

CREATE SEQUENCE IF NOT EXISTS public.rh_private_vault_reference_seq;
REVOKE ALL ON SEQUENCE public.rh_private_vault_reference_seq FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.rh_private_vault_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 subject_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
 uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
 request_key uuid NOT NULL,
 reference text NOT NULL UNIQUE,
 category text NOT NULL CHECK(category IN ('identity','medical','payroll','disciplinary')),
 purpose_code text NOT NULL,
 storage_bucket text NOT NULL DEFAULT 'rh-personnel-vault'
   CHECK(storage_bucket='rh-personnel-vault'),
 storage_path text NOT NULL UNIQUE,
 mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','image/png','image/jpeg')),
 size_bytes bigint NOT NULL CHECK(size_bytes BETWEEN 1 AND 5242880),
 sha256 text NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
 state text NOT NULL DEFAULT 'reserved' CHECK(state IN (
   'reserved','quarantined','scan_rejected','clean','deletion_requested','deleted','failed'
 )),
 created_at timestamptz NOT NULL DEFAULT now(),
 quarantined_at timestamptz,
 scanned_at timestamptz,
 retention_until timestamptz NOT NULL,
 last_error_code text,
 CONSTRAINT rh_vault_idempotency UNIQUE(uploaded_by,request_key),
 CONSTRAINT rh_vault_reservation_subject CHECK(subject_id=uploaded_by),
 CONSTRAINT rh_vault_quarantine_state CHECK (
   state NOT IN ('quarantined','scan_rejected','clean') OR quarantined_at IS NOT NULL
 )
);
CREATE INDEX IF NOT EXISTS idx_rh_private_vault_subject
ON public.rh_private_vault_documents(subject_id,created_at DESC);
ALTER TABLE public.rh_private_vault_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rh_private_vault_documents FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.rh_private_vault_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 document_id uuid NOT NULL REFERENCES public.rh_private_vault_documents(id) ON DELETE RESTRICT,
 subject_id uuid NOT NULL REFERENCES public.profiles(id),
 actor_id uuid REFERENCES public.profiles(id),
 event_type text NOT NULL CHECK(event_type IN (
   'reserved','quarantined','scan_rejected','clean','deletion_requested','deleted','failed'
 )),
 occurred_at timestamptz NOT NULL DEFAULT now(),
 reason_code text
);
ALTER TABLE public.rh_private_vault_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rh_private_vault_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rh_private_vault_status()
RETURNS TABLE(upload_enabled boolean,read_enabled boolean,max_size_bytes bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $status$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid())
   AND p.app_origin='connect' AND p.hr_status='active' AND p.test_account IS FALSE
 ) THEN RAISE EXCEPTION 'rh_vault_access_denied' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT s.upload_enabled,s.read_enabled,s.max_size_bytes
 FROM public.rh_private_vault_settings s WHERE s.singleton IS TRUE;
END;
$status$;

CREATE OR REPLACE FUNCTION public.rh_reserve_private_vault_document(
 p_category text,p_mime_type text,p_size_bytes bigint,
 p_sha256 text,p_request_key uuid
) RETURNS TABLE(document_id uuid,reference text,storage_path text,state text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO ''
AS $reserve$
DECLARE
 v_actor uuid:=(SELECT auth.uid());
 v_document public.rh_private_vault_documents%ROWTYPE;
 v_days integer;
 v_purpose text;
 v_max bigint;
BEGIN
 IF v_actor IS NULL OR p_request_key IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.profiles p WHERE p.id=v_actor
   AND p.app_origin='connect' AND p.hr_status='active' AND p.test_account IS FALSE
 ) THEN RAISE EXCEPTION 'rh_vault_access_denied' USING ERRCODE='42501'; END IF;

 SELECT s.max_size_bytes INTO v_max
 FROM public.rh_private_vault_settings s
 WHERE s.singleton AND s.upload_enabled IS TRUE AND s.last_approved_by IS NOT NULL;
 IF v_max IS NULL THEN
  RAISE EXCEPTION 'rh_vault_not_approved_for_upload' USING ERRCODE='42501';
 END IF;

 SELECT r.retention_days,r.purpose_code INTO v_days,v_purpose
 FROM public.rh_private_vault_retention_rules r
 WHERE r.category=p_category AND r.legal_reviewed_at IS NOT NULL AND r.approved_by IS NOT NULL;
 IF v_days IS NULL OR p_mime_type NOT IN ('application/pdf','image/png','image/jpeg')
    OR p_size_bytes NOT BETWEEN 1 AND LEAST(v_max,5242880)
    OR p_sha256 !~ '^[0-9a-f]{64}$'
 THEN RAISE EXCEPTION 'rh_vault_document_policy_invalid' USING ERRCODE='23514'; END IF;

 INSERT INTO public.rh_private_vault_documents(
   subject_id,uploaded_by,request_key,reference,category,purpose_code,
   storage_path,mime_type,size_bytes,sha256,retention_until
 )
 VALUES(
   v_actor,v_actor,p_request_key,
   'BIB-RH-VAULT-'||to_char(now(),'YYYY')||'-'||
     lpad(nextval('public.rh_private_vault_reference_seq'::regclass)::text,6,'0'),
   p_category,v_purpose,gen_random_uuid()::text||'/sealed',
   p_mime_type,p_size_bytes,p_sha256,now()+(v_days||' days')::interval
 )
 ON CONFLICT(uploaded_by,request_key) DO NOTHING
 RETURNING * INTO v_document;

 IF v_document.id IS NOT NULL THEN
  INSERT INTO public.rh_private_vault_events(document_id,subject_id,actor_id,event_type)
  VALUES(v_document.id,v_actor,v_actor,'reserved');
 ELSE
  SELECT * INTO v_document FROM public.rh_private_vault_documents d
  WHERE d.uploaded_by=v_actor AND d.request_key=p_request_key;
  IF v_document.id IS NULL OR v_document.category IS DISTINCT FROM p_category
     OR v_document.mime_type IS DISTINCT FROM p_mime_type
     OR v_document.size_bytes IS DISTINCT FROM p_size_bytes
     OR v_document.sha256 IS DISTINCT FROM p_sha256
     OR v_document.state NOT IN ('reserved','quarantined') THEN
    RAISE EXCEPTION 'rh_vault_idempotency_conflict' USING ERRCODE='23514';
  END IF;
 END IF;

 document_id:=v_document.id;reference:=v_document.reference;
 storage_path:=v_document.storage_path;state:=v_document.state;
 RETURN NEXT;
END;
$reserve$;

CREATE OR REPLACE FUNCTION public.rh_my_private_vault_documents()
RETURNS TABLE(reference text,category text,state text,created_at timestamptz,retention_until timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $list$
DECLARE v_actor uuid:=(SELECT auth.uid());
BEGIN
 IF v_actor IS NULL OR NOT EXISTS (
   SELECT 1 FROM public.profiles p
   WHERE p.id=v_actor AND p.app_origin='connect' AND p.hr_status='active'
     AND p.test_account IS FALSE
 ) THEN RAISE EXCEPTION 'rh_vault_access_denied' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT d.reference,d.category,d.state,d.created_at,d.retention_until
 FROM public.rh_private_vault_documents d
 WHERE d.subject_id=v_actor
 ORDER BY d.created_at DESC LIMIT 100;
END;
$list$;

REVOKE ALL ON FUNCTION public.rh_private_vault_status()
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rh_reserve_private_vault_document(
 text,text,bigint,text,uuid
) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rh_my_private_vault_documents()
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_private_vault_status()
 TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_reserve_private_vault_document(
 text,text,bigint,text,uuid
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_my_private_vault_documents()
 TO authenticated;

COMMIT;
