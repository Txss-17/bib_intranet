-- BIB Product & Engineering: an auditable release readiness register.
-- This table does NOT run builds, tests, migrations or deploy applications.
-- An approval records a human decision; CI evidence is not automatically verified.
CREATE TABLE IF NOT EXISTS public.product_release_tracking (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL REFERENCES public.tech_requests(id) ON DELETE RESTRICT,
 app_key text NOT NULL CHECK (app_key IN ('bib_platform','bib_intranet','bib_audit_hub')),
 version text NOT NULL,
 environment text NOT NULL CHECK (environment IN ('sandbox','staging','production')),
 change_reference text,
 test_reference text,
 security_reference text,
 rollback_reference text,
 status text NOT NULL DEFAULT 'planning' CHECK(status IN ('planning','development','testing','review','approved','released','rolled_back')),
 reviewer_id uuid REFERENCES auth.users(id),
 reviewed_at timestamptz,
 deployed_at timestamptz,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 updated_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(request_id,app_key,version,environment),
 CONSTRAINT product_release_version_not_blank CHECK(length(trim(version)) BETWEEN 1 AND 80),
 CONSTRAINT product_release_approved_evidence CHECK(
   status NOT IN ('approved','released','rolled_back')
   OR (nullif(trim(coalesce(change_reference,'')),'') IS NOT NULL
     AND nullif(trim(coalesce(test_reference,'')),'') IS NOT NULL
     AND nullif(trim(coalesce(rollback_reference,'')),'') IS NOT NULL
     AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL)
 )
);
CREATE TABLE IF NOT EXISTS public.product_release_tracking_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 release_id uuid NOT NULL REFERENCES public.product_release_tracking(id) ON DELETE RESTRICT,
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 old_status text,
 new_status text NOT NULL,
 note text NOT NULL,
 at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_release_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_release_tracking_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_release_tracking,public.product_release_tracking_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.product_release_tracking,public.product_release_tracking_events TO authenticated;
DROP POLICY IF EXISTS product_release_read ON public.product_release_tracking;
CREATE POLICY product_release_read ON public.product_release_tracking FOR SELECT TO authenticated
USING (
 public.has_pole(auth.uid(),'product')
 OR public.is_leadership(auth.uid())
 OR public.has_role(auth.uid(),'admin'::public.app_role)
 OR EXISTS(SELECT 1 FROM public.tech_requests t WHERE t.id=request_id AND t.requester_id=auth.uid())
);
DROP POLICY IF EXISTS product_release_events_read ON public.product_release_tracking_events;
CREATE POLICY product_release_events_read ON public.product_release_tracking_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.product_release_tracking r WHERE r.id=release_id));

