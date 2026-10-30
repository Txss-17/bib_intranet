-- Synchronise le profil du CEO existant avec les 14 pôles canoniques.
-- À appliquer APRÈS 0058, qui ajoute les valeurs de l'enum pole_id.
DO $migration$
DECLARE
  v_ceo record;
  v_role uuid;
  v_poles public.pole_id[] := ARRAY[
    'direction','finance','ops','supplier','marketplace','support',
    'marketing','rh','audit','compliance','rse','product','data','security'
  ]::public.pole_id[];
BEGIN
  SELECT id INTO STRICT v_role FROM public.access_roles
    WHERE role_key='ceo' AND status='active';
  SELECT p.id,p.poles INTO STRICT v_ceo
  FROM public.profiles p
  JOIN public.access_assignments a
    ON a.employee_id=p.id AND a.role_id=v_role AND a.status='active'
  WHERE p.position='ceo' AND p.hr_status='active'
    AND p.test_account IS FALSE AND p.app_origin='connect'
  FOR UPDATE OF p;

  IF v_ceo.poles @> v_poles AND v_poles @> v_ceo.poles THEN RETURN; END IF;
  UPDATE public.profiles SET poles=v_poles WHERE id=v_ceo.id;

  INSERT INTO public.access_change_history(
    actor_id,employee_id,role_id,change_type,previous_value,new_value,reason
  ) VALUES (
    NULL,v_ceo.id,v_role,'ceo_pole_catalogue_alignment',
    to_jsonb(v_ceo.poles),to_jsonb(v_poles),
    'Alignment of existing CEO with the 14 canonical poles after additive enum upgrade; no user or password created.'
  );
END;
$migration$;
