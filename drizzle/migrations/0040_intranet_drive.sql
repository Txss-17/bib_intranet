-- Controlled Drive documents. Provider credentials and file writes stay on the server.
CREATE TABLE public.intranet_document_jobs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid NOT NULL REFERENCES public.profiles(id),request_key uuid NOT NULL,page_id text NOT NULL REFERENCES public.intranet_modules(page_id),
 kind text NOT NULL CHECK(kind IN ('import','export','share')),request_hash text NOT NULL,metadata jsonb NOT NULL,status text NOT NULL DEFAULT 'running',
 lease_token uuid NOT NULL DEFAULT gen_random_uuid(),lease_until timestamptz NOT NULL DEFAULT now()+interval '3 minutes',file_id text,shortcut_id text,result jsonb,error_code text,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(actor_id,request_key));
CREATE TABLE public.intranet_drive_documents(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),job_id uuid UNIQUE REFERENCES public.intranet_document_jobs(id),file_id text NOT NULL UNIQUE,
 owner_id uuid NOT NULL REFERENCES public.profiles(id),page_id text NOT NULL REFERENCES public.intranet_modules(page_id),name text NOT NULL,mime_type text NOT NULL,size_bytes bigint NOT NULL DEFAULT 0,
 classification text NOT NULL CHECK(classification IN ('internal','confidential')),test_account boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.intranet_document_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),document_id uuid REFERENCES public.intranet_drive_documents(id),actor_id uuid NOT NULL REFERENCES public.profiles(id),action text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.intranet_share_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),document_id uuid NOT NULL REFERENCES public.intranet_drive_documents(id),recipient text NOT NULL,reason text NOT NULL,
 requested_by uuid NOT NULL REFERENCES public.profiles(id),status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','released')),
 approved_by uuid REFERENCES public.profiles(id),decision_note text,release_file_id text,created_at timestamptz NOT NULL DEFAULT now(),decided_at timestamptz,released_at timestamptz);
ALTER TABLE public.intranet_document_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intranet_drive_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intranet_document_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intranet_share_requests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.intranet_document_jobs,public.intranet_drive_documents,public.intranet_document_events,public.intranet_share_requests TO service_role;
CREATE OR REPLACE FUNCTION public.is_intranet_document_recipient(p_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE found boolean;
BEGIN
 IF to_regclass('public.rh_employee_documents')IS NULL THEN RETURN false;END IF;
 EXECUTE 'SELECT EXISTS(SELECT 1 FROM public.rh_employee_documents WHERE employee_id=auth.uid() AND status=''valid'' AND (document_url=$1 OR right(document_url,length($1))=$1))' INTO found USING '/documents?document='||p_id::text;
 RETURN found;
END;
$$;
REVOKE ALL ON FUNCTION public.is_intranet_document_recipient(uuid)FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.can_read_intranet_drive_document(p public.intranet_drive_documents)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_intranet_action('app.documents','read') AND EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND coalesce(me.test_account,false)=p.test_account)
 AND ((public.can_intranet_action(p.page_id,'read') AND (p.owner_id=auth.uid() OR p.classification='internal' OR public.can_intranet_action(p.page_id,'validate')))
 OR public.is_intranet_document_recipient(p.id) OR EXISTS(SELECT 1 FROM public.intranet_records r WHERE p.id=ANY(r.document_ids) AND public.can_read_intranet_record(r)));
