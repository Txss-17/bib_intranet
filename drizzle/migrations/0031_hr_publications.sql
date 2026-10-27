-- RH publications use the existing publications table; no sample data is inserted.
INSERT INTO public.access_interfaces(interface_key,label,module,pole,path,status)
VALUES ('rh.publications','Publications internes','rh','rh','/pole/rh/publications','active')
ON CONFLICT(interface_key) DO UPDATE SET label=EXCLUDED.label,path=EXCLUDED.path,status='active';
--> statement-breakpoint
-- This ordered snapshot follows usePermissions.inferRole; tests catch catalogue drift.
CREATE OR REPLACE FUNCTION public.legacy_hr_publication_role(p_position text,p_poles text[])
RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
  SELECT item->>'id'
  FROM jsonb_array_elements($roles$[{"id":"ceo","position":"ceo","poles":["direction","finance","ops","supplier","marketplace","support","marketing","rh","audit","compliance","rse","product","data","security"]},{"id":"coo","position":"ops_logistics_manager","poles":["direction","ops","supplier","marketplace","support"]},{"id":"cto","position":"product_engineering_manager","poles":["direction","product","data","security"]},{"id":"cfo","position":"finance_manager","poles":["direction","finance","compliance"]},{"id":"cdo","position":"data_bi_manager","poles":["direction","data","product"]},{"id":"directeur_rh","position":"rh_manager","poles":["direction","rh"]},{"id":"directeur_qualite","position":"audit_compliance_lead","poles":["direction","audit","compliance","supplier"]},{"id":"directeur_marketplace","position":"customer_success_manager","poles":["direction","marketplace","support","marketing"]},{"id":"comptable","position":"finance_manager","poles":["finance"]},{"id":"controleur_gestion","position":"finance_manager","poles":["finance","data"]},{"id":"analyste_financier","position":"finance_manager","poles":["finance","data"]},{"id":"tresorier","position":"finance_manager","poles":["finance"]},{"id":"gestionnaire_facturation","position":"finance_manager","poles":["finance"]},{"id":"gestionnaire_remboursements","position":"finance_manager","poles":["finance","support","marketplace"]},{"id":"gestionnaire_paiements","position":"finance_manager","poles":["finance"]},{"id":"responsable_rh","position":"rh_manager","poles":["rh"]},{"id":"charge_recrutement","position":"rh_manager","poles":["rh"]},{"id":"gestionnaire_paie","position":"rh_manager","poles":["rh","finance"]},{"id":"gestionnaire_admin_rh","position":"rh_manager","poles":["rh"]},{"id":"responsable_formation","position":"rh_manager","poles":["rh"]},{"id":"responsable_fournisseurs","position":"supplier_manager","poles":["supplier"]},{"id":"gestionnaire_fournisseurs","position":"supplier_manager","poles":["supplier","ops"]},{"id":"responsable_catalogue","position":"supplier_manager","poles":["supplier","product"]},{"id":"gestionnaire_catalogue","position":"supplier_manager","poles":["supplier"]},{"id":"conformite_fournisseurs","position":"audit_compliance_lead","poles":["supplier","compliance","audit"]},{"id":"acheteur","position":"supplier_manager","poles":["supplier","ops"]},{"id":"responsable_marketplace","position":"customer_success_manager","poles":["marketplace","ops","marketing"]},{"id":"gestionnaire_boutiques","position":"customer_success_manager","poles":["marketplace"]},{"id":"gestionnaire_vendeurs","position":"customer_success_manager","poles":["marketplace","supplier"]},{"id":"gestionnaire_commandes","position":"ops_logistics_manager","poles":["marketplace","ops"]},{"id":"gestionnaire_litiges","position":"audit_compliance_lead","poles":["marketplace","support","compliance"]},{"id":"gestionnaire_avis","position":"customer_success_manager","poles":["marketplace","marketing"]},{"id":"responsable_qualite","position":"audit_compliance_lead","poles":["audit","compliance","supplier"]},{"id":"auditeur_qualite","position":"audit_compliance_lead","poles":["audit"]},{"id":"auditeur_terrain","position":"audit_compliance_lead","poles":["audit","supplier","ops"]},{"id":"responsable_conformite","position":"audit_compliance_lead","poles":["compliance","audit"]},{"id":"gestionnaire_nc","position":"audit_compliance_lead","poles":["audit"]},{"id":"gestionnaire_certifications","position":"audit_compliance_lead","poles":["audit","supplier"]},{"id":"responsable_logistique","position":"ops_logistics_manager","poles":["ops"]},{"id":"gestionnaire_transport","position":"ops_logistics_manager","poles":["ops"]},{"id":"gestionnaire_entrepots","position":"ops_logistics_manager","poles":["ops"]},{"id":"gestionnaire_stocks","position":"ops_logistics_manager","poles":["ops","supplier"]},{"id":"coordinateur_expeditions","position":"ops_logistics_manager","poles":["ops"]},{"id":"responsable_support","position":"customer_success_manager","poles":["support","marketplace"]},{"id":"technicien_support","position":"customer_success_manager","poles":["support","product"]},{"id":"conseiller_client","position":"customer_success_manager","poles":["support"]},{"id":"gestionnaire_tickets","position":"customer_success_manager","poles":["support"]},{"id":"community_support","position":"customer_success_manager","poles":["support","marketing"]},{"id":"juriste","position":"audit_compliance_lead","poles":["compliance"]},{"id":"conformite_juridique","position":"audit_compliance_lead","poles":["compliance","audit"]},{"id":"gestionnaire_contrats","position":"audit_compliance_lead","poles":["compliance"]},{"id":"gestionnaire_docusign","position":"audit_compliance_lead","poles":["compliance","product"]},{"id":"responsable_marketing","position":"marketing_communication_manager","poles":["marketing"]},{"id":"growth_manager","position":"marketing_communication_manager","poles":["marketing","data"]},{"id":"content_manager","position":"marketing_communication_manager","poles":["marketing"]},{"id":"seo_manager","position":"marketing_communication_manager","poles":["marketing","data"]},{"id":"social_media_manager","position":"marketing_communication_manager","poles":["marketing"]},{"id":"crm_manager","position":"marketing_communication_manager","poles":["marketing","marketplace","support"]},{"id":"responsable_commercial","position":"customer_success_manager","poles":["marketplace","marketing"]},{"id":"business_developer","position":"customer_success_manager","poles":["marketplace","marketing"]},{"id":"account_manager","position":"customer_success_manager","poles":["marketplace","support"]},{"id":"customer_success_manager","position":"customer_success_manager","poles":["support","marketplace"]},{"id":"responsable_tech","position":"product_engineering_manager","poles":["product","data","security"]},{"id":"product_manager","position":"product_engineering_manager","poles":["product","data","marketing"]},{"id":"product_owner","position":"product_engineering_manager","poles":["product","data"]},{"id":"scrum_master","position":"product_engineering_manager","poles":["product"]},{"id":"dev_frontend","position":"product_engineering_manager","poles":["product"]},{"id":"dev_backend","position":"product_engineering_manager","poles":["product"]},{"id":"dev_fullstack","position":"product_engineering_manager","poles":["product"]},{"id":"dev_mobile","position":"product_engineering_manager","poles":["product"]},{"id":"ux_designer","position":"product_engineering_manager","poles":["product","marketing"]},{"id":"ui_designer","position":"product_engineering_manager","poles":["product","marketing"]},{"id":"product_designer","position":"product_engineering_manager","poles":["product","marketing"]},{"id":"qa_engineer","position":"product_engineering_manager","poles":["product","audit"]},{"id":"testeur_logiciel","position":"product_engineering_manager","poles":["product"]},{"id":"devops_engineer","position":"product_engineering_manager","poles":["product","security"]},{"id":"sre","position":"product_engineering_manager","poles":["product","security"]},{"id":"admin_systeme","position":"product_engineering_manager","poles":["security"]},{"id":"dba","position":"product_engineering_manager","poles":["product","data","security"]},{"id":"architecte_logiciel","position":"product_engineering_manager","poles":["product","security"]},{"id":"architecte_cloud","position":"product_engineering_manager","poles":["product","security"]},{"id":"ingenieur_cybersecurite","position":"product_engineering_manager","poles":["security","compliance","product"]},{"id":"responsable_data","position":"data_bi_manager","poles":["data","product"]},{"id":"data_bi_manager","position":"data_bi_manager","poles":["data"]},{"id":"business_analyst","position":"data_bi_manager","poles":["data","finance","marketplace"]},{"id":"data_engineer","position":"data_bi_manager","poles":["data","product"]},{"id":"analytics_engineer","position":"data_bi_manager","poles":["data","product"]},{"id":"data_scientist","position":"data_bi_manager","poles":["data"]},{"id":"bi_developer","position":"data_bi_manager","poles":["data"]},{"id":"data_steward","position":"data_bi_manager","poles":["data","compliance"]},{"id":"data_quality_manager","position":"data_bi_manager","poles":["data","audit"]},{"id":"rssi","position":"security_it_manager","poles":["security","product","compliance"]},{"id":"analyste_cyber","position":"security_it_manager","poles":["security"]},{"id":"gestionnaire_iam","position":"product_engineering_manager","poles":["security"]},{"id":"analyste_rgpd","position":"audit_compliance_lead","poles":["compliance","security"]},{"id":"office_manager","position":"rh_manager","poles":["rh"]},{"id":"assistant_administratif","position":"rh_manager","poles":["rh"]},{"id":"responsable_communication","position":"marketing_communication_manager","poles":["marketing"]},{"id":"relations_presse","position":"marketing_communication_manager","poles":["marketing"]},{"id":"responsable_innovation","position":"product_engineering_manager","poles":["product","supplier","data"]},{"id":"chef_projet_innovation","position":"product_engineering_manager","poles":["product"]},{"id":"ext_fournisseur","position":"supplier_manager","poles":["supplier"]},{"id":"ext_vendeur","position":"customer_success_manager","poles":["marketplace"]},{"id":"ext_client_entreprise","position":"customer_success_manager","poles":["marketplace","support"]},{"id":"ext_client_particulier","position":"customer_success_manager","poles":["marketplace","support"]},{"id":"ext_auditeur","position":"audit_compliance_lead","poles":["audit"]},{"id":"ext_prestataire","position":"ops_logistics_manager","poles":["ops"]},{"id":"ext_investisseur","position":"ceo","poles":["direction","finance","data"]},{"id":"svc_api","position":"product_engineering_manager","poles":["product","security"]},{"id":"svc_webhook","position":"product_engineering_manager","poles":["product","security"]},{"id":"svc_robot","position":"product_engineering_manager","poles":["product","ops"]},{"id":"svc_stripe","position":"finance_manager","poles":["finance","product","security"]},{"id":"svc_google","position":"product_engineering_manager","poles":["product","security","rh"]},{"id":"svc_supabase","position":"product_engineering_manager","poles":["product","data","security"]}]$roles$::jsonb) WITH ORDINALITY AS roles(item,ordinal)
  WHERE item->>'position'=p_position
    AND cardinality(coalesce(p_poles,'{}'::text[]))>0
    AND coalesce(p_poles,'{}'::text[])<@ARRAY(SELECT jsonb_array_elements_text(item->'poles'))
  ORDER BY ordinal
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.legacy_hr_publication_role(text,text[]) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.can_hr_publication_action(p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); saved_count integer; saved_allow boolean; level text;
  in_scope boolean; has_active boolean; only_read_only boolean; legacy_role text;
