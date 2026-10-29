-- Litiges use the existing canonical dossiers, their privacy rules and their evidence.
UPDATE public.intranet_modules SET definition=$dispute_definition${"id":"compliance.disputes","path":"/pole/compliance/disputes","label":"Litiges","scope":"compliance","transversal":false,"restrictedRoles":["ceo","juriste","conformite_juridique","responsable_conformite","analyste_rgpd","gestionnaire_contrats"],"public":false,"approvalLevels":2,"fields":[{"key":"party","label":"Partie concernée","type":"text","required":true},{"key":"type","label":"Type de litige","type":"text","required":true},{"key":"description","label":"Constat","type":"textarea","required":true},{"key":"stage","label":"Étape de traitement","type":"text","required":false},{"key":"amount","label":"Montant contesté","type":"text","required":false},{"key":"currency","label":"Devise","type":"text","required":false},{"key":"legal_reference","label":"Référence applicable","type":"text","required":false},{"key":"assessment","label":"Analyse interne","type":"textarea","required":false},{"key":"proposal","label":"Proposition de traitement","type":"textarea","required":false},{"key":"evidence","label":"Justification et vérification","type":"textarea","required":false},{"key":"outcome","label":"Issue proposée","type":"text","required":false},{"key":"entity","label":"Périmètre historique","type":"text","required":false},{"key":"requirement","label":"Constat historique","type":"textarea","required":false},{"key":"mitigation","label":"Traitement historique","type":"textarea","required":false},{"key":"amount_raw","label":"Montant historique non structuré","type":"text","required":false}]}$dispute_definition$::jsonb WHERE page_id='compliance.disputes';
ALTER TABLE public.intranet_records
 ADD COLUMN IF NOT EXISTS dispute_reference text,
 ADD COLUMN IF NOT EXISTS dispute_opened_at timestamptz,
 ADD COLUMN IF NOT EXISTS dispute_legacy boolean,
 ADD COLUMN IF NOT EXISTS dispute_required_reviews integer CHECK(dispute_required_reviews IN(1,2)),
 ADD COLUMN IF NOT EXISTS dispute_submitted_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS dispute_submitted_at timestamptz,
 ADD COLUMN IF NOT EXISTS dispute_reviewed_at timestamptz,
 ADD COLUMN IF NOT EXISTS dispute_approved_at timestamptz,
 ADD COLUMN IF NOT EXISTS dispute_transition_key uuid,
 ADD COLUMN IF NOT EXISTS dispute_change_note text;
-- Reuse known fields and retain unstructured history; never invent a validator or date.
UPDATE public.intranet_records SET
 dispute_reference='LIT-'||to_char(created_at AT TIME ZONE 'UTC','YYYY')||'-'||upper(replace(id::text,'-','')),
 dispute_opened_at=created_at,dispute_legacy=true,dispute_required_reviews=coalesce((SELECT (definition->>'approvalLevels')::integer FROM public.intranet_modules WHERE page_id='compliance.disputes'),2),
 payload=payload||jsonb_build_object('party',coalesce(nullif(payload->>'party',''),payload->>'entity',''),'type',coalesce(nullif(payload->>'type',''),'Autre'),'description',coalesce(nullif(payload->>'description',''),payload->>'requirement',''),'stage',coalesce(nullif(payload->>'stage',''),'open'),'proposal',coalesce(payload->>'proposal',payload->>'mitigation',''),'outcome',coalesce(nullif(payload->>'outcome',''),'settlement'))
 WHERE page_id='compliance.disputes';
