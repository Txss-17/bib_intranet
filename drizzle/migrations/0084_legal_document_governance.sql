-- Governance is evidence-based. No template or identity is approved by this migration.
CREATE TABLE public.legal_governance_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN('model','identity')),
 payload jsonb NOT NULL, state text NOT NULL DEFAULT 'draft'
 CHECK(state IN('draft','submitted','legal_approved','direction_approved','published','withdrawn')),
 revision integer NOT NULL DEFAULT 1, test_account boolean NOT NULL DEFAULT false,
 created_by uuid NOT NULL, creation_key uuid NOT NULL, creation_request jsonb NOT NULL,
 legal_reviewer uuid, legal_evidence text, direction_reviewer uuid, direction_evidence text,
 activation_sequence bigint, delivery_sequence bigint NOT NULL DEFAULT 0,
 reason text, command_key uuid NOT NULL, command_revision integer NOT NULL DEFAULT 0,
 last_action text NOT NULL DEFAULT 'create', command_payload jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(created_by,creation_key)
);
CREATE UNIQUE INDEX legal_model_version_unique ON public.legal_governance_records(test_account,(payload->>'model_key'),(payload->>'version')) WHERE kind='model';
CREATE INDEX legal_identity_store ON public.legal_governance_records((payload->>'store_id')) WHERE kind='identity';
CREATE SEQUENCE public.legal_governance_sequence;
CREATE TABLE public.legal_governance_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), record_id uuid NOT NULL REFERENCES public.legal_governance_records(id),
 command_key uuid NOT NULL, action text NOT NULL, actor_id uuid NOT NULL, request jsonb NOT NULL,
 before_state jsonb, after_state jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(record_id,command_key)
);
CREATE TABLE public.legal_governance_deliveries (
 record_id uuid NOT NULL REFERENCES public.legal_governance_records(id), delivery_sequence bigint NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','delivered')),
 delivered_at timestamptz, PRIMARY KEY(record_id,delivery_sequence)
);
ALTER TABLE public.legal_governance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_governance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_governance_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.legal_governance_records,public.legal_governance_events,public.legal_governance_deliveries FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.legal_governance_records TO authenticated;
GRANT SELECT ON public.legal_governance_events,public.legal_governance_deliveries TO authenticated;
GRANT SELECT ON public.legal_governance_records,public.legal_governance_events,public.legal_governance_deliveries TO service_role;
GRANT UPDATE(state,delivered_at) ON public.legal_governance_deliveries TO service_role;
CREATE POLICY legal_governance_read ON public.legal_governance_records FOR SELECT TO authenticated USING(
 test_account=public.intranet_is_test_mode() AND (
 public.can_intranet_action(CASE kind WHEN 'model' THEN 'compliance.policies' ELSE 'compliance.contracts' END,'read')
 OR (kind='model' AND public.can_intranet_action('direction.governance','read'))));
CREATE POLICY legal_governance_create ON public.legal_governance_records FOR INSERT TO authenticated WITH CHECK(
 test_account=public.intranet_is_test_mode() AND created_by=auth.uid()
 AND public.can_intranet_action(CASE kind WHEN 'model' THEN 'compliance.policies' ELSE 'compliance.contracts' END,'create'));
CREATE POLICY legal_governance_update ON public.legal_governance_records FOR UPDATE TO authenticated
 USING(test_account=public.intranet_is_test_mode()) WITH CHECK(test_account=public.intranet_is_test_mode());
CREATE POLICY legal_governance_event_read ON public.legal_governance_events FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.legal_governance_records r WHERE r.id=record_id));
CREATE POLICY legal_governance_delivery_read ON public.legal_governance_deliveries FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.legal_governance_records r WHERE r.id=record_id));

CREATE FUNCTION public.legal_required_text(p jsonb,k text) RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE v text:=btrim(p->>k);
BEGIN
 IF jsonb_typeof(p->k) IS DISTINCT FROM 'string' OR length(coalesce(v,'')) NOT BETWEEN 1 AND 200000
 THEN RAISE EXCEPTION 'legal_field_required: %',k USING ERRCODE='22023'; END IF;
 RETURN v;
END; $$;