$$;
CREATE OR REPLACE FUNCTION public.reserve_intranet_document_job(p_key uuid,p_page text,p_kind text,p_hash text,p_metadata jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_document_jobs%ROWTYPE;
BEGIN
 IF NOT public.can_intranet_action(p_page,'read') OR NOT public.can_intranet_action(p_page,'create') THEN RAISE EXCEPTION 'document_forbidden' USING ERRCODE='42501'; END IF;
 IF p_key IS NULL OR p_kind IS NULL OR p_kind NOT IN ('import','export','share') OR p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$' OR p_metadata IS NULL OR jsonb_typeof(p_metadata)<>'object' OR octet_length(p_metadata::text)>10000 THEN RAISE EXCEPTION 'invalid_document_request' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 SELECT * INTO r FROM public.intranet_document_jobs WHERE actor_id=auth.uid() AND request_key=p_key FOR UPDATE;
 IF FOUND THEN
  IF r.page_id<>p_page OR r.kind<>p_kind OR r.request_hash<>p_hash OR r.metadata<>p_metadata THEN RAISE EXCEPTION 'document_key_conflict' USING ERRCODE='40001'; END IF;
  IF r.status='done' THEN RETURN to_jsonb(r); END IF;
  IF r.status='running' AND r.lease_until>now() THEN RAISE EXCEPTION 'document_operation_running' USING ERRCODE='40001'; END IF;
  UPDATE public.intranet_document_jobs SET status='running',lease_token=gen_random_uuid(),lease_until=now()+interval '3 minutes',error_code=NULL,updated_at=now()WHERE id=r.id RETURNING * INTO r;
 ELSE
  INSERT INTO public.intranet_document_jobs(actor_id,request_key,page_id,kind,request_hash,metadata)VALUES(auth.uid(),p_key,p_page,p_kind,p_hash,p_metadata)RETURNING * INTO r;
 END IF;
 RETURN to_jsonb(r);
END;
$$;
CREATE OR REPLACE FUNCTION public.set_intranet_document_job_ids(p_job uuid,p_lease uuid,p_file text,p_shortcut text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_document_jobs%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'document_service_only' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.intranet_document_jobs WHERE id=p_job FOR UPDATE;
 IF NOT FOUND OR r.lease_token<>p_lease OR r.status<>'running' OR r.lease_until<now() THEN RAISE EXCEPTION 'document_lease_lost' USING ERRCODE='40001'; END IF;
 IF p_file IS NULL OR p_file !~ '^[A-Za-z0-9_-]{10,150}$' OR (r.file_id IS NOT NULL AND r.file_id<>p_file) OR (r.shortcut_id IS NOT NULL AND p_shortcut IS NOT NULL AND r.shortcut_id<>p_shortcut) THEN RAISE EXCEPTION 'invalid_document_file' USING ERRCODE='22023'; END IF;
 UPDATE public.intranet_document_jobs SET file_id=p_file,shortcut_id=coalesce(shortcut_id,p_shortcut),updated_at=now()WHERE id=p_job;
END;
$$;
CREATE OR REPLACE FUNCTION public.finish_intranet_document_job(p_job uuid,p_lease uuid,p_name text,p_mime text,p_size bigint,p_classification text,p_url text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_document_jobs%ROWTYPE; d public.intranet_drive_documents%ROWTYPE; result_value jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'document_service_only' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.intranet_document_jobs WHERE id=p_job FOR UPDATE;
 IF NOT FOUND OR r.lease_token<>p_lease OR r.status<>'running' OR r.file_id IS NULL OR r.lease_until<now() THEN RAISE EXCEPTION 'document_lease_lost' USING ERRCODE='40001'; END IF;
 IF length(btrim(coalesce(p_name,''))) NOT BETWEEN 1 AND 255 OR p_size IS NULL OR p_size<0 OR p_size>25000000 OR p_classification IS NULL OR p_classification NOT IN ('internal','confidential') OR p_mime IS NULL THEN RAISE EXCEPTION 'invalid_document_metadata' USING ERRCODE='22023'; END IF;
 INSERT INTO public.intranet_drive_documents(job_id,file_id,owner_id,page_id,name,mime_type,size_bytes,classification,test_account)
 VALUES(r.id,r.file_id,r.actor_id,r.page_id,p_name,p_mime,p_size,p_classification,coalesce((SELECT test_account FROM public.profiles WHERE id=r.actor_id),false))RETURNING * INTO d;
 result_value:=jsonb_build_object('id',d.id,'name',d.name,'mime_type',d.mime_type,'size_bytes',d.size_bytes,'classification',d.classification,'url','/documents?document='||d.id::text,'drive_url',p_url);
 UPDATE public.intranet_document_jobs SET status='done',result=result_value,updated_at=now()WHERE id=r.id;
 INSERT INTO public.intranet_document_events(document_id,actor_id,action,details)VALUES(d.id,r.actor_id,r.kind,jsonb_build_object('page_id',r.page_id,'job_id',r.id));
 RETURN result_value;
END;
$$;
CREATE OR REPLACE FUNCTION public.fail_intranet_document_job(p_job uuid,p_lease uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'document_service_only' USING ERRCODE='42501'; END IF;
 UPDATE public.intranet_document_jobs SET status='failed',error_code='provider_operation_failed',lease_until=now(),updated_at=now()WHERE id=p_job AND lease_token=p_lease AND status='running';
END;
$$;
CREATE OR REPLACE FUNCTION public.get_intranet_document_access(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d public.intranet_drive_documents%ROWTYPE;
BEGIN
 SELECT * INTO d FROM public.intranet_drive_documents WHERE id=p_id;
 IF NOT FOUND OR NOT public.can_read_intranet_drive_document(d) THEN RAISE EXCEPTION 'document_forbidden' USING ERRCODE='42501'; END IF;
 INSERT INTO public.intranet_document_events(document_id,actor_id,action)VALUES(d.id,auth.uid(),'view'); RETURN to_jsonb(d);
END;
$$;
CREATE OR REPLACE FUNCTION public.list_intranet_documents(p_search text DEFAULT '',p_page text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',d.id,'name',d.name,'mime_type',d.mime_type,'classification',d.classification,'owner_id',d.owner_id,'page_id',d.page_id,'size_bytes',d.size_bytes,'created_at',d.created_at) ORDER BY d.created_at DESC),'[]'::jsonb)
 FROM (SELECT x.* FROM public.intranet_drive_documents x WHERE public.can_read_intranet_drive_document(x)AND (p_page IS NULL OR x.page_id=p_page)AND x.name ILIKE '%'||left(coalesce(p_search,''),200)||'%' ORDER BY x.created_at DESC LIMIT 200)d;
$$;
CREATE OR REPLACE FUNCTION public.list_intranet_document_events()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb)FROM(
 SELECT e.id,e.document_id,d.name,e.action,e.actor_id,e.created_at,e.details FROM public.intranet_document_events e JOIN public.intranet_drive_documents d ON d.id=e.document_id
 WHERE public.can_read_intranet_drive_document(d)AND (e.actor_id=auth.uid()OR public.can_intranet_action(d.page_id,'validate'))ORDER BY e.created_at DESC LIMIT 200)x;
$$;
CREATE OR REPLACE FUNCTION public.request_intranet_external_share(p_document uuid,p_recipient text,p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d public.intranet_drive_documents%ROWTYPE; result uuid;
BEGIN
 SELECT * INTO d FROM public.intranet_drive_documents WHERE id=p_document;
 IF NOT FOUND OR NOT public.can_read_intranet_drive_document(d) OR NOT public.can_intranet_action(d.page_id,'create') THEN RAISE EXCEPTION 'document_forbidden' USING ERRCODE='42501'; END IF;
 IF d.mime_type<>'application/pdf'THEN RAISE EXCEPTION 'share_pdf_required' USING ERRCODE='22023';END IF;
 IF p_recipient IS NULL OR p_recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(p_recipient)>254 OR length(btrim(coalesce(p_reason,'')))NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'invalid_share_request' USING ERRCODE='22023'; END IF;
 INSERT INTO public.intranet_share_requests(document_id,recipient,reason,requested_by)VALUES(p_document,lower(p_recipient),btrim(p_reason),auth.uid())RETURNING id INTO result;
 INSERT INTO public.intranet_document_events(document_id,actor_id,action,details)VALUES(p_document,auth.uid(),'external_share_requested',jsonb_build_object('request_id',result,'recipient',lower(p_recipient)));
 RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.decide_intranet_external_share(p_id uuid,p_approve boolean,p_note text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_share_requests%ROWTYPE;d public.intranet_drive_documents%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.intranet_share_requests WHERE id=p_id FOR UPDATE;
 SELECT * INTO d FROM public.intranet_drive_documents WHERE id=r.document_id;
 IF r.id IS NULL OR NOT public.can_read_intranet_drive_document(d) OR NOT public.can_intranet_action(d.page_id,'validate') OR r.requested_by=auth.uid() THEN RAISE EXCEPTION 'share_approval_forbidden' USING ERRCODE='42501'; END IF;
 IF r.status<>'pending' OR p_approve IS NULL OR length(coalesce(p_note,''))>5000 OR (NOT p_approve AND length(btrim(coalesce(p_note,'')))=0) THEN RAISE EXCEPTION 'invalid_share_decision' USING ERRCODE='22023'; END IF;
 UPDATE public.intranet_share_requests SET status=CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,approved_by=auth.uid(),decision_note=nullif(btrim(p_note),''),decided_at=now()WHERE id=p_id;
 INSERT INTO public.intranet_document_events(document_id,actor_id,action,details)VALUES(d.id,auth.uid(),'external_share_decided',jsonb_build_object('request_id',p_id,'approved',p_approve));
END;
$$;
CREATE OR REPLACE FUNCTION public.list_intranet_external_shares()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.created_at DESC),'[]'::jsonb)FROM(
 SELECT r.*,d.name,d.page_id FROM public.intranet_share_requests r JOIN public.intranet_drive_documents d ON d.id=r.document_id
 WHERE public.can_read_intranet_drive_document(d)AND (r.requested_by=auth.uid()OR public.can_intranet_action(d.page_id,'validate'))ORDER BY r.created_at DESC LIMIT 200)x;
$$;
CREATE OR REPLACE FUNCTION public.get_approved_intranet_share(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_share_requests%ROWTYPE;d public.intranet_drive_documents%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.intranet_share_requests WHERE id=p_id;
 SELECT * INTO d FROM public.intranet_drive_documents WHERE id=r.document_id;
 IF r.id IS NULL OR d.test_account OR r.status NOT IN ('approved','released') OR r.approved_by IS NULL OR r.requested_by=r.approved_by OR r.decided_at<now()-interval '7 days' OR NOT public.can_read_intranet_drive_document(d)
 OR r.requested_by<>auth.uid()THEN RAISE EXCEPTION 'share_release_forbidden' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('request',to_jsonb(r),'document',to_jsonb(d));
END;
$$;
CREATE OR REPLACE FUNCTION public.finish_intranet_external_share(p_id uuid,p_file text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_share_requests%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'document_service_only' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.intranet_share_requests WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR p_file IS NULL OR p_file !~ '^[A-Za-z0-9_-]{10,150}$' OR r.status NOT IN ('approved','released') OR r.approved_by IS NULL OR r.approved_by=r.requested_by THEN RAISE EXCEPTION 'share_release_forbidden' USING ERRCODE='42501'; END IF;
 IF r.status='released' THEN
  IF r.release_file_id<>p_file THEN RAISE EXCEPTION 'share_release_conflict' USING ERRCODE='40001'; END IF;
  RETURN;
 END IF;
 UPDATE public.intranet_share_requests SET status='released',release_file_id=p_file,released_at=now() WHERE id=p_id;
 INSERT INTO public.intranet_document_events(document_id,actor_id,action,details) VALUES(r.document_id,r.requested_by,'external_share_released',jsonb_build_object('request_id',r.id,'recipient',r.recipient,'expires_at',now()+interval '7 days'));
END;
$$;

DO $$DECLARE f record;BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'AND p.proname IN (
 'can_read_intranet_drive_document','reserve_intranet_document_job','set_intranet_document_job_ids','finish_intranet_document_job','fail_intranet_document_job','get_intranet_document_access','list_intranet_documents','list_intranet_document_events','request_intranet_external_share','decide_intranet_external_share','list_intranet_external_shares','get_approved_intranet_share','finish_intranet_external_share')LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
 EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.can_read_intranet_drive_document(public.intranet_drive_documents),public.reserve_intranet_document_job(uuid,text,text,text,jsonb),public.get_intranet_document_access(uuid),public.list_intranet_documents(text,text),public.list_intranet_document_events(),public.request_intranet_external_share(uuid,text,text),public.decide_intranet_external_share(uuid,boolean,text),public.list_intranet_external_shares(),public.get_approved_intranet_share(uuid) TO authenticated;
