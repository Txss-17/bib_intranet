ALTER TABLE public.whistleblower_submissions
 ADD COLUMN IF NOT EXISTS intake_key uuid UNIQUE,
 ADD COLUMN IF NOT EXISTS intake_hash text,
 ADD COLUMN IF NOT EXISTS report_mode text NOT NULL DEFAULT 'anonymous',
 ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 1;
CREATE TABLE public.intranet_ethics_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),submission_id uuid NOT NULL REFERENCES public.whistleblower_submissions(id),actor_id uuid REFERENCES public.profiles(id),kind text NOT NULL,note text,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.intranet_ethics_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.intranet_ethics_events TO service_role;
CREATE OR REPLACE FUNCTION public.can_review_intranet_ethics(p_action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_intranet_action('ethics.received',p_action)AND (public.has_role(auth.uid(),'admin')OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid()AND p.poles::text[]&&ARRAY['audit','compliance']));
$$;
CREATE POLICY ethics_private_read_boundary ON public.whistleblower_submissions AS RESTRICTIVE FOR SELECT TO authenticated USING(public.can_review_intranet_ethics('read')AND coalesce(test_account,false)=coalesce((SELECT p.test_account FROM public.profiles p WHERE p.id=auth.uid()),false));
CREATE POLICY ethics_no_direct_insert ON public.whistleblower_submissions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY ethics_no_direct_update ON public.whistleblower_submissions AS RESTRICTIVE FOR UPDATE TO authenticated USING(false)WITH CHECK(false);
CREATE POLICY ethics_no_direct_delete ON public.whistleblower_submissions AS RESTRICTIVE FOR DELETE TO authenticated USING(false);
CREATE OR REPLACE FUNCTION public.store_intranet_ethics_report(p_key uuid,p_hash text,p_category text,p_severity text,p_ciphertext text,p_mode text,p_test boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.whistleblower_submissions%ROWTYPE;
BEGIN
 IF auth.role()IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'ethics_service_only' USING ERRCODE='42501'; END IF;
 IF p_key IS NULL OR p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$' OR length(coalesce(p_category,''))NOT BETWEEN 1 AND 100 OR p_severity IS NULL OR p_severity NOT IN ('low','medium','high','critical')OR p_mode IS NULL OR p_mode NOT IN ('anonymous','identified')OR p_test IS NULL OR length(coalesce(p_ciphertext,''))NOT BETWEEN 20 AND 100000 THEN RAISE EXCEPTION 'invalid_ethics_report' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 SELECT * INTO r FROM public.whistleblower_submissions WHERE intake_key=p_key;
 IF FOUND THEN IF r.intake_hash<>p_hash THEN RAISE EXCEPTION 'ethics_key_conflict' USING ERRCODE='40001'; END IF;
 ELSE
 INSERT INTO public.whistleblower_submissions(submission_code,category,severity,encrypted_content,status,intake_key,intake_hash,report_mode,test_account)
 VALUES('ETH-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),p_category,p_severity,p_ciphertext,'pending',p_key,p_hash,p_mode,p_test)RETURNING * INTO r;
 -- Anonymous intake stores no account identity in the case or its journal.
 INSERT INTO public.intranet_ethics_events(submission_id,kind)VALUES(r.id,'received');
 END IF;
 RETURN jsonb_build_object('reference',r.submission_code);
END;
$$;
CREATE OR REPLACE FUNCTION public.list_intranet_ethics(p_status text DEFAULT 'all')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_review_intranet_ethics('read')THEN RAISE EXCEPTION 'ethics_forbidden' USING ERRCODE='42501';END IF;
 RETURN(SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.created_at DESC),'[]'::jsonb)FROM(
 SELECT r.id,r.submission_code,r.category,r.severity,r.status,r.assigned_auditor_id,r.resolution_notes,r.revision,r.report_mode,r.created_at,r.updated_at
 FROM public.whistleblower_submissions r WHERE coalesce(r.test_account,false)=coalesce((SELECT p.test_account FROM public.profiles p WHERE p.id=auth.uid()),false)
 AND(p_status='all'OR (p_status='open'AND r.status<>'closed')OR r.status::text=p_status)ORDER BY r.created_at DESC LIMIT 200)x);