BEGIN
  IF actor IS NULL OR p_action NOT IN ('read','create','update','publish')
      OR NOT coalesce(public.is_intranet_staff(actor),false) THEN RETURN false; END IF;
  IF public.has_role(actor,'admin') THEN RETURN true; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor) THEN
    SELECT public.legacy_hr_publication_role(p.position::text,p.poles) INTO legacy_role FROM public.profiles p WHERE p.id=actor;
    IF legacy_role IS NOT NULL AND EXISTS(SELECT 1 FROM public.access_roles WHERE role_key=legacy_role)
      AND NOT EXISTS(SELECT 1 FROM public.access_roles WHERE role_key=legacy_role AND status='active') THEN RETURN false; END IF;
  END IF;
  SELECT count(*),coalesce(bool_or(ap.allowed AND ac.action_key=p_action),false)
    INTO saved_count,saved_allow
  FROM public.access_roles ar
  LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
    AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
  JOIN public.access_permissions ap ON ap.role_id=ar.id
  JOIN public.access_interfaces ai ON ai.id=ap.interface_id AND ai.interface_key='rh.publications' AND ai.status='active'
  JOIN public.access_actions ac ON ac.id=ap.action_id
  WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=legacy_role);
  -- A saved page grants only its explicitly allowed actions, including explicit denials.
  IF saved_count>0 THEN RETURN saved_allow; END IF;
  SELECT count(*)>0,coalesce(bool_and(ar.read_only),false) INTO has_active,only_read_only
  FROM public.access_roles ar
  LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
    AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
  WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=legacy_role);
  IF NOT has_active AND EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor) THEN RETURN false; END IF;
  SELECT coalesce(p.seniority::text,'junior'),coalesce('rh'=ANY(p.poles),false)
    INTO level,in_scope FROM public.profiles p WHERE p.id=actor;
  IF public.is_leadership(actor) THEN level:='executive'; in_scope:=true; END IF;
  IF NOT coalesce(in_scope,false) THEN RETURN false; END IF;
  IF p_action='read' THEN RETURN true; END IF;
  IF only_read_only THEN RETURN false; END IF;
  IF p_action IN ('create','update') THEN RETURN level IN ('mid','senior','lead','executive'); END IF;
  RETURN level IN ('lead','executive');
