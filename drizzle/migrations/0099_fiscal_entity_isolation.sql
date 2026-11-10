-- 0099: deny-by-default fiscal isolation. Legacy catalogue items are NOT legal entities.
-- Do not backfill from the free-text body.entity field; CEO must attribute each dossier.
-- No remote DDL executed by this commit.
CREATE TABLE public.bib_fiscal_record_entities (
 record_id text NOT NULL,
 test_account boolean NOT NULL DEFAULT false,
 entity_id uuid NOT NULL REFERENCES public.bib_fiscal_legal_entities(id),
 assigned_by uuid NOT NULL REFERENCES public.profiles(id),
 assigned_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(record_id,test_account),
 CHECK(record_id ~ '^[A-Z]{2,8}-[A-Z0-9-]{1,80}$')
);
CREATE INDEX bib_fiscal_record_entities_entity_idx ON public.bib_fiscal_record_entities(entity_id,test_account);
CREATE TABLE public.bib_fiscal_entity_grants (
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 entity_id uuid NOT NULL REFERENCES public.bib_fiscal_legal_entities(id),
 can_read boolean NOT NULL DEFAULT true,
 can_update boolean NOT NULL DEFAULT false,
 granted_by uuid NOT NULL REFERENCES public.profiles(id),
 granted_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,entity_id),
 CHECK(NOT can_update OR can_read)
);
CREATE TABLE public.bib_fiscal_governance_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id uuid NOT NULL REFERENCES public.profiles(id),
 event_kind text NOT NULL CHECK(event_kind IN ('assign_record','grant_access','revoke_access')),
 entity_id uuid NOT NULL REFERENCES public.bib_fiscal_legal_entities(id),
 record_id text,
 subject_id uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bib_fiscal_record_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_fiscal_entity_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_fiscal_governance_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_fiscal_record_entities,public.bib_fiscal_entity_grants,public.bib_fiscal_governance_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.bib_fiscal_record_allowed(p_record_id text,p_test boolean,p_action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL
 AND p_test=public.intranet_is_test_mode()
 AND (CASE WHEN public.bib_fiscal_is_canonical_ceo() THEN true
 ELSE p_action IN ('read','update')
  AND NOT public.intranet_is_test_mode()
  AND coalesce(public.can_intranet_action('finance.fiscal',p_action),false)
  AND EXISTS(
   SELECT 1 FROM public.bib_fiscal_record_entities l
   JOIN public.bib_fiscal_entity_grants g ON g.entity_id=l.entity_id AND g.user_id=auth.uid()
   JOIN public.bib_fiscal_legal_entities e ON e.id=l.entity_id
   WHERE l.record_id=p_record_id AND l.test_account=p_test
    AND e.status='active'
    AND g.can_read AND (p_action='read' OR g.can_update)
  ) END);
$$;
REVOKE ALL ON FUNCTION public.bib_fiscal_record_allowed(text,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_fiscal_record_allowed(text,boolean,text) TO authenticated;

-- All old direct table access must pass the same canonical mapping and grant checks.
DROP POLICY IF EXISTS bib_fiscal_catalog_read ON public.bib_fiscal_reference_catalog;
CREATE POLICY bib_fiscal_catalog_read ON public.bib_fiscal_reference_catalog
 FOR SELECT TO authenticated USING(public.bib_fiscal_record_allowed(record_id,public.intranet_is_test_mode(),'read'));
DROP POLICY IF EXISTS bib_fiscal_records_read ON public.bib_fiscal_records;
CREATE POLICY bib_fiscal_records_read ON public.bib_fiscal_records
 FOR SELECT TO authenticated USING(public.bib_fiscal_record_allowed(record_id,test_account,'read'));
DROP POLICY IF EXISTS bib_fiscal_events_read ON public.bib_fiscal_events;
CREATE POLICY bib_fiscal_events_read ON public.bib_fiscal_events
 FOR SELECT TO authenticated USING(public.bib_fiscal_record_allowed(record_id,test_account,'read'));

-- Existing SECURITY DEFINER algorithms are preserved as private implementation details.
-- REVOKE is essential: a caller must not bypass the wrappers by calling them directly.
ALTER FUNCTION public.list_bib_fiscal_records() RENAME TO bib_fiscal_list_internal_0088;
ALTER FUNCTION public.save_bib_fiscal_record(jsonb,bigint) RENAME TO bib_fiscal_save_internal_0088;
ALTER FUNCTION public.list_bib_fiscal_events(text) RENAME TO bib_fiscal_events_internal_0088;
REVOKE ALL ON FUNCTION public.bib_fiscal_list_internal_0088(),
 public.bib_fiscal_save_internal_0088(jsonb,bigint),
 public.bib_fiscal_events_internal_0088(text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.list_bib_fiscal_records()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v jsonb; items jsonb; v_ceo boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT coalesce(public.can_intranet_action('finance.fiscal','read'),false)
 THEN RAISE EXCEPTION 'fiscal_read_forbidden' USING ERRCODE='42501'; END IF;
 v_ceo:=public.bib_fiscal_is_canonical_ceo();
 -- Original function's full result stays inside this SECURITY DEFINER boundary.
 v:=public.bib_fiscal_list_internal_0088();
 SELECT coalesce(jsonb_agg(x.value ORDER BY x.value->>'id'),'[]'::jsonb) INTO items
 FROM jsonb_array_elements(v->'records') x
 WHERE public.bib_fiscal_record_allowed(x.value->>'id',public.intranet_is_test_mode(),'read');
 RETURN jsonb_build_object('records',items,
  'canWrite',v_ceo OR EXISTS(
   SELECT 1 FROM public.bib_fiscal_entity_grants g
   JOIN public.bib_fiscal_legal_entities e ON e.id=g.entity_id
   WHERE g.user_id=auth.uid() AND g.can_update AND e.status='active'
  ),'mode','saved');
END $$;

CREATE FUNCTION public.save_bib_fiscal_record(p_record jsonb,p_expected_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id text:=p_record->>'id'; v_mode boolean:=public.intranet_is_test_mode();
 existing_entity uuid;
BEGIN
 IF NOT public.bib_fiscal_record_allowed(v_id,v_mode,'update')
 THEN RAISE EXCEPTION 'fiscal_entity_write_forbidden' USING ERRCODE='42501'; END IF;
 -- Enforce immutable canonical attribution independently from the editable body.entity text.
 SELECT entity_id INTO existing_entity FROM public.bib_fiscal_record_entities
 WHERE record_id=v_id AND test_account=v_mode;
 IF existing_entity IS NOT NULL AND p_record?'legalEntityId'
  AND p_record->>'legalEntityId' IS DISTINCT FROM existing_entity::text
 THEN RAISE EXCEPTION 'fiscal_entity_identity_conflict' USING ERRCODE='22023'; END IF;
 RETURN public.bib_fiscal_save_internal_0088(p_record,p_expected_revision);
END $$;

CREATE FUNCTION public.list_bib_fiscal_events(p_record_id text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.bib_fiscal_record_allowed(p_record_id,public.intranet_is_test_mode(),'read')
 THEN RAISE EXCEPTION 'fiscal_entity_history_forbidden' USING ERRCODE='42501'; END IF;
 RETURN public.bib_fiscal_events_internal_0088(p_record_id);
END $$;

REVOKE ALL ON FUNCTION public.list_bib_fiscal_records(),
 public.save_bib_fiscal_record(jsonb,bigint),public.list_bib_fiscal_events(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_bib_fiscal_records(),
 public.save_bib_fiscal_record(jsonb,bigint),public.list_bib_fiscal_events(text) TO authenticated;

CREATE FUNCTION public.bib_assign_fiscal_record_entity(p_record_id text,p_entity_id uuid,p_test boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.bib_fiscal_is_canonical_ceo() OR p_test
 THEN RAISE EXCEPTION 'fiscal_entity_ceo_only' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.bib_fiscal_legal_entities WHERE id=p_entity_id)
  OR NOT EXISTS(SELECT 1 FROM public.bib_fiscal_reference_catalog WHERE record_id=p_record_id)
    AND NOT EXISTS(SELECT 1 FROM public.bib_fiscal_records WHERE record_id=p_record_id AND test_account=false)
 THEN RAISE EXCEPTION 'fiscal_record_or_entity_missing' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM public.bib_fiscal_record_entities
  WHERE record_id=p_record_id AND test_account=false)
 THEN RAISE EXCEPTION 'fiscal_entity_mapping_already_exists' USING ERRCODE='23505'; END IF;
 INSERT INTO public.bib_fiscal_record_entities(record_id,test_account,entity_id,assigned_by)
 VALUES(p_record_id,false,p_entity_id,auth.uid());
 INSERT INTO public.bib_fiscal_governance_events(actor_id,event_kind,entity_id,record_id)
 VALUES(auth.uid(),'assign_record',p_entity_id,p_record_id);
END $$;
REVOKE ALL ON FUNCTION public.bib_assign_fiscal_record_entity(text,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_assign_fiscal_record_entity(text,uuid,boolean) TO authenticated;

-- No grant RPC yet: projects are not active legal entities. Do not enable sharing before
-- identity/verification, explicit reviewer approval, and tested cross-entity RLS.
NOTIFY pgrst,'reload schema';