END;
$$;
CREATE OR REPLACE FUNCTION public.read_intranet_ethics(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.whistleblower_submissions%ROWTYPE;
BEGIN
 IF NOT public.can_review_intranet_ethics('read')THEN RAISE EXCEPTION 'ethics_forbidden' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.whistleblower_submissions WHERE id=p_id AND coalesce(test_account,false)=coalesce((SELECT p.test_account FROM public.profiles p WHERE p.id=auth.uid()),false);
 IF NOT FOUND THEN RAISE EXCEPTION 'ethics_forbidden' USING ERRCODE='42501';END IF;
 INSERT INTO public.intranet_ethics_events(submission_id,actor_id,kind)VALUES(p_id,auth.uid(),'viewed');RETURN jsonb_build_object('ciphertext',r.encrypted_content,'mode',r.report_mode);
END;
$$;
CREATE OR REPLACE FUNCTION public.update_intranet_ethics(p_id uuid,p_revision bigint,p_status text,p_assignee uuid,p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.whistleblower_submissions%ROWTYPE;
BEGIN
 IF NOT public.can_review_intranet_ethics('update')THEN RAISE EXCEPTION 'ethics_forbidden' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.whistleblower_submissions WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR coalesce(r.test_account,false)<>coalesce((SELECT p.test_account FROM public.profiles p WHERE p.id=auth.uid()),false)THEN RAISE EXCEPTION 'ethics_forbidden' USING ERRCODE='42501';END IF;
 IF p_revision IS NULL OR p_revision<>r.revision THEN RAISE EXCEPTION 'ethics_case_changed' USING ERRCODE='40001';END IF;
 IF length(coalesce(p_note,''))>10000 OR p_status IS NULL OR p_status NOT IN ('pending','under_review','investigating','resolved','closed')THEN RAISE EXCEPTION 'invalid_ethics_update' USING ERRCODE='22023';END IF;
 IF p_status='closed'AND(NOT public.can_review_intranet_ethics('validate')OR r.status<>'resolved'OR length(btrim(coalesce(p_note,'')))=0)THEN RAISE EXCEPTION 'ethics_closure_forbidden' USING ERRCODE='42501';END IF;
 IF p_status<>r.status::text AND NOT((r.status='pending'AND p_status='under_review')OR(r.status='under_review'AND p_status='investigating')OR(r.status='investigating'AND p_status='resolved')OR(r.status='resolved'AND p_status IN ('closed','investigating'))OR(r.status='closed'AND p_status='under_review'AND public.can_review_intranet_ethics('validate')))THEN RAISE EXCEPTION 'invalid_ethics_transition' USING ERRCODE='22023';END IF;
 IF p_status IN ('resolved','closed')AND length(btrim(coalesce(p_note,'')))=0 THEN RAISE EXCEPTION 'ethics_resolution_required' USING ERRCODE='22023';END IF;
 IF p_assignee IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_assignee AND p.hr_status='active'AND p.app_origin='connect'AND p.poles::text[]&&ARRAY['audit','compliance']AND coalesce(p.test_account,false)=r.test_account)THEN RAISE EXCEPTION 'ethics_assignee_forbidden' USING ERRCODE='42501';END IF;
 UPDATE public.whistleblower_submissions SET status=p_status::public.whistleblower_status,assigned_auditor_id=p_assignee,resolution_notes=CASE WHEN p_status IN ('resolved','closed')THEN btrim(p_note)ELSE resolution_notes END,revision=revision+1,updated_at=clock_timestamp()WHERE id=p_id;
 INSERT INTO public.intranet_ethics_events(submission_id,actor_id,kind,note)VALUES(p_id,auth.uid(),p_status,nullif(btrim(p_note),''));
END;
$$;
CREATE OR REPLACE FUNCTION public.list_intranet_ethics_events(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_review_intranet_ethics('read')OR NOT EXISTS(SELECT 1 FROM public.whistleblower_submissions r WHERE id=p_id AND coalesce(test_account,false)=coalesce((SELECT p.test_account FROM public.profiles p WHERE p.id=auth.uid()),false))THEN RAISE EXCEPTION 'ethics_forbidden' USING ERRCODE='42501';END IF;
 RETURN(SELECT coalesce(jsonb_agg(to_jsonb(e)ORDER BY e.created_at DESC),'[]'::jsonb)FROM public.intranet_ethics_events e WHERE e.submission_id=p_id);
END;
$$;
REVOKE ALL ON FUNCTION public.store_intranet_ethics_report(uuid,text,text,text,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.store_intranet_ethics_report(uuid,text,text,text,text,text,boolean)TO service_role;
REVOKE ALL ON FUNCTION public.can_review_intranet_ethics(text),public.list_intranet_ethics(text),public.read_intranet_ethics(uuid),public.update_intranet_ethics(uuid,bigint,text,uuid,text),public.list_intranet_ethics_events(uuid)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_review_intranet_ethics(text),public.list_intranet_ethics(text),public.read_intranet_ethics(uuid),public.update_intranet_ethics(uuid,bigint,text,uuid,text),public.list_intranet_ethics_events(uuid)TO authenticated,service_role;