END;
$$;
CREATE OR REPLACE FUNCTION public.get_hr_publication_permissions()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT jsonb_build_object('read',public.can_hr_publication_action('read'),
    'create',public.can_hr_publication_action('create'),'update',public.can_hr_publication_action('update'),
    'publish',public.can_hr_publication_action('publish'));
$$;
--> statement-breakpoint
-- Existing general publication policies are permissive and do not protect draft statuses.
-- Restrictive policies add HR-specific rules while preserving other publication types.
CREATE OR REPLACE FUNCTION public.can_read_released_hr_publication(
  p_status text,p_publish_at timestamptz,p_available_at timestamptz,p_archive_at timestamptz,
  p_scope text,p_targets text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT coalesce(public.is_intranet_staff(auth.uid()),false)
    AND p_status='published' AND (p_publish_at IS NULL OR p_publish_at<=now())
    AND (p_available_at IS NULL OR p_available_at<=now()) AND (p_archive_at IS NULL OR p_archive_at>now())
    AND (
      p_scope='all'
      OR (p_scope='pole' AND coalesce(p_targets,'{}'::text[]) && coalesce((SELECT poles FROM public.profiles WHERE id=auth.uid()),'{}'::text[]))
      OR (p_scope='user' AND auth.uid()::text=ANY(coalesce(p_targets,'{}'::text[])))
      OR (p_scope='subsidiary' AND (SELECT subsidiary FROM public.profiles WHERE id=auth.uid())=ANY(coalesce(p_targets,'{}'::text[])))
      OR (p_scope='role' AND EXISTS (
        SELECT 1 FROM public.access_assignments aa JOIN public.access_roles ar ON ar.id=aa.role_id
        WHERE aa.employee_id=auth.uid() AND aa.status='active' AND ar.status='active'
          AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
          AND ar.role_key=ANY(coalesce(p_targets,'{}'::text[]))
      ))
    );
$$;
-- A restrictive policy cannot grant a legitimate recipient access by itself.
-- Add the matching permissive read path for user, role and subsidiary audiences.
DROP POLICY IF EXISTS "HR released audience read" ON public.publications;
CREATE POLICY "HR released audience read" ON public.publications FOR SELECT TO authenticated
USING(type='hr' AND public.can_read_released_hr_publication(
  status,publish_at,available_at,archive_at,visibility_scope,visibility_targets));
DROP POLICY IF EXISTS "HR publication release boundary" ON public.publications;
CREATE POLICY "HR publication release boundary" ON public.publications AS RESTRICTIVE FOR SELECT TO authenticated
USING(type<>'hr' OR public.can_hr_publication_action('read') OR
  public.can_read_released_hr_publication(status,publish_at,available_at,archive_at,visibility_scope,visibility_targets));
DROP POLICY IF EXISTS "HR publication insert via RPC" ON public.publications;
CREATE POLICY "HR publication insert via RPC" ON public.publications AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK(type<>'hr');
DROP POLICY IF EXISTS "HR publication update via RPC" ON public.publications;
CREATE POLICY "HR publication update via RPC" ON public.publications AS RESTRICTIVE FOR UPDATE TO authenticated
USING(type<>'hr') WITH CHECK(type<>'hr');
DROP POLICY IF EXISTS "HR publication delete boundary" ON public.publications;
CREATE POLICY "HR publication delete boundary" ON public.publications AS RESTRICTIVE FOR DELETE TO authenticated
USING(type<>'hr');
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.touch_hr_publication_timestamp()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  NEW.updated_at:=greatest(clock_timestamp(),OLD.updated_at+interval '1 microsecond');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS zz_hr_publication_timestamp ON public.publications;
CREATE TRIGGER zz_hr_publication_timestamp BEFORE UPDATE ON public.publications
FOR EACH ROW WHEN (OLD.type='hr' OR NEW.type='hr') EXECUTE FUNCTION public.touch_hr_publication_timestamp();
REVOKE ALL ON FUNCTION public.touch_hr_publication_timestamp() FROM PUBLIC,anon,authenticated;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.list_hr_publications()
RETURNS SETOF public.publications LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT public.can_hr_publication_action('read') THEN RAISE EXCEPTION 'hr_publication_forbidden' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT * FROM public.publications WHERE type='hr' ORDER BY updated_at DESC,id LIMIT 200;
END;
$$;
CREATE OR REPLACE FUNCTION public.save_hr_publication(
  p_id uuid,p_expected_updated_at timestamptz,p_title text,p_summary text,p_body text,
  p_subtype text,p_status text,p_visibility text,p_poles text[],p_creation_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE original public.publications%ROWTYPE; result_row public.publications%ROWTYPE;
  actor uuid:=auth.uid(); target_poles text[]; stamp timestamptz:=clock_timestamp(); needs_publish boolean;
  clean_title text:=btrim(coalesce(p_title,''),U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'); clean_body text:=nullif(btrim(coalesce(p_body,''),U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'),'');
  clean_summary text:=nullif(btrim(coalesce(p_summary,''),U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'),'');
BEGIN
  IF NOT public.can_hr_publication_action('read')
      OR NOT public.can_hr_publication_action(CASE WHEN p_id IS NULL THEN 'create' ELSE 'update' END) THEN
    RAISE EXCEPTION 'hr_publication_forbidden' USING ERRCODE='42501';
  END IF;
  IF char_length(clean_title) NOT BETWEEN 1 AND 255 OR char_length(clean_summary)>1000 OR char_length(clean_body)>20000
      OR p_subtype IS NULL OR p_subtype NOT IN ('announcement','information','planning','reminder','report')
      OR p_status IS NULL OR p_status NOT IN ('draft','published','archived')
      OR p_visibility IS NULL OR p_visibility NOT IN ('all','pole') THEN
    RAISE EXCEPTION 'invalid_hr_publication' USING ERRCODE='22023';
  END IF;
  IF p_status='published' AND clean_body IS NULL THEN RAISE EXCEPTION 'hr_publication_body_required' USING ERRCODE='22023'; END IF;
  IF p_poles IS NULL OR array_ndims(p_poles)>1 OR array_position(p_poles,NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'invalid_hr_publication_audience' USING ERRCODE='22023';
  END IF;
  SELECT coalesce(array_agg(DISTINCT value ORDER BY value),'{}'::text[]) INTO target_poles FROM unnest(p_poles) value;
  IF (p_visibility='all' AND cardinality(target_poles)>0) OR (p_visibility='pole' AND
      (cardinality(target_poles)=0 OR NOT target_poles<@ARRAY['direction','finance','ops','supplier','marketplace','support','marketing','rh','audit','compliance','rse','product','data','security']::text[])) THEN
    RAISE EXCEPTION 'invalid_hr_publication_audience' USING ERRCODE='22023';
  END IF;
  IF p_id IS NOT NULL THEN
    SELECT * INTO original FROM public.publications WHERE id=p_id FOR UPDATE;
    IF NOT FOUND OR original.type<>'hr' THEN RAISE EXCEPTION 'hr_publication_not_found' USING ERRCODE='P0002'; END IF;
    IF p_expected_updated_at IS NULL OR original.updated_at<>p_expected_updated_at THEN
      RAISE EXCEPTION 'hr_publication_changed' USING ERRCODE='40001';
    END IF;
  ELSIF p_expected_updated_at IS NOT NULL OR p_status='archived' OR p_creation_key IS NULL THEN
    RAISE EXCEPTION 'invalid_hr_publication' USING ERRCODE='22023';
  END IF;
  needs_publish:=p_status<>'draft' OR (p_id IS NOT NULL AND original.status<>'draft');
  IF needs_publish AND NOT public.can_hr_publication_action('publish') THEN
    RAISE EXCEPTION 'hr_publication_publish_forbidden' USING ERRCODE='42501';
  END IF;
  IF p_id IS NULL THEN
    -- A client keeps this key across retries after an uncertain response.
    PERFORM pg_advisory_xact_lock(hashtextextended(actor::text||':'||p_creation_key::text,0));
    SELECT * INTO result_row FROM public.publications
      WHERE type='hr' AND author_id=actor AND metadata->>'hr_creation_key'=p_creation_key::text FOR UPDATE;
    IF FOUND THEN
      IF result_row.title<>clean_title OR result_row.summary IS DISTINCT FROM clean_summary
          OR result_row.body IS DISTINCT FROM clean_body OR result_row.subtype<>p_subtype
          OR result_row.status<>p_status OR result_row.visibility_scope<>p_visibility
          OR result_row.visibility_targets<>target_poles THEN
        RAISE EXCEPTION 'hr_publication_creation_conflict' USING ERRCODE='40001';
      END IF;
      RETURN to_jsonb(result_row);
    END IF;
    INSERT INTO public.publications(title,summary,body,type,subtype,visibility_scope,visibility_targets,status,publish_at,
      available_at,author_id,author_pole,app_origin,metadata)
    VALUES(clean_title,clean_summary,clean_body,'hr',p_subtype,p_visibility,target_poles,p_status,
      CASE WHEN p_status='published' THEN stamp ELSE NULL END,
      CASE WHEN p_status='published' THEN stamp ELSE NULL END,actor,'rh','intranet',jsonb_build_object('hr_creation_key',p_creation_key))
    RETURNING * INTO result_row;
  ELSE
    UPDATE public.publications SET title=clean_title,summary=clean_summary,body=clean_body,subtype=p_subtype,
      visibility_scope=p_visibility,visibility_targets=target_poles,status=p_status,
      publish_at=CASE WHEN p_status='draft' THEN NULL WHEN p_status='published' THEN
        CASE WHEN original.status='published' AND original.publish_at<=stamp THEN original.publish_at ELSE stamp END ELSE original.publish_at END,
      available_at=CASE WHEN p_status='draft' THEN NULL WHEN p_status='published' THEN stamp ELSE original.available_at END,
      archive_at=CASE WHEN p_status='archived' THEN stamp ELSE NULL END,updated_at=stamp
    WHERE id=p_id RETURNING * INTO result_row;
  END IF;
  RETURN to_jsonb(result_row);
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.can_hr_publication_action(text),public.get_hr_publication_permissions(),
  public.can_read_released_hr_publication(text,timestamptz,timestamptz,timestamptz,text,text[]),
  public.list_hr_publications(),public.save_hr_publication(uuid,timestamptz,text,text,text,text,text,text,text[],uuid)
FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_hr_publication_action(text),public.get_hr_publication_permissions(),
  public.can_read_released_hr_publication(text,timestamptz,timestamptz,timestamptz,text,text[]),
  public.list_hr_publications(),public.save_hr_publication(uuid,timestamptz,text,text,text,text,text,text,text[],uuid)
TO authenticated;
