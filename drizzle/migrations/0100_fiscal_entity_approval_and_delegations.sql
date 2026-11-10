-- 0100: independent legal verification, CEO activation, scoped fiscal delegations and saved views.
-- Requires migrations 0098/0099. No SQL is applied to remote databases by this commit.
ALTER TABLE public.bib_fiscal_legal_entities
 DROP CONSTRAINT bib_fiscal_legal_entities_status_check;
ALTER TABLE public.bib_fiscal_legal_entities
 ADD COLUMN registration_identifier text,
 ADD COLUMN review_reference text,
 ADD COLUMN reviewed_by uuid REFERENCES public.profiles(id),
 ADD COLUMN reviewed_at timestamptz,
 ADD COLUMN activated_by uuid REFERENCES public.profiles(id),
 ADD COLUMN activated_at timestamptz;
ALTER TABLE public.bib_fiscal_legal_entities
 ADD CONSTRAINT bib_fiscal_entity_lifecycle_check CHECK(
  status IN ('project','reviewed','active','suspended')
  AND (status='project' OR (
    review_reference IS NOT NULL
    AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL
    AND registration_identifier IS NOT NULL
    AND reviewed_by<>created_by
  ))
  AND (status NOT IN ('active','suspended') OR (activated_by IS NOT NULL AND activated_at IS NOT NULL))
 );
ALTER TABLE public.bib_fiscal_entity_grants ADD COLUMN expires_at timestamptz;

ALTER TABLE public.bib_fiscal_governance_events
 DROP CONSTRAINT bib_fiscal_governance_events_event_kind_check;
ALTER TABLE public.bib_fiscal_governance_events
 ADD CONSTRAINT bib_fiscal_governance_event_kind_check CHECK(
  event_kind IN ('assign_record','grant_access','revoke_access',
   'review_entity','activate_entity','suspend_entity')
 );

CREATE OR REPLACE FUNCTION public.bib_fiscal_record_allowed(p_record_id text,p_test boolean,p_action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL AND p_test=public.intranet_is_test_mode()
 AND (CASE WHEN public.bib_fiscal_is_canonical_ceo() THEN true
 ELSE p_action IN ('read','update')
  AND NOT public.intranet_is_test_mode()
  AND coalesce(public.can_intranet_action('finance.fiscal',p_action),false)
  AND EXISTS(
   SELECT 1 FROM public.bib_fiscal_record_entities l
   JOIN public.bib_fiscal_entity_grants g ON g.entity_id=l.entity_id AND g.user_id=auth.uid()
   JOIN public.bib_fiscal_legal_entities e ON e.id=l.entity_id
   WHERE l.record_id=p_record_id AND l.test_account=p_test
    AND e.status='active' AND (g.expires_at IS NULL OR g.expires_at>now())
    AND g.can_read AND (p_action='read' OR g.can_update)
  ) END);
$$;

-- Restrict legal reviewer list to project candidates, not operational fiscal dossiers.
CREATE FUNCTION public.list_bib_fiscal_entity_reviews()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE data jsonb;
BEGIN
 IF auth.uid() IS NULL OR public.intranet_is_test_mode()
  OR NOT coalesce(public.can_intranet_action('compliance.contracts','validate'),false)
 THEN RAISE EXCEPTION 'fiscal_legal_review_forbidden' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',e.id,'legal_name',e.legal_name,'country_code',e.country_code,
  'legal_form',e.legal_form,'status',e.status,'created_by',e.created_by)
  ORDER BY e.created_at DESC),'[]'::jsonb) INTO data
 FROM public.bib_fiscal_legal_entities e WHERE e.status='project';
 RETURN data;
END $$;