CREATE OR REPLACE FUNCTION public.save_product_release_tracking(
 p_id uuid,p_request_id uuid,p_app_key text,p_version text,p_environment text,
 p_change_reference text,p_test_reference text,p_security_reference text,
 p_rollback_reference text,p_status text,p_note text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $function$
DECLARE
 v_actor uuid:=auth.uid();
 v_old public.product_release_tracking%ROWTYPE;
 v_new_id uuid;
 v_review_id uuid;
 v_review_time timestamptz;
BEGIN
 IF v_actor IS NULL OR NOT (
   public.has_pole(v_actor,'product')
   OR public.has_role(v_actor,'admin'::public.app_role)
 ) THEN RAISE EXCEPTION 'Product Engineering authorization required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id=v_actor AND p.test_account IS FALSE AND p.app_origin='connect'
 ) THEN RAISE EXCEPTION 'Active Intranet employee identity required' USING ERRCODE='42501'; END IF;
 IF p_note IS NULL OR length(trim(p_note)) < 8 OR length(p_note)>3000
 OR p_version IS NULL OR length(trim(p_version)) NOT BETWEEN 1 AND 80
 OR p_app_key NOT IN ('bib_platform','bib_intranet','bib_audit_hub')
 OR p_environment NOT IN ('sandbox','staging','production')
 OR p_status NOT IN ('planning','development','testing','review','approved','released','rolled_back')
 OR p_request_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.tech_requests t WHERE t.id=p_request_id)
 THEN RAISE EXCEPTION 'Invalid release tracking request' USING ERRCODE='22023'; END IF;
 IF p_id IS NOT NULL THEN
  SELECT * INTO v_old FROM public.product_release_tracking WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Release record not found' USING ERRCODE='22023'; END IF;
  IF v_old.request_id<>p_request_id OR v_old.app_key<>p_app_key
    OR v_old.environment<>p_environment OR v_old.version<>p_version THEN
    RAISE EXCEPTION 'Release identity is immutable; create a new version' USING ERRCODE='22023';
  END IF;
  IF v_old.status IN ('released','rolled_back') AND p_status <> 'rolled_back' THEN
    RAISE EXCEPTION 'Released records are immutable except rollback recording' USING ERRCODE='42501';
  END IF;
 END IF;
 IF p_status IN ('approved','released','rolled_back') THEN
   IF nullif(trim(coalesce(p_change_reference,'')),'') IS NULL
   OR nullif(trim(coalesce(p_test_reference,'')),'') IS NULL
   OR nullif(trim(coalesce(p_rollback_reference,'')),'') IS NULL THEN
     RAISE EXCEPTION 'Change, test and rollback evidence required' USING ERRCODE='22023';
   END IF;
   IF p_environment='production' AND nullif(trim(coalesce(p_security_reference,'')),'') IS NULL THEN
     RAISE EXCEPTION 'Security review required for production' USING ERRCODE='22023';
   END IF;
   IF p_id IS NULL OR v_old.status NOT IN ('review','approved','released') THEN
     RAISE EXCEPTION 'Review required before approval or release' USING ERRCODE='22023';
   END IF;
   IF p_status='released' AND v_old.status <> 'approved' THEN
     RAISE EXCEPTION 'Approved release required before recording deployment' USING ERRCODE='22023';
   END IF;
   IF p_status='rolled_back' AND v_old.status <> 'released' THEN
     RAISE EXCEPTION 'Can only record rollback after release' USING ERRCODE='22023';
   END IF;
   IF p_status='approved' THEN
     v_review_id:=v_actor; v_review_time:=now();
   ELSE
     v_review_id:=v_old.reviewer_id; v_review_time:=v_old.reviewed_at;
   END IF;
 ELSE
   v_review_id:=NULL; v_review_time:=NULL;
 END IF;
 IF p_id IS NULL THEN
   INSERT INTO public.product_release_tracking(
    request_id,app_key,version,environment,change_reference,test_reference,
    security_reference,rollback_reference,status,created_by,updated_by)
   VALUES(p_request_id,p_app_key,trim(p_version),p_environment,
     p_change_reference,p_test_reference,p_security_reference,p_rollback_reference,p_status,v_actor,v_actor)
   RETURNING id INTO v_new_id;
 ELSE
   UPDATE public.product_release_tracking SET
    change_reference=p_change_reference,test_reference=p_test_reference,
    security_reference=p_security_reference,rollback_reference=p_rollback_reference,
    status=p_status,reviewer_id=v_review_id,reviewed_at=v_review_time,
    deployed_at=CASE WHEN p_status='released' THEN now() ELSE deployed_at END,
    updated_by=v_actor,updated_at=now()
   WHERE id=p_id RETURNING id INTO v_new_id;
 END IF;
 INSERT INTO public.product_release_tracking_events(release_id,actor_id,old_status,new_status,note)
 VALUES(v_new_id,v_actor,CASE WHEN p_id IS NULL THEN NULL ELSE v_old.status END,p_status,trim(p_note));
 RETURN v_new_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.save_product_release_tracking(uuid,uuid,text,text,text,text,text,text,text,text,text)
FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_product_release_tracking(uuid,uuid,text,text,text,text,text,text,text,text,text)
TO authenticated;