UPDATE public.intranet_records SET payload=(payload-'amount')||jsonb_build_object('amount_raw',payload->>'amount')WHERE page_id='compliance.disputes'AND nullif(payload->>'amount','')IS NOT NULL AND((payload->>'amount')!~'^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$'OR coalesce(payload->>'currency','')!~'^[A-Z]{3}$');
UPDATE public.intranet_records SET payload=jsonb_set(payload,'{amount}',to_jsonb(payload->>'amount'))WHERE page_id='compliance.disputes'AND nullif(payload->>'amount','')IS NOT NULL AND(payload->>'amount')~'^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$'AND(payload->>'currency')~'^[A-Z]{3}$';
CREATE UNIQUE INDEX compliance_dispute_reference ON public.intranet_records(dispute_reference)WHERE dispute_reference IS NOT NULL;
CREATE OR REPLACE FUNCTION public.guard_compliance_dispute()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid();before jsonb;after jsonb:=to_jsonb(NEW);field text;changed boolean;manager boolean;levels integer;document uuid;new_stage text;old_stage text;
BEGIN
 IF TG_OP='UPDATE'AND OLD.page_id='compliance.disputes'AND NEW.page_id IS DISTINCT FROM OLD.page_id THEN RAISE EXCEPTION 'dispute_identity_immutable' USING ERRCODE='42501';END IF;
 IF NEW.page_id<>'compliance.disputes'OR actor IS NULL OR auth.role()='service_role'THEN RETURN NEW;END IF;
 IF NOT public.can_intranet_action('compliance.disputes','read')THEN RAISE EXCEPTION 'dispute_forbidden' USING ERRCODE='42501';END IF;
 manager:=public.can_intranet_action('compliance.disputes','validate');
 SELECT coalesce((definition->>'approvalLevels')::integer,2)INTO levels FROM public.intranet_modules WHERE page_id='compliance.disputes';
 IF TG_OP='INSERT'THEN
  IF NOT public.can_intranet_action('compliance.disputes','create')OR NEW.status<>'draft'OR NEW.first_reviewer IS NOT NULL OR NEW.approved_by IS NOT NULL OR NEW.dispute_submitted_by IS NOT NULL OR NEW.dispute_submitted_at IS NOT NULL OR NEW.dispute_reviewed_at IS NOT NULL OR NEW.dispute_approved_at IS NOT NULL THEN RAISE EXCEPTION 'dispute_initial_state_required' USING ERRCODE='42501';END IF;
  NEW.created_by:=actor;NEW.created_at:=clock_timestamp();NEW.updated_at:=NEW.created_at;NEW.test_account:=public.intranet_is_test_mode();NEW.revision:=1;
  NEW.dispute_reference:='LIT-'||to_char(NEW.created_at AT TIME ZONE 'UTC','YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));NEW.dispute_opened_at:=NEW.created_at;NEW.dispute_legacy:=false;NEW.dispute_required_reviews:=levels;NEW.dispute_transition_key:=NULL;NEW.dispute_change_note:=NULL;
  IF nullif(NEW.payload->>'amount_raw','')IS NOT NULL THEN RAISE EXCEPTION 'dispute_legacy_amount_readonly' USING ERRCODE='22023';END IF;
  NEW.payload:=NEW.payload||jsonb_build_object('stage',coalesce(nullif(NEW.payload->>'stage',''),'open'),'outcome',coalesce(nullif(NEW.payload->>'outcome',''),'settlement'));
 ELSE
  before:=to_jsonb(OLD);changed:=NEW.status IS DISTINCT FROM OLD.status;
  IF NOT public.can_read_intranet_record(OLD)THEN RAISE EXCEPTION 'dispute_forbidden' USING ERRCODE='42501';END IF;
  IF NEW.revision IS DISTINCT FROM OLD.revision+1 THEN RAISE EXCEPTION 'dispute_changed' USING ERRCODE='40001';END IF;
  FOREACH field IN ARRAY ARRAY['id','page_id','created_by','created_at','test_account','creation_key','creation_request','dispute_reference','dispute_opened_at','dispute_legacy','dispute_required_reviews','dispute_submitted_by','dispute_submitted_at','dispute_reviewed_at','dispute_approved_at','first_reviewer','approved_by']LOOP IF after->field IS DISTINCT FROM before->field THEN RAISE EXCEPTION 'dispute_metadata_immutable' USING ERRCODE='42501';END IF;END LOOP;
  IF NEW.payload->'amount_raw'IS DISTINCT FROM OLD.payload->'amount_raw'THEN RAISE EXCEPTION 'dispute_legacy_amount_readonly' USING ERRCODE='42501';END IF;
  IF changed THEN
   IF NEW.dispute_transition_key IS NULL OR NEW.dispute_transition_key IS NOT DISTINCT FROM OLD.dispute_transition_key OR length(btrim(coalesce(NEW.dispute_change_note,'')))NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'dispute_workflow_and_reason_required' USING ERRCODE='22023';END IF;
   IF(after-ARRAY['status','revision','updated_at','dispute_transition_key','dispute_change_note'])IS DISTINCT FROM(before-ARRAY['status','revision','updated_at','dispute_transition_key','dispute_change_note'])THEN RAISE EXCEPTION 'dispute_transition_content_changed' USING ERRCODE='22023';END IF;
   IF NOT(OLD.status IN('draft','rejected')AND NEW.status='submitted'OR OLD.status='submitted'AND NEW.status IN('reviewed','approved','rejected')OR OLD.status='reviewed'AND NEW.status IN('approved','rejected')OR OLD.status='approved'AND NEW.status IN('draft','archived'))THEN RAISE EXCEPTION 'invalid_dispute_transition' USING ERRCODE='22023';END IF;
   IF NEW.status='submitted'THEN
    IF NOT public.can_intranet_action('compliance.disputes','update')OR(actor IS DISTINCT FROM OLD.created_by AND actor IS DISTINCT FROM OLD.owner_id AND NOT manager)THEN RAISE EXCEPTION 'dispute_owner_forbidden' USING ERRCODE='42501';END IF;
    IF coalesce(OLD.payload->>'stage','')NOT IN('analysis','negotiation')OR length(btrim(coalesce(OLD.payload->>'assessment','')))=0 OR length(btrim(coalesce(OLD.payload->>'proposal','')))=0 OR(length(btrim(coalesce(OLD.payload->>'evidence','')))=0 AND cardinality(OLD.document_ids)=0)THEN RAISE EXCEPTION 'dispute_proposal_evidence_required' USING ERRCODE='22023';END IF;
    NEW.dispute_submitted_by:=actor;NEW.dispute_submitted_at:=clock_timestamp();NEW.first_reviewer:=NULL;NEW.approved_by:=NULL;NEW.dispute_reviewed_at:=NULL;NEW.dispute_approved_at:=NULL;
   ELSIF NEW.status='archived'THEN
    IF NOT public.can_intranet_action('compliance.disputes','delete')OR(actor IS DISTINCT FROM OLD.created_by AND actor IS DISTINCT FROM OLD.owner_id AND NOT manager)THEN RAISE EXCEPTION 'dispute_archive_forbidden' USING ERRCODE='42501';END IF;
   ELSE
    IF NOT manager THEN RAISE EXCEPTION 'dispute_validation_forbidden' USING ERRCODE='42501';END IF;
    IF NEW.status<>'draft'AND(actor=OLD.created_by OR actor=OLD.owner_id OR actor=OLD.dispute_submitted_by)THEN RAISE EXCEPTION 'dispute_distinct_reviewer_required' USING ERRCODE='42501';END IF;
    IF NEW.status IN('reviewed','approved')THEN
     IF OLD.dispute_submitted_by IS NULL THEN RAISE EXCEPTION 'dispute_legacy_submission_needs_rework' USING ERRCODE='22023';END IF;
     IF greatest(coalesce(OLD.dispute_required_reviews,2),levels)=2 AND OLD.status='submitted'AND NEW.status<>'reviewed'THEN RAISE EXCEPTION 'dispute_first_review_required' USING ERRCODE='42501';END IF;
     IF NEW.status='reviewed'THEN
      IF greatest(coalesce(OLD.dispute_required_reviews,2),levels)<>2 THEN RAISE EXCEPTION 'invalid_dispute_transition' USING ERRCODE='22023';END IF;
      NEW.first_reviewer:=actor;NEW.dispute_reviewed_at:=clock_timestamp();
     ELSE
      IF OLD.status='reviewed'AND(OLD.first_reviewer IS NULL OR OLD.first_reviewer=actor)THEN RAISE EXCEPTION 'dispute_distinct_final_reviewer_required' USING ERRCODE='42501';END IF;
      NEW.approved_by:=actor;NEW.dispute_approved_at:=clock_timestamp();
     END IF;
    ELSE
     NEW.first_reviewer:=NULL;NEW.approved_by:=NULL;NEW.dispute_submitted_by:=NULL;NEW.dispute_submitted_at:=NULL;NEW.dispute_reviewed_at:=NULL;NEW.dispute_approved_at:=NULL;
    END IF;
   END IF;
  ELSE
   IF OLD.status NOT IN('draft','rejected')THEN RAISE EXCEPTION 'dispute_content_locked' USING ERRCODE='55000';END IF;
   IF NOT public.can_intranet_action('compliance.disputes','update')OR(actor IS DISTINCT FROM OLD.created_by AND actor IS DISTINCT FROM OLD.owner_id AND NOT manager)THEN RAISE EXCEPTION 'dispute_owner_forbidden' USING ERRCODE='42501';END IF;
   IF NEW.dispute_transition_key IS DISTINCT FROM OLD.dispute_transition_key OR NEW.dispute_change_note IS DISTINCT FROM OLD.dispute_change_note THEN RAISE EXCEPTION 'dispute_metadata_immutable' USING ERRCODE='42501';END IF;
   new_stage:=coalesce(NEW.payload->>'stage','open');old_stage:=coalesce(OLD.payload->>'stage','open');
   IF new_stage<>old_stage AND NOT(old_stage='open'AND new_stage='analysis'OR old_stage='analysis'AND new_stage='negotiation'OR old_stage='negotiation'AND new_stage='analysis')THEN RAISE EXCEPTION 'invalid_dispute_stage' USING ERRCODE='22023';END IF;
  END IF;
  IF OLD.status<>'approved'OR NEW.status='draft'THEN NEW.dispute_required_reviews:=greatest(coalesce(OLD.dispute_required_reviews,2),levels);END IF;
 END IF;
 PERFORM public.validate_intranet_payload('compliance.disputes',NEW.payload);
 IF NEW.payload->>'stage'IS NULL OR NEW.payload->>'outcome'IS NULL OR coalesce(NEW.payload->>'stage','open')NOT IN('open','analysis','negotiation')OR coalesce(NEW.payload->>'outcome','settlement')NOT IN('settlement','dismissed')OR length(NEW.payload->>'party')>255 OR length(NEW.payload->>'type')>100 OR length(coalesce(NEW.payload->>'currency',''))>3 OR nullif(NEW.payload->>'currency','')IS NOT NULL AND(NEW.payload->>'currency')!~'^[A-Z]{3}$'OR nullif(NEW.payload->>'amount','')IS NOT NULL AND((NEW.payload->>'amount')!~'^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$'OR coalesce(NEW.payload->>'currency','')!~'^[A-Z]{3}$')THEN RAISE EXCEPTION 'invalid_dispute_fields' USING ERRCODE='22023';END IF;
 IF NEW.payload->>'stage'='negotiation'AND length(btrim(coalesce(NEW.payload->>'assessment','')))=0 THEN RAISE EXCEPTION 'dispute_analysis_required' USING ERRCODE='22023';END IF;
 IF(TG_OP='INSERT'OR NEW.due_date IS DISTINCT FROM OLD.due_date)AND NEW.due_date IS NOT NULL AND NOT isfinite(NEW.due_date)THEN RAISE EXCEPTION 'invalid_dispute_deadline' USING ERRCODE='22023';END IF;
 IF cardinality(NEW.document_ids)>(CASE WHEN TG_OP='INSERT'THEN 20 ELSE greatest(20,cardinality(OLD.document_ids))END)THEN RAISE EXCEPTION 'dispute_attachment_limit' USING ERRCODE='22023';END IF;
 IF NEW.owner_id IS NOT NULL AND(TG_OP='INSERT'OR NEW.owner_id IS DISTINCT FROM OLD.owner_id)AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=NEW.owner_id AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=NEW.test_account AND public.can_intranet_action_for(p.id,'compliance.disputes','read')AND public.can_intranet_action_for(p.id,'compliance.disputes','update'))THEN RAISE EXCEPTION 'dispute_assignee_forbidden' USING ERRCODE='42501';END IF;
 FOREACH document IN ARRAY NEW.document_ids LOOP
  IF(TG_OP='INSERT'OR NOT document=ANY(OLD.document_ids))AND NOT EXISTS(SELECT 1 FROM public.intranet_drive_documents d WHERE d.id=document AND d.owner_id=actor AND d.test_account=NEW.test_account AND public.can_read_intranet_drive_document(d))THEN RAISE EXCEPTION 'dispute_attachment_forbidden' USING ERRCODE='42501';END IF;
 END LOOP;
 RETURN NEW;
