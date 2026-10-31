-- Audited, optimistic, atomic RBAC permission matrix edits.
-- Source-only migration: apply and verify separately; committing does not
-- execute a Supabase migration or publish the application.
CREATE OR REPLACE FUNCTION public.replace_access_permission_changes(
  p_role_id uuid, p_changes jsonb, p_reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_actor uuid := auth.uid();
  v_previous jsonb;
  v_count integer;
BEGIN
  IF v_actor IS NULL OR NOT coalesce(public.has_role(v_actor,'admin'::public.app_role), false) THEN
    RAISE EXCEPTION 'Technical administrator required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_changes) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_changes) NOT BETWEEN 1 AND 5000
     OR length(btrim(coalesce(p_reason,''))) < 8 THEN
    RAISE EXCEPTION 'Invalid permission change request' USING ERRCODE = '22023';
  END IF;
  -- Serialise competing permission editors of the same role.
  PERFORM 1 FROM public.access_roles WHERE id=p_role_id AND status='active' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role is missing or inactive' USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO v_count
  FROM jsonb_to_recordset(p_changes)
    AS c(interface_id uuid, action_id uuid, expected boolean, allowed boolean);
  IF v_count <> jsonb_array_length(p_changes) OR EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_changes)
      AS c(interface_id uuid, action_id uuid, expected boolean, allowed boolean)
    LEFT JOIN public.access_interfaces i ON i.id=c.interface_id AND i.status='active'
    LEFT JOIN public.access_actions a ON a.id=c.action_id
    WHERE i.id IS NULL OR a.id IS NULL OR c.allowed IS NULL
  ) OR EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_changes)
      AS c(interface_id uuid, action_id uuid, expected boolean, allowed boolean)
    GROUP BY c.interface_id,c.action_id HAVING count(*)>1
  ) THEN
    RAISE EXCEPTION 'Invalid or duplicate interface/action permission' USING ERRCODE = '22023';
  END IF;

  -- NULL expected means the row did not exist when the UI loaded.
  -- IS DISTINCT FROM detects both changes and concurrent insertions.
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_changes)
      AS c(interface_id uuid, action_id uuid, expected boolean, allowed boolean)
    LEFT JOIN public.access_permissions ap
      ON ap.role_id=p_role_id AND ap.interface_id=c.interface_id AND ap.action_id=c.action_id
    WHERE ap.allowed IS DISTINCT FROM c.expected
  ) THEN
    RAISE EXCEPTION 'Permission matrix changed; reload before saving'
      USING ERRCODE = '40001';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
     'interface_id',c.interface_id,'action_id',c.action_id,
     'allowed',ap.allowed) ORDER BY c.interface_id,c.action_id), '[]'::jsonb)
  INTO v_previous
  FROM jsonb_to_recordset(p_changes)
    AS c(interface_id uuid, action_id uuid, expected boolean, allowed boolean)
  LEFT JOIN public.access_permissions ap
    ON ap.role_id=p_role_id AND ap.interface_id=c.interface_id AND ap.action_id=c.action_id;

  INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)
  SELECT p_role_id,c.interface_id,c.action_id,c.allowed
  FROM jsonb_to_recordset(p_changes)
    AS c(interface_id uuid, action_id uuid, expected boolean, allowed boolean)
  ON CONFLICT (role_id,interface_id,action_id) DO UPDATE
    SET allowed=EXCLUDED.allowed, updated_at=now();

  INSERT INTO public.access_change_history(
    actor_id,role_id,change_type,previous_value,new_value,reason
  ) VALUES (
    v_actor,p_role_id,'permission_matrix_update',v_previous,p_changes,btrim(p_reason)
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.replace_access_permission_changes(uuid,jsonb,text)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.replace_access_permission_changes(uuid,jsonb,text)
  TO authenticated;