CREATE FUNCTION public.validate_legal_governance_payload(kind text,p jsonb) RETURNS void
 LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE token text[]; key text; required text[]; body text; f jsonb;
 allowed text[]:=ARRAY['VENDEUR_NOM_LEGAL','SIREN_SIRET','ADRESSE','CONTACT_VENDEUR','TELEPHONE','FORME_OU_EI','MEDIATEUR_COORDONNEES','TVA_ID','BIB_IDENTITE_LEGALE_VERIFIEE','BIB_CONTACT','HEBERGEUR_RAISON_SOCIALE_ET_COORDONNEES','CAPITAL_SOCIAL','REGISTRE_IMMATRICULATION','BOUTIQUE_NOM','URL_BOUTIQUE','CGV_MODELE_VERSION','CGV_BOUTIQUE_VERSION','CGU_MODELE_VERSION','CGU_BOUTIQUE_VERSION','DATE_EFFET'];
BEGIN
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'invalid_legal_payload' USING ERRCODE='22023'; END IF;
 IF kind='model' THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(p) k WHERE NOT k=ANY(ARRAY['model_key','version','title','body','effective_at','locale']))
   OR p->>'model_key' IS NULL OR p->>'model_key' NOT IN('JUR-B01','JUR-B02','JUR-B03') OR p->>'locale' IS DISTINCT FROM 'fr'
   THEN RAISE EXCEPTION 'invalid_legal_model' USING ERRCODE='22023'; END IF;
  PERFORM public.legal_required_text(p,'version'); PERFORM public.legal_required_text(p,'title');
  IF public.legal_required_text(p,'effective_at') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$'
   THEN RAISE EXCEPTION 'legal_effective_date_requires_timezone' USING ERRCODE='22023'; END IF;
  PERFORM (p->>'effective_at')::timestamptz;
  body:=public.legal_required_text(p,'body');
  FOR token IN SELECT regexp_matches(body,'\{\{([^{}]+)\}\}','g') LOOP
   IF NOT token[1]=ANY(allowed)
    OR (p->>'model_key'<>'JUR-B01' AND token[1] LIKE 'CGV_%')
    OR (p->>'model_key'<>'JUR-B02' AND token[1] LIKE 'CGU_%')
   THEN RAISE EXCEPTION 'unknown_legal_placeholder: %',token[1] USING ERRCODE='22023'; END IF;
  END LOOP;
  IF regexp_replace(body,'\{\{[^{}]+\}\}','','g') LIKE '%{{%' OR regexp_replace(body,'\{\{[^{}]+\}\}','','g') LIKE '%}}%'
   THEN RAISE EXCEPTION 'malformed_legal_placeholder' USING ERRCODE='22023'; END IF;
  required:=CASE p->>'model_key'
   WHEN 'JUR-B01' THEN ARRAY['VENDEUR_NOM_LEGAL','BOUTIQUE_NOM','FORME_OU_EI','SIREN_SIRET','ADRESSE','CONTACT_VENDEUR','MEDIATEUR_COORDONNEES','CGV_MODELE_VERSION','CGV_BOUTIQUE_VERSION','DATE_EFFET']
   WHEN 'JUR-B02' THEN ARRAY['VENDEUR_NOM_LEGAL','BOUTIQUE_NOM','URL_BOUTIQUE','CGU_MODELE_VERSION','CGU_BOUTIQUE_VERSION','CONTACT_VENDEUR']
   ELSE ARRAY['VENDEUR_NOM_LEGAL','BOUTIQUE_NOM','URL_BOUTIQUE','FORME_OU_EI','SIREN_SIRET','ADRESSE','TVA_ID','CONTACT_VENDEUR','BIB_IDENTITE_LEGALE_VERIFIEE','BIB_CONTACT','HEBERGEUR_RAISON_SOCIALE_ET_COORDONNEES'] END;
  FOREACH key IN ARRAY required LOOP
   IF strpos(body,'{{'||key||'}}')=0 THEN RAISE EXCEPTION 'missing_legal_placeholder: %',key USING ERRCODE='22023'; END IF;
  END LOOP;
 ELSIF kind='identity' THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(p) k WHERE NOT k=ANY(ARRAY['store_id','owner_id','fields','legal_entity_id']))
   OR jsonb_typeof(p->'fields') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'invalid_legal_identity' USING ERRCODE='22023'; END IF;
  PERFORM public.legal_required_text(p,'store_id')::uuid; PERFORM public.legal_required_text(p,'owner_id')::uuid;
  f:=p->'fields';
  FOR key IN SELECT jsonb_object_keys(f) LOOP
   IF NOT key=ANY(allowed[1:13]) OR public.legal_required_text(f,key) LIKE '%{{%' OR f->>key LIKE '%}}%'
    THEN RAISE EXCEPTION 'invalid_identity_field: %',key USING ERRCODE='22023'; END IF;
  END LOOP;
  FOREACH key IN ARRAY ARRAY['VENDEUR_NOM_LEGAL','SIREN_SIRET','ADRESSE','CONTACT_VENDEUR','FORME_OU_EI','MEDIATEUR_COORDONNEES','TVA_ID','BIB_IDENTITE_LEGALE_VERIFIEE','BIB_CONTACT','HEBERGEUR_RAISON_SOCIALE_ET_COORDONNEES'] LOOP
   PERFORM public.legal_required_text(f,key);
  END LOOP;
  IF f->>'SIREN_SIRET' !~ '^(\d{9}|\d{14})$' OR f->>'CONTACT_VENDEUR' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
   THEN RAISE EXCEPTION 'invalid_identity_registration' USING ERRCODE='22023'; END IF;
 ELSE RAISE EXCEPTION 'invalid_legal_kind' USING ERRCODE='22023'; END IF;