END;$$;
CREATE TRIGGER compliance_dispute_guard BEFORE INSERT OR UPDATE ON public.intranet_records FOR EACH ROW EXECUTE FUNCTION public.guard_compliance_dispute();
CREATE OR REPLACE FUNCTION public.stamp_compliance_dispute_event()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_records;BEGIN
 SELECT * INTO r FROM public.intranet_records WHERE id=NEW.record_id;
 IF r.page_id<>'compliance.disputes'OR auth.uid()IS NULL OR auth.role()='service_role'THEN RETURN NEW;END IF;
 IF NOT public.can_read_intranet_record(r)AND NOT(NEW.kind='updated'AND NEW.before_state IS NOT NULL AND NEW.before_state->>'id'=r.id::text AND public.can_read_intranet_record(jsonb_populate_record(NULL::public.intranet_records,NEW.before_state)))THEN RAISE EXCEPTION 'dispute_forbidden' USING ERRCODE='42501';END IF;
 IF NEW.kind='comment'AND(r.status IN('approved','archived')OR NOT(public.can_intranet_action('compliance.disputes','update')OR public.can_intranet_action('compliance.disputes','validate')))THEN RAISE EXCEPTION 'dispute_comment_forbidden' USING ERRCODE='42501';END IF;
 NEW.actor_id:=auth.uid();NEW.created_at:=clock_timestamp();RETURN NEW;
