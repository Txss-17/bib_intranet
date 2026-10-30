-- Keep the legacy typo role for historical references but prevent it from
-- being selected as a second "CEO" in HR or the role catalogue.
DO $migration$
DECLARE v_role uuid;
BEGIN
  SELECT id INTO v_role FROM public.access_roles WHERE role_key='cei' AND label='CEO' AND status='active';
  IF v_role IS NULL THEN RETURN; END IF;
  IF EXISTS (
    SELECT 1 FROM public.access_assignments
    WHERE role_id=v_role AND status IN ('active','pending')
  ) THEN
    RAISE EXCEPTION 'The legacy CEO role still has live or pending assignments';
  END IF;
  UPDATE public.access_roles
    SET status='inactive', label='CEO (historique — ne plus attribuer)', updated_at=now()
    WHERE id=v_role AND status='active';
  INSERT INTO public.access_change_history(actor_id,role_id,change_type,previous_value,new_value,reason)
  VALUES (NULL,v_role,'legacy_role_deactivation',
    jsonb_build_object('role_key','cei','status','active','label','CEO'),
    jsonb_build_object('role_key','cei','status','inactive','label','CEO (historique — ne plus attribuer)'),
    'Doublon historique archivé après migration vérifiée du compte CEO vers ceo.');
END;
$migration$;