END; $$;

CREATE FUNCTION public.guard_legal_governance_record() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); page text; permission text; p jsonb:=NEW.command_payload; entity uuid;
BEGIN
 page:=CASE NEW.kind WHEN 'model' THEN 'compliance.policies' ELSE 'compliance.contracts' END;
 IF actor IS NULL OR NEW.test_account IS DISTINCT FROM public.intranet_is_test_mode() THEN RAISE EXCEPTION 'legal_access_denied' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' THEN
  IF NOT public.can_intranet_action(page,'read') OR NOT public.can_intranet_action(page,'create') OR NEW.created_by IS DISTINCT FROM actor
   OR NEW.state<>'draft' OR NEW.legal_reviewer IS NOT NULL OR NEW.direction_reviewer IS NOT NULL OR NEW.legal_evidence IS NOT NULL
   OR NEW.direction_evidence IS NOT NULL OR NEW.activation_sequence IS NOT NULL OR NEW.reason IS NOT NULL
   OR NEW.last_action<>'create' THEN RAISE EXCEPTION 'legal_creation_forbidden' USING ERRCODE='42501'; END IF;
  PERFORM public.validate_legal_governance_payload(NEW.kind,NEW.payload);
  IF NEW.kind='identity' THEN
   IF NEW.payload ? 'legal_entity_id' THEN RAISE EXCEPTION 'legal_entity_is_server_assigned' USING ERRCODE='22023'; END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended(NEW.test_account::text||left(NEW.payload->'fields'->>'SIREN_SIRET',9),0));
   SELECT (r.payload->>'legal_entity_id')::uuid INTO entity FROM public.legal_governance_records r
    WHERE r.kind='identity' AND r.test_account=NEW.test_account AND left(r.payload->'fields'->>'SIREN_SIRET',9)=left(NEW.payload->'fields'->>'SIREN_SIRET',9)
    ORDER BY r.created_at,r.id LIMIT 1;
   NEW.payload:=NEW.payload||jsonb_build_object('legal_entity_id',coalesce(entity,gen_random_uuid()));
  END IF;
  NEW.revision:=1; NEW.command_revision:=0; NEW.created_at:=now();
 ELSE
  IF (to_jsonb(NEW)-ARRAY['command_key','command_revision','last_action','command_payload'])
   IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['command_key','command_revision','last_action','command_payload'])
   THEN RAISE EXCEPTION 'legal_direct_write_forbidden' USING ERRCODE='42501'; END IF;
  IF NEW.command_revision IS DISTINCT FROM OLD.revision THEN RAISE EXCEPTION 'legal_revision_conflict' USING ERRCODE='40001'; END IF;
  IF NEW.last_action='direction_approve' THEN page:='direction.governance'; END IF;
  permission:=CASE WHEN NEW.last_action IN('legal_approve','direction_approve','publish','withdraw','reject') THEN 'validate' ELSE 'update' END;
  IF NOT public.can_intranet_action(page,'read') OR NOT public.can_intranet_action(page,permission)
   THEN RAISE EXCEPTION 'legal_action_forbidden' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR octet_length(p::text)>250000 THEN RAISE EXCEPTION 'invalid_legal_command' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(p) k WHERE NOT k=ANY(CASE NEW.last_action WHEN 'edit' THEN ARRAY['payload'] WHEN 'submit' THEN ARRAY[]::text[] ELSE ARRAY['reason','evidence'] END))
   THEN RAISE EXCEPTION 'unknown_legal_command_field' USING ERRCODE='22023'; END IF;
  CASE NEW.last_action
  WHEN 'edit' THEN
   IF OLD.state<>'draft' THEN RAISE EXCEPTION 'legal_record_locked' USING ERRCODE='55000'; END IF;
   PERFORM public.validate_legal_governance_payload(OLD.kind,p->'payload');
   IF (OLD.kind='model' AND (p->'payload'->>'model_key' IS DISTINCT FROM OLD.payload->>'model_key' OR p->'payload'->>'version' IS DISTINCT FROM OLD.payload->>'version'))
    OR (OLD.kind='identity' AND ((p->'payload')-'fields') IS DISTINCT FROM (OLD.payload-'fields'))
    THEN RAISE EXCEPTION 'legal_identity_key_locked' USING ERRCODE='22023'; END IF;
   IF OLD.kind='identity' AND (p->'payload'->'fields'->>'VENDEUR_NOM_LEGAL',p->'payload'->'fields'->>'SIREN_SIRET',p->'payload'->'fields'->>'ADRESSE',p->'payload'->'fields'->>'CONTACT_VENDEUR',p->'payload'->'fields'->>'TELEPHONE')
    IS DISTINCT FROM (OLD.payload->'fields'->>'VENDEUR_NOM_LEGAL',OLD.payload->'fields'->>'SIREN_SIRET',OLD.payload->'fields'->>'ADRESSE',OLD.payload->'fields'->>'CONTACT_VENDEUR',OLD.payload->'fields'->>'TELEPHONE')
    THEN RAISE EXCEPTION 'refresh_identity_review_from_platform' USING ERRCODE='22023'; END IF;
   NEW.payload:=p->'payload';
  WHEN 'submit' THEN
   IF OLD.state<>'draft' THEN RAISE EXCEPTION 'invalid_legal_transition' USING ERRCODE='22023'; END IF; NEW.state:='submitted';
  WHEN 'legal_approve' THEN
   IF OLD.state<>'submitted' OR OLD.created_by=actor THEN RAISE EXCEPTION 'independent_legal_review_required' USING ERRCODE='42501'; END IF;
   NEW.legal_evidence:=public.legal_required_text(p,'evidence'); NEW.legal_reviewer:=actor; NEW.state:='legal_approved';
  WHEN 'direction_approve' THEN
   IF OLD.kind<>'model' OR OLD.state<>'legal_approved' OR actor IN(OLD.created_by,OLD.legal_reviewer)
    THEN RAISE EXCEPTION 'independent_direction_review_required' USING ERRCODE='42501'; END IF;
   NEW.direction_evidence:=public.legal_required_text(p,'evidence'); NEW.direction_reviewer:=actor; NEW.state:='direction_approved';
  WHEN 'publish' THEN
   IF (OLD.kind='model' AND OLD.state<>'direction_approved') OR (OLD.kind='identity' AND OLD.state<>'legal_approved')
    THEN RAISE EXCEPTION 'legal_approvals_required' USING ERRCODE='22023'; END IF;
   NEW.state:='published'; NEW.activation_sequence:=nextval('public.legal_governance_sequence');
  WHEN 'withdraw' THEN
   IF OLD.state<>'published' THEN RAISE EXCEPTION 'invalid_legal_transition' USING ERRCODE='22023'; END IF;
   NEW.state:='withdrawn';
  WHEN 'reject' THEN
   IF OLD.state NOT IN('submitted','legal_approved','direction_approved') THEN RAISE EXCEPTION 'invalid_legal_transition' USING ERRCODE='22023'; END IF;
   NEW.state:='draft'; NEW.legal_reviewer:=NULL; NEW.legal_evidence:=NULL; NEW.direction_reviewer:=NULL; NEW.direction_evidence:=NULL;
  ELSE RAISE EXCEPTION 'unknown_legal_action' USING ERRCODE='22023'; END CASE;
  IF NEW.last_action NOT IN('edit','submit') THEN NEW.reason:=public.legal_required_text(p,'reason'); END IF;
  NEW.revision:=OLD.revision+1;
 END IF;
 NEW.delivery_sequence:=nextval('public.legal_governance_sequence'); NEW.updated_at:=now(); RETURN NEW;