END;$$;
CREATE TRIGGER compliance_dispute_event_stamp BEFORE INSERT ON public.intranet_record_events FOR EACH ROW EXECUTE FUNCTION public.stamp_compliance_dispute_event();
CREATE OR REPLACE FUNCTION public.save_compliance_dispute(p_id uuid,p_revision bigint,p_key uuid,p_title text,p_payload jsonb,p_owner uuid,p_due date,p_priority text,p_visibility text,p_documents uuid[]DEFAULT '{}')RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN RETURN public.save_intranet_record(p_id,'compliance.disputes',p_revision,p_key,p_title,p_payload,p_owner,p_due,p_priority,p_visibility,p_documents);END;$$;
CREATE OR REPLACE FUNCTION public.transition_compliance_dispute(p_id uuid,p_revision bigint,p_action text,p_note text)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE original public.intranet_records;saved public.intranet_records;target text;recipient record;BEGIN
 SELECT * INTO original FROM public.intranet_records WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR original.page_id<>'compliance.disputes'OR NOT public.can_read_intranet_record(original)THEN RAISE EXCEPTION 'dispute_forbidden' USING ERRCODE='42501';END IF;
 IF p_revision IS NULL OR p_revision<>original.revision THEN RAISE EXCEPTION 'dispute_changed' USING ERRCODE='40001';END IF;
 target:=CASE p_action WHEN 'submit'THEN 'submitted'WHEN 'approve'THEN CASE WHEN original.status='submitted'AND greatest(coalesce(original.dispute_required_reviews,2),coalesce((SELECT (definition->>'approvalLevels')::integer FROM public.intranet_modules WHERE page_id='compliance.disputes'),2))=2 THEN 'reviewed'ELSE 'approved'END WHEN 'return'THEN 'rejected'WHEN 'reopen'THEN 'draft'WHEN 'archive'THEN 'archived'END;
 IF target IS NULL OR p_action='approve'AND original.status NOT IN('submitted','reviewed')OR p_action='submit'AND original.status NOT IN('draft','rejected')OR p_action='return'AND original.status NOT IN('submitted','reviewed')OR p_action IN('reopen','archive')AND original.status<>'approved'THEN RAISE EXCEPTION 'invalid_dispute_transition' USING ERRCODE='22023';END IF;
 UPDATE public.intranet_records SET status=target,dispute_transition_key=gen_random_uuid(),dispute_change_note=nullif(btrim(p_note),''),revision=revision+1,updated_at=clock_timestamp()WHERE id=p_id RETURNING * INTO saved;
 INSERT INTO public.intranet_record_events(record_id,actor_id,kind,note,before_state,after_state,created_at)VALUES(saved.id,auth.uid(),target,btrim(p_note),to_jsonb(original),to_jsonb(saved),clock_timestamp());
 FOR recipient IN SELECT p.id FROM public.profiles p WHERE p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=saved.test_account AND p.id<>auth.uid()AND public.can_intranet_action_for(p.id,'compliance.disputes','read')AND(saved.visibility='pole'OR p.id=saved.created_by OR p.id=saved.owner_id OR public.can_intranet_action_for(p.id,'compliance.disputes','validate'))AND(CASE WHEN target IN('submitted','reviewed')THEN public.can_intranet_action_for(p.id,'compliance.disputes','validate')AND p.id IS DISTINCT FROM saved.created_by AND p.id IS DISTINCT FROM saved.owner_id AND p.id IS DISTINCT FROM saved.dispute_submitted_by AND(target<>'reviewed'OR p.id IS DISTINCT FROM saved.first_reviewer)ELSE target IN('approved','rejected','draft')AND p.id IN(saved.created_by,saved.owner_id,original.dispute_submitted_by)END)LOOP
  INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)VALUES(recipient.id,CASE WHEN target IN('submitted','reviewed')THEN 'Litige à valider'ELSE 'Suivi du litige mis à jour'END,saved.title,'info','/pole/compliance/disputes?record='||saved.id,jsonb_build_object('record_id',saved.id,'test_account',saved.test_account));
 END LOOP;
 RETURN to_jsonb(saved);