CREATE FUNCTION public.bib_review_fiscal_legal_entity(
 p_id uuid,p_registration_identifier text,p_reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e public.bib_fiscal_legal_entities%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR public.intranet_is_test_mode()
  OR NOT coalesce(public.can_intranet_action('compliance.contracts','validate'),false)
 THEN RAISE EXCEPTION 'fiscal_legal_review_forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO e FROM public.bib_fiscal_legal_entities WHERE id=p_id FOR UPDATE;
 IF e.id IS NULL OR e.status<>'project' OR e.created_by=auth.uid()
  OR length(btrim(coalesce(p_reference,''))) NOT BETWEEN 8 AND 500
  OR length(btrim(coalesce(p_registration_identifier,''))) NOT BETWEEN 5 AND 60
  OR (e.country_code='FR' AND btrim(p_registration_identifier) !~ '^[0-9]{9}$')
 THEN RAISE EXCEPTION 'fiscal_legal_review_incomplete_or_not_independent' USING ERRCODE='23514'; END IF;
 UPDATE public.bib_fiscal_legal_entities SET status='reviewed',
  registration_identifier=btrim(p_registration_identifier),
  review_reference=btrim(p_reference),reviewed_by=auth.uid(),reviewed_at=now(),
  updated_by=auth.uid(),updated_at=now()
 WHERE id=p_id;
 INSERT INTO public.bib_fiscal_governance_events(actor_id,event_kind,entity_id)
 VALUES(auth.uid(),'review_entity',p_id);
END $$;

CREATE FUNCTION public.bib_activate_fiscal_legal_entity(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e public.bib_fiscal_legal_entities%ROWTYPE;
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo() OR public.intranet_is_test_mode()
 THEN RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501'; END IF;
 SELECT * INTO e FROM public.bib_fiscal_legal_entities WHERE id=p_id FOR UPDATE;
 IF e.id IS NULL OR e.status<>'reviewed' OR e.reviewed_by IS NULL
  OR e.reviewed_by=e.created_by OR e.review_reference IS NULL
  OR e.registration_identifier IS NULL
 THEN RAISE EXCEPTION 'independent_legal_verification_required' USING ERRCODE='23514'; END IF;
 UPDATE public.bib_fiscal_legal_entities SET status='active',activated_by=auth.uid(),
  activated_at=now(),updated_by=auth.uid(),updated_at=now() WHERE id=p_id;
 INSERT INTO public.bib_fiscal_governance_events(actor_id,event_kind,entity_id)
 VALUES(auth.uid(),'activate_entity',p_id);
END $$;

CREATE FUNCTION public.bib_suspend_fiscal_legal_entity(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo() OR public.intranet_is_test_mode()
 THEN RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501'; END IF;
 UPDATE public.bib_fiscal_legal_entities SET status='suspended',updated_by=auth.uid(),updated_at=now()
 WHERE id=p_id AND status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'active_fiscal_entity_required' USING ERRCODE='23514'; END IF;
 INSERT INTO public.bib_fiscal_governance_events(actor_id,event_kind,entity_id)
 VALUES(auth.uid(),'suspend_entity',p_id);
END $$;

-- User-specific grants; neither a pole membership nor a CEO-saved view is a grant.
CREATE FUNCTION public.bib_grant_fiscal_entity_access(
 p_entity_id uuid,p_user_id uuid,p_can_update boolean,p_expires_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo() OR public.intranet_is_test_mode()
 THEN RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501'; END IF;
 IF p_user_id IS NULL OR p_user_id=auth.uid()
  OR NOT EXISTS (SELECT 1 FROM public.bib_fiscal_legal_entities
                  WHERE id=p_entity_id AND status='active')
  OR NOT EXISTS (SELECT 1 FROM public.profiles p
    WHERE p.id=p_user_id AND p.app_origin='connect'
      AND p.hr_status='active' AND p.test_account IS FALSE
      AND EXISTS(SELECT 1 FROM public.access_assignments a
                 JOIN public.access_roles r ON r.id=a.role_id
                 WHERE a.employee_id=p.id AND a.status='active' AND r.status='active'
                   AND (a.starts_at IS NULL OR a.starts_at<=now())
                   AND (a.ends_at IS NULL OR a.ends_at>=now())))
  OR p_expires_at IS NULL OR p_expires_at<=now()
  OR p_expires_at>now()+interval '365 days'
 THEN RAISE EXCEPTION 'invalid_fiscal_entity_grant' USING ERRCODE='23514'; END IF;
 INSERT INTO public.bib_fiscal_entity_grants
  (user_id,entity_id,can_read,can_update,granted_by,expires_at)
 VALUES(p_user_id,p_entity_id,true,coalesce(p_can_update,false),auth.uid(),p_expires_at)
 ON CONFLICT(user_id,entity_id) DO UPDATE SET
 can_read=true,can_update=EXCLUDED.can_update,granted_by=auth.uid(),
 granted_at=now(),expires_at=EXCLUDED.expires_at;
 INSERT INTO public.bib_fiscal_governance_events(actor_id,event_kind,entity_id,subject_id)
 VALUES(auth.uid(),'grant_access',p_entity_id,p_user_id);
END $$;

CREATE FUNCTION public.bib_revoke_fiscal_entity_access(p_entity_id uuid,p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo() OR public.intranet_is_test_mode()
 THEN RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501'; END IF;
 DELETE FROM public.bib_fiscal_entity_grants WHERE entity_id=p_entity_id AND user_id=p_user_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'fiscal_grant_not_found' USING ERRCODE='23514'; END IF;
 INSERT INTO public.bib_fiscal_governance_events(actor_id,event_kind,entity_id,subject_id)
 VALUES(auth.uid(),'revoke_access',p_entity_id,p_user_id);
END $$;

CREATE FUNCTION public.list_bib_fiscal_entity_grants()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE data jsonb;
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo()
 THEN RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'entity_id',entity_id,'user_id',user_id,'can_update',can_update,'expires_at',expires_at
 ) ORDER BY granted_at DESC),'[]'::jsonb) INTO data FROM public.bib_fiscal_entity_grants;
 RETURN data;
END $$;

-- Reuse the existing CEO list RPC, adding the verified lifecycle for its cockpit.
CREATE OR REPLACE FUNCTION public.list_bib_fiscal_legal_entities()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE data jsonb;
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo()
 THEN RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',e.id,'legal_name',e.legal_name,'country_code',e.country_code,
  'legal_form',e.legal_form,'status',e.status,'notes',e.notes,
  'registration_identifier',e.registration_identifier,
  'review_reference',e.review_reference,'reviewed_at',e.reviewed_at,
  'created_at',e.created_at) ORDER BY e.created_at DESC),'[]'::jsonb)
 INTO data FROM public.bib_fiscal_legal_entities e;
 RETURN data;