END; $$;
CREATE TRIGGER legal_governance_record_guard BEFORE INSERT OR UPDATE ON public.legal_governance_records
 FOR EACH ROW EXECUTE FUNCTION public.guard_legal_governance_record();
CREATE FUNCTION public.log_legal_governance_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 INSERT INTO public.legal_governance_events(record_id,command_key,action,actor_id,request,before_state,after_state)
 VALUES(NEW.id,NEW.command_key,NEW.last_action,auth.uid(),NEW.command_payload,CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) END,to_jsonb(NEW));
 IF NEW.state IN('published','withdrawn') THEN INSERT INTO public.legal_governance_deliveries(record_id,delivery_sequence) VALUES(NEW.id,NEW.delivery_sequence); END IF;
 RETURN NULL;
END; $$;
CREATE TRIGGER legal_governance_event AFTER INSERT OR UPDATE ON public.legal_governance_records FOR EACH ROW EXECUTE FUNCTION public.log_legal_governance_event();
CREATE FUNCTION public.create_legal_governance_record(p_key uuid,p_kind text,p_payload jsonb) RETURNS jsonb
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE r public.legal_governance_records; request jsonb:=jsonb_build_object('kind',p_kind,'payload',p_payload);
BEGIN
 IF auth.uid() IS NULL OR p_key IS NULL THEN RAISE EXCEPTION 'legal_access_denied' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 SELECT * INTO r FROM public.legal_governance_records WHERE created_by=auth.uid() AND creation_key=p_key;
 IF FOUND THEN IF r.creation_request IS DISTINCT FROM request THEN RAISE EXCEPTION 'legal_key_conflict' USING ERRCODE='40001'; END IF; RETURN to_jsonb(r); END IF;
 INSERT INTO public.legal_governance_records(kind,payload,created_by,creation_key,creation_request,command_key,test_account)
 VALUES(p_kind,p_payload,auth.uid(),p_key,request,p_key,public.intranet_is_test_mode()) RETURNING * INTO r; RETURN to_jsonb(r);