END;$$;
CREATE OR REPLACE FUNCTION public.comment_compliance_dispute(p_id uuid,p_note text)RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.intranet_records;result uuid;BEGIN
 SELECT * INTO r FROM public.intranet_records WHERE id=p_id FOR SHARE;
 IF NOT FOUND OR r.page_id<>'compliance.disputes'OR NOT public.can_read_intranet_record(r)OR r.status IN('approved','archived')OR NOT(public.can_intranet_action('compliance.disputes','update')OR public.can_intranet_action('compliance.disputes','validate'))THEN RAISE EXCEPTION 'dispute_comment_forbidden' USING ERRCODE='42501';END IF;
 IF length(btrim(coalesce(p_note,'')))NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'invalid_dispute_comment' USING ERRCODE='22023';END IF;
 INSERT INTO public.intranet_record_events(record_id,actor_id,kind,note,created_at)VALUES(p_id,auth.uid(),'comment',btrim(p_note),clock_timestamp())RETURNING id INTO result;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.list_compliance_dispute_people()RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',trim(concat_ws(' ',p.first_name,p.last_name)))ORDER BY p.last_name,p.first_name),'[]'::jsonb)FROM public.profiles p WHERE public.can_intranet_action('compliance.disputes','read')AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=public.intranet_is_test_mode()AND public.can_intranet_action_for(p.id,'compliance.disputes','read')AND public.can_intranet_action_for(p.id,'compliance.disputes','update');