END $$;

-- CEO view preferences cannot authorize data access.
CREATE TABLE public.bib_fiscal_saved_views (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES public.profiles(id),
 label text NOT NULL CHECK(length(btrim(label)) BETWEEN 3 AND 80),
 filters jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(filters)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bib_fiscal_saved_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_fiscal_saved_views FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.list_bib_fiscal_saved_views()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE data jsonb;
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo()
 THEN RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',id,'label',label,'filters',filters) ORDER BY updated_at DESC),'[]'::jsonb)
 INTO data FROM public.bib_fiscal_saved_views WHERE owner_id=auth.uid();
 RETURN data;
END $$;
CREATE FUNCTION public.bib_save_fiscal_view(p_label text,p_filters jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid;
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo()
 THEN RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501'; END IF;
 IF length(btrim(coalesce(p_label,''))) NOT BETWEEN 3 AND 80
  OR jsonb_typeof(p_filters) IS DISTINCT FROM 'object'
  OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_filters) k
    WHERE k NOT IN ('entityId','pole','kind','status','risk'))
  OR EXISTS(SELECT 1 FROM jsonb_each(p_filters) x
    WHERE jsonb_typeof(x.value) IS DISTINCT FROM 'string'
     OR length(x.value #>> '{}')>120)
  OR (p_filters?'entityId' AND NOT EXISTS(
   SELECT 1 FROM public.bib_fiscal_legal_entities
   WHERE id::text=p_filters->>'entityId'))
 THEN RAISE EXCEPTION 'invalid_fiscal_view' USING ERRCODE='22023'; END IF;
 INSERT INTO public.bib_fiscal_saved_views(owner_id,label,filters)
 VALUES(auth.uid(),btrim(p_label),p_filters) RETURNING id INTO v_id;
 RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.list_bib_fiscal_entity_reviews(),
 public.bib_review_fiscal_legal_entity(uuid,text,text),
 public.bib_activate_fiscal_legal_entity(uuid),
 public.bib_suspend_fiscal_legal_entity(uuid),
 public.bib_grant_fiscal_entity_access(uuid,uuid,boolean,timestamptz),
 public.bib_revoke_fiscal_entity_access(uuid,uuid),
 public.list_bib_fiscal_entity_grants(),
 public.list_bib_fiscal_saved_views(),
 public.bib_save_fiscal_view(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_bib_fiscal_entity_reviews(),
 public.bib_review_fiscal_legal_entity(uuid,text,text),
 public.bib_activate_fiscal_legal_entity(uuid),
 public.bib_suspend_fiscal_legal_entity(uuid),
 public.bib_grant_fiscal_entity_access(uuid,uuid,boolean,timestamptz),
 public.bib_revoke_fiscal_entity_access(uuid,uuid),
 public.list_bib_fiscal_entity_grants(),
 public.list_bib_fiscal_saved_views(),
 public.bib_save_fiscal_view(text,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