END; $$;
CREATE FUNCTION public.advance_legal_governance_record(p_id uuid,p_revision integer,p_key uuid,p_action text,p_payload jsonb DEFAULT '{}') RETURNS jsonb
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE r public.legal_governance_records; e public.legal_governance_events;
BEGIN
 IF p_key IS NULL OR p_revision IS NULL THEN RAISE EXCEPTION 'invalid_legal_command' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text||p_key::text,0));
 SELECT * INTO e FROM public.legal_governance_events WHERE record_id=p_id AND command_key=p_key;
 IF FOUND THEN
  IF e.actor_id IS DISTINCT FROM auth.uid() OR e.action IS DISTINCT FROM p_action OR e.request IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'legal_key_conflict' USING ERRCODE='40001'; END IF;
  RETURN e.after_state;
 END IF;
 UPDATE public.legal_governance_records SET command_key=p_key,command_revision=p_revision,last_action=p_action,command_payload=p_payload
 WHERE id=p_id AND revision=p_revision RETURNING * INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'legal_revision_or_access_conflict' USING ERRCODE='40001'; END IF; RETURN to_jsonb(r);
END; $$;
CREATE FUNCTION public.export_legal_governance_record(p_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE r public.legal_governance_records; page text;
BEGIN
 SELECT * INTO r FROM public.legal_governance_records WHERE id=p_id;
 page:=CASE r.kind WHEN 'model' THEN 'compliance.policies' ELSE 'compliance.contracts' END;
 IF r.id IS NULL OR r.state NOT IN('published','withdrawn') OR NOT public.can_intranet_action(page,'validate') THEN RAISE EXCEPTION 'legal_export_forbidden' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('id',r.id,'kind',r.kind,'payload',r.payload,'state',r.state,'revision',r.revision,'environment',CASE WHEN r.test_account THEN 'sandbox' ELSE 'live' END,
  'activation_sequence',r.activation_sequence,'delivery_sequence',r.delivery_sequence,'legal_reviewer',r.legal_reviewer,'direction_reviewer',r.direction_reviewer);
END; $$;
CREATE FUNCTION public.acknowledge_legal_governance_delivery(p_id uuid,p_sequence bigint) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=public,pg_temp AS $$
 UPDATE public.legal_governance_deliveries SET state='delivered',delivered_at=now() WHERE record_id=p_id AND delivery_sequence=p_sequence;
$$;
REVOKE ALL ON FUNCTION public.guard_legal_governance_record(),public.log_legal_governance_event() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_legal_governance_record(uuid,text,jsonb),public.advance_legal_governance_record(uuid,integer,uuid,text,jsonb),public.export_legal_governance_record(uuid),public.acknowledge_legal_governance_delivery(uuid,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_legal_governance_record(uuid,text,jsonb),public.advance_legal_governance_record(uuid,integer,uuid,text,jsonb),public.export_legal_governance_record(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_legal_governance_delivery(uuid,bigint) TO service_role;
