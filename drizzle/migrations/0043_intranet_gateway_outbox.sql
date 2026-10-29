CREATE TABLE public.intranet_outbox(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),request_key uuid NOT NULL,created_by uuid NOT NULL REFERENCES public.profiles(id),source_message_id uuid REFERENCES public.external_messages(id),recipients text[] NOT NULL,subject text NOT NULL,body text NOT NULL,
 status text NOT NULL DEFAULT 'pending'CHECK(status IN ('pending','approved','rejected','queued','sent','unknown')),approved_by uuid REFERENCES public.profiles(id),decision_note text,
 gmail_thread_id text,in_reply_to text,gmail_references text,test_account boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now(),approved_at timestamptz,queued_at timestamptz,UNIQUE(created_by,request_key));
CREATE TABLE public.intranet_outbox_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),outbox_id uuid NOT NULL REFERENCES public.intranet_outbox(id),actor_id uuid REFERENCES public.profiles(id),kind text NOT NULL,note text,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.intranet_email_dispatch(
 dispatch_key text PRIMARY KEY,outbox_id uuid REFERENCES public.intranet_outbox(id),recipient text NOT NULL,message_id text NOT NULL,payload jsonb NOT NULL,
 status text NOT NULL DEFAULT 'queued'CHECK(status IN ('queued','sending','sent','unknown')),provider_id text,created_at timestamptz NOT NULL DEFAULT now(),sent_at timestamptz);
ALTER TABLE public.intranet_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intranet_outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intranet_email_dispatch ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.intranet_outbox,public.intranet_outbox_events,public.intranet_email_dispatch TO service_role;
CREATE OR REPLACE FUNCTION public.can_read_intranet_outbox(r public.intranet_outbox)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_intranet_action('gateway.compose','read')AND r.test_account=coalesce((SELECT test_account FROM public.profiles WHERE id=auth.uid()),false)
 AND(r.created_by=auth.uid()OR public.can_intranet_action('gateway.validation','validate'));
$$;
CREATE OR REPLACE FUNCTION public.submit_intranet_outbox(p_key uuid,p_source uuid,p_recipients text[],p_subject text,p_body text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_outbox%ROWTYPE;source public.external_messages%ROWTYPE;actor uuid:=auth.uid();recipients text[];subject text:=btrim(coalesce(p_subject,''));
BEGIN
 IF NOT public.can_intranet_action('gateway.compose','create')OR NOT public.can_intranet_action('gateway.compose','read')THEN RAISE EXCEPTION 'gateway_forbidden' USING ERRCODE='42501';END IF;
 IF p_key IS NULL OR p_recipients IS NULL OR cardinality(p_recipients)NOT BETWEEN 1 AND 30 OR array_position(p_recipients,NULL)IS NOT NULL OR length(subject)NOT BETWEEN 1 AND 255 OR subject~E'[\\r\\n]'OR length(btrim(coalesce(p_body,'')))NOT BETWEEN 1 AND 30000 THEN RAISE EXCEPTION 'invalid_outbox_message' USING ERRCODE='22023';END IF;
 SELECT array_agg(DISTINCT lower(btrim(value))ORDER BY lower(btrim(value)))INTO recipients FROM unnest(p_recipients)value;
 IF EXISTS(SELECT 1 FROM unnest(recipients)address WHERE address!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'OR length(address)>254)THEN RAISE EXCEPTION 'invalid_outbox_recipient' USING ERRCODE='22023';END IF;
 IF p_source IS NOT NULL THEN
  SELECT * INTO source FROM public.external_messages WHERE id=p_source;
  IF NOT FOUND OR NOT public.can_intranet_action('gateway.inbox','read')OR NOT(public.is_leadership(actor)OR public.has_role(actor,'admin')OR source.routed_to_pole IS NULL OR source.routed_to_pole::text=ANY((SELECT poles::text[]FROM public.profiles WHERE id=actor)))THEN RAISE EXCEPTION 'gateway_source_forbidden' USING ERRCODE='42501';END IF;
  IF cardinality(recipients)<>1 OR recipients[1]<>lower(source.sender_email)THEN RAISE EXCEPTION 'gateway_reply_recipient_mismatch' USING ERRCODE='42501';END IF;
  subject:='Re: '||left(source.subject,251);
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text||p_key::text,0));
 SELECT * INTO r FROM public.intranet_outbox WHERE created_by=actor AND request_key=p_key;
 IF FOUND THEN IF r.recipients<>recipients OR r.subject<>subject OR r.body<>p_body OR r.source_message_id IS DISTINCT FROM p_source THEN RAISE EXCEPTION 'outbox_key_conflict' USING ERRCODE='40001';END IF;RETURN to_jsonb(r);END IF;
 INSERT INTO public.intranet_outbox(request_key,created_by,source_message_id,recipients,subject,body,gmail_thread_id,in_reply_to,gmail_references,test_account)
 VALUES(p_key,actor,p_source,recipients,subject,p_body,source.gmail_thread_id,source.gmail_message_id_header,concat_ws(' ',nullif(source.gmail_references,''),nullif(source.gmail_message_id_header,'')),coalesce((SELECT test_account FROM public.profiles WHERE id=actor),false))RETURNING*INTO r;
 INSERT INTO public.intranet_outbox_events(outbox_id,actor_id,kind)VALUES(r.id,actor,'submitted');RETURN to_jsonb(r);