$$;
CREATE OR REPLACE FUNCTION public.get_compliance_dispute(p_id uuid)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;BEGIN
 IF NOT public.can_intranet_action('compliance.disputes','read')THEN RAISE EXCEPTION 'dispute_forbidden' USING ERRCODE='42501';END IF;
 SELECT to_jsonb(r)||jsonb_build_object('owner_name',trim(concat_ws(' ',owner.first_name,owner.last_name)),'creator_name',trim(concat_ws(' ',creator.first_name,creator.last_name)),'submitter_name',trim(concat_ws(' ',submitter.first_name,submitter.last_name)),'reviewer_name',trim(concat_ws(' ',reviewer.first_name,reviewer.last_name)),'approver_name',trim(concat_ws(' ',approver.first_name,approver.last_name)))INTO result FROM public.intranet_records r LEFT JOIN public.profiles owner ON owner.id=r.owner_id LEFT JOIN public.profiles creator ON creator.id=r.created_by LEFT JOIN public.profiles submitter ON submitter.id=r.dispute_submitted_by LEFT JOIN public.profiles reviewer ON reviewer.id=r.first_reviewer LEFT JOIN public.profiles approver ON approver.id=r.approved_by WHERE r.id=p_id AND r.page_id='compliance.disputes';
 IF result IS NULL THEN RAISE EXCEPTION 'dispute_forbidden' USING ERRCODE='42501';END IF;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.list_compliance_disputes(p_search text DEFAULT '',p_status text DEFAULT 'active',p_stage text DEFAULT 'all',p_offset integer DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_intranet_action('compliance.disputes','read')THEN RAISE EXCEPTION 'dispute_forbidden' USING ERRCODE='42501';END IF;
 IF p_status IS NULL OR p_status NOT IN('active','all','draft','submitted','reviewed','approved','rejected','archived')OR p_stage IS NULL OR p_stage NOT IN('all','open','analysis','negotiation')OR p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_dispute_filter' USING ERRCODE='22023';END IF;
 RETURN(WITH selected AS(SELECT r.*,trim(concat_ws(' ',p.first_name,p.last_name))AS owner_name FROM public.intranet_records r LEFT JOIN public.profiles p ON p.id=r.owner_id WHERE r.page_id='compliance.disputes'AND(CASE WHEN p_status='archived'THEN r.status='archived'WHEN p_status='active'THEN r.status NOT IN('approved','archived')WHEN p_status='all'THEN r.status<>'archived'ELSE r.status=p_status END)AND(p_stage='all'OR r.payload->>'stage'=p_stage)AND concat_ws(' ',r.title,r.dispute_reference,r.payload->>'party',r.payload->>'description')ILIKE '%'||left(coalesce(p_search,''),200)||'%'ORDER BY r.updated_at DESC,r.id DESC LIMIT 51 OFFSET p_offset)
 SELECT jsonb_build_object('rows',(SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.updated_at DESC,x.id DESC),'[]'::jsonb)FROM(SELECT *FROM selected ORDER BY updated_at DESC,id DESC LIMIT 50)x),'has_more',(SELECT count(*)>50 FROM selected)));
