-- Safely edit scopes on an existing role without rewriting roles, accounts or
-- the permissions matrix. Deployment requires staging review first.
CREATE OR REPLACE FUNCTION public.replace_access_role_scopes(
  p_role_id uuid,
  p_expected jsonb,
  p_next jsonb,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actual jsonb;
  v_expected jsonb;
  v_next jsonb;
  v_invalid integer;
  v_count integer;
  v_global integer;
BEGIN
  IF v_actor IS NULL OR NOT public.has_role(v_actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator permission required' USING ERRCODE = '42501';
  END IF;
  IF p_role_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.access_roles WHERE id = p_role_id FOR UPDATE
  ) THEN
    RAISE EXCEPTION 'Role not found' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_expected) IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_next) IS DISTINCT FROM 'array'
     OR length(trim(coalesce(p_reason, ''))) < 8 THEN
    RAISE EXCEPTION 'Invalid scope change request' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_next) > 50 OR jsonb_array_length(p_expected) > 50 THEN
    RAISE EXCEPTION 'Too many scopes' USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('scope_id', s.scope_id, 'scope_value', s.scope_value)
           ORDER BY s.scope_id, s.scope_value NULLS FIRST), '[]'::jsonb)
    INTO v_actual
  FROM public.access_role_scopes s WHERE s.role_id = p_role_id;

  BEGIN
    SELECT coalesce(jsonb_agg(jsonb_build_object('scope_id', x.scope_id, 'scope_value', nullif(trim(x.scope_value), ''))
           ORDER BY x.scope_id, nullif(trim(x.scope_value), '') NULLS FIRST), '[]'::jsonb)
      INTO v_expected FROM jsonb_to_recordset(p_expected) AS x(scope_id uuid, scope_value text);
    SELECT coalesce(jsonb_agg(jsonb_build_object('scope_id', x.scope_id, 'scope_value', nullif(trim(x.scope_value), ''))
           ORDER BY x.scope_id, nullif(trim(x.scope_value), '') NULLS FIRST), '[]'::jsonb)
      INTO v_next FROM jsonb_to_recordset(p_next) AS x(scope_id uuid, scope_value text);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Malformed scope payload' USING ERRCODE = '22023';
  END;
  IF v_actual IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION 'Scopes have changed; reload before saving' USING ERRCODE = '40001';
  END IF;
  SELECT count(*) INTO v_count FROM jsonb_to_recordset(v_next) AS x(scope_id uuid, scope_value text);
  IF v_count = 0 THEN
    RAISE EXCEPTION 'At least one scope is required' USING ERRCODE = '22023';
  END IF;
  SELECT count(*) INTO v_invalid
  FROM jsonb_to_recordset(v_next) x(scope_id uuid, scope_value text)
  LEFT JOIN public.access_scopes s ON s.id=x.scope_id
  WHERE s.id IS NULL
    OR (s.scope_key IN ('global','own_records') AND x.scope_value IS NOT NULL)
    OR (s.scope_key NOT IN ('global','own_records') AND x.scope_value IS NULL)
    OR (s.scope_key NOT IN ('global','own_records','pole','portfolio','region','subsidiary'));
  IF v_invalid > 0 THEN
    RAISE EXCEPTION 'Unknown or invalid scope definition' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(v_next) x(scope_id uuid, scope_value text)
    GROUP BY x.scope_id, x.scope_value HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate scope assignment' USING ERRCODE = '22023';
  END IF;
  SELECT count(*) INTO v_global FROM jsonb_to_recordset(v_next) x(scope_id uuid, scope_value text)
  JOIN public.access_scopes s ON s.id=x.scope_id WHERE s.scope_key='global';
  IF v_global > 0 AND v_count > 1 THEN
    RAISE EXCEPTION 'Global scope cannot be combined with restrictive scopes' USING ERRCODE = '22023';
  END IF;
  IF v_actual = v_next THEN RETURN; END IF;

  DELETE FROM public.access_role_scopes WHERE role_id=p_role_id;
  INSERT INTO public.access_role_scopes(role_id,scope_id,scope_value)
  SELECT p_role_id,x.scope_id,x.scope_value
  FROM jsonb_to_recordset(v_next) x(scope_id uuid, scope_value text);

  INSERT INTO public.access_change_history(actor_id,role_id,change_type,previous_value,new_value,reason)
  VALUES (v_actor,p_role_id,'role_scope_update',v_actual,v_next,trim(p_reason));
END;
$$;

REVOKE ALL ON FUNCTION public.replace_access_role_scopes(uuid,jsonb,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.replace_access_role_scopes(uuid,jsonb,jsonb,text) TO authenticated;
