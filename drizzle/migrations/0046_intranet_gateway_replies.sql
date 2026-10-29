-- Reply authorization follows inbox roles and the source environment without the array/subquery ambiguity.
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
  IF NOT FOUND OR NOT public.can_intranet_action('gateway.inbox','read')
   OR coalesce((to_jsonb(source)->>'test_account')::boolean,false)IS DISTINCT FROM coalesce((SELECT test_account FROM public.profiles WHERE id=actor),false)
   OR NOT(public.is_leadership(actor)OR public.has_role(actor,'admin')OR public.has_role(actor,'manager')OR(source.routed_to_pole IS NOT NULL AND public.has_pole(actor,source.routed_to_pole::text)))THEN RAISE EXCEPTION 'gateway_source_forbidden' USING ERRCODE='42501';END IF;
  IF cardinality(recipients)<>1 OR recipients[1]<>lower(source.sender_email)THEN RAISE EXCEPTION 'gateway_reply_recipient_mismatch' USING ERRCODE='42501';END IF;
  subject:='Re: '||left(coalesce(nullif(btrim(source.subject),''),'Sans objet'),251);
  IF subject~E'[\\r\\n]'THEN RAISE EXCEPTION 'invalid_reply_subject' USING ERRCODE='22023';END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text||p_key::text,0));
 SELECT * INTO r FROM public.intranet_outbox WHERE created_by=actor AND request_key=p_key;
 IF FOUND THEN IF r.recipients<>recipients OR r.subject<>subject OR r.body<>p_body OR r.source_message_id IS DISTINCT FROM p_source THEN RAISE EXCEPTION 'outbox_key_conflict' USING ERRCODE='40001';END IF;RETURN to_jsonb(r);END IF;
 INSERT INTO public.intranet_outbox(request_key,created_by,source_message_id,recipients,subject,body,gmail_thread_id,in_reply_to,gmail_references,test_account)
 VALUES(p_key,actor,p_source,recipients,subject,p_body,source.gmail_thread_id,source.gmail_message_id_header,concat_ws(' ',nullif(source.gmail_references,''),nullif(source.gmail_message_id_header,'')),coalesce((SELECT test_account FROM public.profiles WHERE id=actor),false))RETURNING*INTO r;
 INSERT INTO public.intranet_outbox_events(outbox_id,actor_id,kind)VALUES(r.id,actor,'submitted');RETURN to_jsonb(r);
END;
$$;
NOTIFY pgrst,'reload schema';