END;
$$;
CREATE OR REPLACE FUNCTION public.list_intranet_outbox()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.created_at DESC),'[]'::jsonb)FROM(SELECT r.*FROM public.intranet_outbox r WHERE public.can_read_intranet_outbox(r)ORDER BY r.created_at DESC LIMIT 200)x;
$$;
CREATE OR REPLACE FUNCTION public.decide_intranet_outbox(p_id uuid,p_approve boolean,p_note text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_outbox%ROWTYPE;
BEGIN
 SELECT*INTO r FROM public.intranet_outbox WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR NOT public.can_read_intranet_outbox(r)OR NOT public.can_intranet_action('gateway.validation','validate')OR r.created_by=auth.uid()THEN RAISE EXCEPTION 'gateway_approval_forbidden' USING ERRCODE='42501';END IF;
 IF r.status<>'pending'OR p_approve IS NULL OR length(coalesce(p_note,''))>5000 OR(NOT p_approve AND length(btrim(coalesce(p_note,'')))=0)THEN RAISE EXCEPTION 'invalid_outbox_decision' USING ERRCODE='22023';END IF;
 UPDATE public.intranet_outbox SET status=CASE WHEN p_approve THEN 'approved'ELSE 'rejected'END,approved_by=auth.uid(),approved_at=now(),decision_note=nullif(btrim(p_note),'')WHERE id=p_id;
 INSERT INTO public.intranet_outbox_events(outbox_id,actor_id,kind,note)VALUES(p_id,auth.uid(),CASE WHEN p_approve THEN 'approved'ELSE 'rejected'END,nullif(btrim(p_note),''));
END;
$$;
CREATE OR REPLACE FUNCTION public.get_intranet_outbox_for_dispatch(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_outbox%ROWTYPE;
BEGIN
 SELECT*INTO r FROM public.intranet_outbox WHERE id=p_id;
 IF NOT FOUND OR NOT public.can_read_intranet_outbox(r)OR r.status NOT IN ('approved','queued','sent','unknown')OR r.approved_by IS NULL OR r.approved_by=r.created_by OR r.test_account THEN RAISE EXCEPTION 'gateway_dispatch_forbidden' USING ERRCODE='42501';END IF;
 RETURN to_jsonb(r);
END;
$$;
CREATE OR REPLACE FUNCTION public.enqueue_intranet_email(p_key text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE existing public.intranet_email_dispatch%ROWTYPE;outbox public.intranet_outbox%ROWTYPE;link uuid;
BEGIN
 IF auth.role()IS DISTINCT FROM 'service_role'THEN RAISE EXCEPTION 'email_service_only' USING ERRCODE='42501';END IF;
 IF length(coalesce(p_key,''))NOT BETWEEN 1 AND 500 OR jsonb_typeof(p_payload)<>'object'OR length(coalesce(p_payload->>'to',''))NOT BETWEEN 3 AND 254 OR p_payload->>'message_id'IS NULL THEN RAISE EXCEPTION 'invalid_email_queue_payload' USING ERRCODE='22023';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_key,0));
 SELECT*INTO existing FROM public.intranet_email_dispatch WHERE dispatch_key=p_key;
 IF FOUND THEN IF(existing.payload-ARRAY['message_id','queued_at'])IS DISTINCT FROM(p_payload-ARRAY['message_id','queued_at'])THEN RAISE EXCEPTION 'email_key_conflict' USING ERRCODE='40001';END IF;RETURN jsonb_build_object('message_id',existing.message_id,'queued',true);END IF;
 IF p_payload->>'intranet_outbox_id'IS NOT NULL THEN
  link:=(p_payload->>'intranet_outbox_id')::uuid;SELECT*INTO outbox FROM public.intranet_outbox WHERE id=link FOR SHARE;
  IF NOT FOUND OR outbox.status NOT IN ('approved','queued')OR outbox.approved_by IS NULL OR outbox.created_by=outbox.approved_by OR outbox.test_account OR NOT lower(p_payload->>'to')=ANY(outbox.recipients)THEN RAISE EXCEPTION 'outbox_queue_forbidden' USING ERRCODE='42501';END IF;
 END IF;
 INSERT INTO public.intranet_email_dispatch(dispatch_key,outbox_id,recipient,message_id,payload)VALUES(p_key,link,lower(p_payload->>'to'),p_payload->>'message_id',p_payload);
 PERFORM public.enqueue_email('transactional_emails',p_payload);
 RETURN jsonb_build_object('message_id',p_payload->>'message_id','queued',true);
END;
$$;
CREATE OR REPLACE FUNCTION public.mark_intranet_outbox_queued(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_outbox%ROWTYPE;
BEGIN
 IF auth.role()IS DISTINCT FROM 'service_role'THEN RAISE EXCEPTION 'email_service_only' USING ERRCODE='42501';END IF;
 SELECT*INTO r FROM public.intranet_outbox WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR r.status NOT IN ('approved','queued','unknown','sent')OR(SELECT count(*)FROM public.intranet_email_dispatch WHERE outbox_id=p_id)<>cardinality(r.recipients)THEN RAISE EXCEPTION 'outbox_queue_incomplete' USING ERRCODE='40001';END IF;
 IF r.status='approved'THEN
 UPDATE public.intranet_outbox SET status='queued',queued_at=now()WHERE id=p_id;
 INSERT INTO public.intranet_outbox_events(outbox_id,kind)VALUES(p_id,'queued');END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.claim_intranet_delivery(p_key text,p_message text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_email_dispatch%ROWTYPE;
BEGIN
 IF auth.role()IS DISTINCT FROM 'service_role'THEN RAISE EXCEPTION 'email_service_only' USING ERRCODE='42501';END IF;
 SELECT*INTO r FROM public.intranet_email_dispatch WHERE dispatch_key=p_key FOR UPDATE;
 IF NOT FOUND OR r.message_id<>p_message THEN RAISE EXCEPTION 'email_claim_forbidden' USING ERRCODE='42501';END IF;
 IF r.status='sent'THEN RETURN 'sent';END IF;
 IF r.status IN ('sending','unknown')THEN
 UPDATE public.intranet_email_dispatch SET status='unknown'WHERE dispatch_key=p_key;
 UPDATE public.intranet_outbox SET status='unknown'WHERE id=r.outbox_id AND status<>'sent';RETURN 'unknown';END IF;
 UPDATE public.intranet_email_dispatch SET status='sending'WHERE dispatch_key=p_key;RETURN 'claimed';
END;
$$;
CREATE OR REPLACE FUNCTION public.mark_intranet_delivery_sent(p_key text,p_message text,p_provider text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE delivery public.intranet_email_dispatch%ROWTYPE;r public.intranet_outbox%ROWTYPE;
BEGIN
 IF auth.role()IS DISTINCT FROM 'service_role'THEN RAISE EXCEPTION 'email_service_only' USING ERRCODE='42501';END IF;
 SELECT*INTO delivery FROM public.intranet_email_dispatch WHERE dispatch_key=p_key FOR UPDATE;
 IF NOT FOUND OR delivery.message_id<>p_message OR length(coalesce(p_provider,''))=0 THEN RAISE EXCEPTION 'email_receipt_forbidden' USING ERRCODE='42501';END IF;
 UPDATE public.intranet_email_dispatch SET status='sent',provider_id=p_provider,sent_at=now()WHERE dispatch_key=p_key;
 IF delivery.outbox_id IS NOT NULL THEN
 SELECT*INTO r FROM public.intranet_outbox WHERE id=delivery.outbox_id FOR UPDATE;
 IF(SELECT count(*)FROM public.intranet_email_dispatch WHERE outbox_id=r.id AND status='sent')=cardinality(r.recipients)AND r.status<>'sent'THEN
 UPDATE public.intranet_outbox SET status='sent'WHERE id=r.id;
 INSERT INTO public.intranet_outbox_events(outbox_id,kind)VALUES(r.id,'sent');
 IF r.source_message_id IS NOT NULL THEN UPDATE public.external_messages SET status='responded',response_content=r.body,responded_by=r.created_by,responded_at=now(),updated_at=now()WHERE id=r.source_message_id;END IF;
 END IF;END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.list_intranet_outbox_events(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.intranet_outbox r WHERE id=p_id AND public.can_read_intranet_outbox(r))THEN RAISE EXCEPTION 'gateway_forbidden' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('events',(SELECT coalesce(jsonb_agg(to_jsonb(e)ORDER BY created_at DESC),'[]'::jsonb)FROM public.intranet_outbox_events e WHERE outbox_id=p_id),'deliveries',(SELECT coalesce(jsonb_agg(jsonb_build_object('recipient',recipient,'status',status,'sent_at',sent_at)),'[]'::jsonb)FROM public.intranet_email_dispatch WHERE outbox_id=p_id));
END;
$$;
DO $$DECLARE f record;BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'AND p.proname IN ('can_read_intranet_outbox','submit_intranet_outbox','list_intranet_outbox','decide_intranet_outbox','get_intranet_outbox_for_dispatch','enqueue_intranet_email','mark_intranet_outbox_queued','claim_intranet_delivery','mark_intranet_delivery_sent','list_intranet_outbox_events')LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.can_read_intranet_outbox(public.intranet_outbox),public.submit_intranet_outbox(uuid,uuid,text[],text,text),public.list_intranet_outbox(),public.decide_intranet_outbox(uuid,boolean,text),public.get_intranet_outbox_for_dispatch(uuid),public.list_intranet_outbox_events(uuid)TO authenticated;
CREATE OR REPLACE FUNCTION public.release_rejected_intranet_delivery(p_key text,p_message text,p_status integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.role()IS DISTINCT FROM 'service_role'OR p_status NOT IN (400,401,403,404,429)THEN RAISE EXCEPTION 'email_release_forbidden' USING ERRCODE='42501';END IF;
 UPDATE public.intranet_email_dispatch SET status='queued'WHERE dispatch_key=p_key AND message_id=p_message AND status='sending';
END;
$$;
REVOKE ALL ON FUNCTION public.release_rejected_intranet_delivery(text,text,integer)FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.release_rejected_intranet_delivery(text,text,integer)TO service_role;
