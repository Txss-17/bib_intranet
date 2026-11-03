-- Project priority is an operational field, not a strategic-roadmap weight.
-- Values are explicit and enforced on server; existing projects remain 'medium'.
ALTER TABLE public.work_projects
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';
ALTER TABLE public.work_projects
  DROP CONSTRAINT IF EXISTS work_projects_priority_check;
ALTER TABLE public.work_projects
  ADD CONSTRAINT work_projects_priority_check
  CHECK (priority IN ('low','medium','high','critical'));

-- The creation RPC deliberately whitelists fields. Extend only the projects
-- allowlist without changing idempotency, RLS or write-guard semantics.
CREATE OR REPLACE FUNCTION public.create_work_module_record(p_kind text,p_key uuid,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE t text:=public.work_module_table(p_kind);actor_column text;allowed text[];request jsonb;existing jsonb;result jsonb;columns text;values_sql text;
BEGIN
 IF t IS NULL OR NOT public.can_intranet_action('work.'||p_kind,'read')OR NOT public.can_intranet_action('work.'||p_kind,'create')THEN RAISE EXCEPTION 'work_create_forbidden' USING ERRCODE='42501';END IF;
 IF p_key IS NULL OR jsonb_typeof(p_payload)IS DISTINCT FROM 'object'OR octet_length(p_payload::text)>100000 THEN RAISE EXCEPTION 'invalid_work_payload' USING ERRCODE='22023';END IF;
 allowed:=CASE p_kind WHEN 'projects'THEN ARRAY['name','description','pole','owner_id','due_date','priority']WHEN 'processes'THEN ARRAY['name','description','pole','owner_id','steps']WHEN 'validations'THEN ARRAY['title','description','pole','validator_id']ELSE ARRAY['title','description','pole','severity','assigned_to']END;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload)k WHERE NOT k=ANY(allowed))THEN RAISE EXCEPTION 'unknown_work_field' USING ERRCODE='22023';END IF;
 actor_column:=CASE p_kind WHEN 'validations'THEN 'requester_id'WHEN 'escalations'THEN 'raised_by'ELSE 'created_by'END;
 PERFORM pg_advisory_xact_lock(hashtextextended(t||auth.uid()::text||p_key::text,0));
 EXECUTE format('SELECT to_jsonb(r)FROM public.%I r WHERE %I=$1 AND creation_key=$2',t,actor_column)INTO existing USING auth.uid(),p_key;
 IF existing IS NOT NULL THEN IF existing->'creation_request'IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'work_creation_key_conflict' USING ERRCODE='40001';END IF;RETURN existing;END IF;
 request:=p_payload||jsonb_build_object(actor_column,auth.uid(),'creation_key',p_key,'creation_request',p_payload);
 SELECT string_agg(quote_ident(k),','ORDER BY k),string_agg('r.'||quote_ident(k),','ORDER BY k)INTO columns,values_sql FROM jsonb_object_keys(request)k;
 EXECUTE format('INSERT INTO public.%1$I(%2$s)SELECT %3$s FROM jsonb_populate_record(NULL::public.%1$I,$1)r RETURNING to_jsonb(%1$I.*)',t,columns,values_sql)INTO result USING request;
 RETURN result;
END;
$$;