END;$$;
CREATE OR REPLACE FUNCTION public.get_compliance_dispute_stats()RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_intranet_action('compliance.disputes','read')THEN RAISE EXCEPTION 'dispute_forbidden' USING ERRCODE='42501';END IF;
 RETURN(WITH visible AS(SELECT *FROM public.intranet_records WHERE page_id='compliance.disputes'AND status<>'archived'),money AS(SELECT payload->>'currency'AS currency,sum((payload->>'amount')::numeric)::text AS amount,count(*)AS samples FROM visible WHERE nullif(payload->>'amount','')IS NOT NULL AND(payload->>'amount')~'^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$'AND(payload->>'currency')~'^[A-Z]{3}$'GROUP BY payload->>'currency')SELECT jsonb_build_object('active',(SELECT count(*)FROM visible WHERE status<>'approved'),'awaiting_review',(SELECT count(*)FROM visible WHERE status IN('submitted','reviewed')),'closed',(SELECT count(*)FROM visible WHERE status='approved'),'overdue',(SELECT count(*)FROM visible WHERE status<>'approved'AND isfinite(due_date)AND due_date<current_date),'amounts',(SELECT coalesce(jsonb_agg(to_jsonb(money)),'[]'::jsonb)FROM money),'unknown_amounts',(SELECT count(*)FROM visible WHERE NOT coalesce((payload->>'amount')~'^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$'AND(payload->>'currency')~'^[A-Z]{3}$',false))));
END;$$;
CREATE OR REPLACE FUNCTION public.list_compliance_dispute_events(p_id uuid,p_offset integer DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.intranet_records WHERE id=p_id AND page_id='compliance.disputes')THEN RAISE EXCEPTION 'dispute_forbidden' USING ERRCODE='42501';END IF;
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_dispute_page' USING ERRCODE='22023';END IF;
 RETURN(WITH selected AS(SELECT e.*,trim(concat_ws(' ',p.first_name,p.last_name))AS actor_name FROM public.intranet_record_events e LEFT JOIN public.profiles p ON p.id=e.actor_id WHERE e.record_id=p_id ORDER BY e.created_at DESC,e.id DESC LIMIT 51 OFFSET p_offset)
 SELECT jsonb_build_object('rows',(SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.created_at DESC,x.id DESC),'[]'::jsonb)FROM(SELECT *FROM selected ORDER BY created_at DESC,id DESC LIMIT 50)x),'has_more',(SELECT count(*)>50 FROM selected)));
END;$$;
REVOKE ALL ON FUNCTION public.guard_compliance_dispute(),public.stamp_compliance_dispute_event()FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.save_compliance_dispute(uuid,bigint,uuid,text,jsonb,uuid,date,text,text,uuid[]),public.transition_compliance_dispute(uuid,bigint,text,text),public.comment_compliance_dispute(uuid,text),public.list_compliance_dispute_people(),public.get_compliance_dispute(uuid),public.list_compliance_disputes(text,text,text,integer),public.get_compliance_dispute_stats(),public.list_compliance_dispute_events(uuid,integer)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_compliance_dispute(uuid,bigint,uuid,text,jsonb,uuid,date,text,text,uuid[]),public.transition_compliance_dispute(uuid,bigint,text,text),public.comment_compliance_dispute(uuid,text),public.list_compliance_dispute_people(),public.get_compliance_dispute(uuid),public.list_compliance_disputes(text,text,text,integer),public.get_compliance_dispute_stats(),public.list_compliance_dispute_events(uuid,integer)TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
