\set ON_ERROR_STOP on
\ir ../ops/fixture.sql
\ir ../../drizzle/migrations/0050_ops_anomaly_workflow.sql
\ir ../../drizzle/migrations/0051_compliance_dispute_workflow.sql
ALTER TABLE public.access_roles ADD COLUMN poles text[] NOT NULL DEFAULT '{}',ADD COLUMN is_external boolean NOT NULL DEFAULT false;
CREATE TABLE public.original_positions(n integer,position text,pole text,page text);
GRANT SELECT ON public.original_positions TO authenticated;
INSERT INTO original_positions VALUES
 (1,'ceo','direction','direction.overview'),(2,'supplier_manager','supplier','supplier.overview'),
 (3,'customer_success_manager','support','support.overview'),(4,'ops_logistics_manager','ops','ops.overview'),
 (5,'finance_manager','finance','finance.transactions'),(6,'audit_compliance_lead','audit','audit.overview'),
 (7,'rse_impact_manager','rse','rse.packaging'),(8,'product_engineering_manager','product','product.overview'),
 (9,'marketing_communication_manager','marketing','marketing.overview'),(10,'rh_manager','rh','rh.overview'),
 (11,'data_bi_manager','data','data.overview'),(12,'security_it_manager','security','security.overview');
INSERT INTO public.profiles(id,position,poles,seniority,app_origin)
SELECT ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,position,ARRAY[pole::public.pole_id],'mid','bos'FROM original_positions;
INSERT INTO public.access_roles(id,role_key,poles,read_only,is_external,status)VALUES
 ('30000000-0000-4000-8000-000000000001','custom_support','{support}',false,false,'active'),
 ('30000000-0000-4000-8000-000000000002','gestionnaire_facturation','{finance}',false,false,'active'),
 ('30000000-0000-4000-8000-000000000003','ext_vendor','{marketplace}',false,true,'active'),
 ('30000000-0000-4000-8000-000000000004','disabled_finance','{finance}',false,false,'inactive'),
 ('30000000-0000-4000-8000-000000000005','readonly_support','{support}',true,false,'active');
INSERT INTO public.profiles(id,position,position_key,poles,seniority,app_origin,hr_status,test_account)VALUES
 ('10000000-0000-4000-8000-000000000101',NULL,NULL,'{}','executive','bos','active',false),
 ('10000000-0000-4000-8000-000000000102','custom_position',NULL,'{}','mid','bos','active',false),
 ('10000000-0000-4000-8000-000000000103','finance_manager','gestionnaire_facturation','{finance}','mid','connect','active',false),
 ('10000000-0000-4000-8000-000000000104','finance_manager',NULL,'{finance}','mid','bos','active',false),
 ('10000000-0000-4000-8000-000000000105','finance_manager',NULL,'{finance}','mid','bos','suspended',false),
 ('10000000-0000-4000-8000-000000000106',NULL,NULL,'{}',NULL,'bos','active',false),
 ('10000000-0000-4000-8000-000000000107','finance_manager',NULL,'{finance}','mid','platform','active',false),
 ('10000000-0000-4000-8000-000000000108',NULL,NULL,'{}',NULL,'bos','active',false),
 ('10000000-0000-4000-8000-000000000109','finance_manager','disabled_finance','{finance}','mid','connect','active',false),
 ('10000000-0000-4000-8000-000000000110',NULL,NULL,'{}','mid','connect','active',false),
 ('10000000-0000-4000-8000-000000000111','rse_impact_manager',NULL,'{rse}','mid','bos','active',true),
 ('10000000-0000-4000-8000-000000000112',NULL,NULL,'{finance}','mid','connect','active',false),
 ('10000000-0000-4000-8000-000000000113',NULL,NULL,'{}','mid','connect','active',false),
 ('10000000-0000-4000-8000-000000000114','finance_manager',NULL,'{finance}','mid','bos','active',false),
 ('10000000-0000-4000-8000-000000000115','finance_manager',NULL,'{finance}','mid','connect','active',false);
INSERT INTO public.profiles(id,position,poles,seniority,app_origin,hr_status)VALUES
 ('10000000-0000-4000-8000-000000000116','finance_manager','{finance}','mid','connect',NULL),
 ('10000000-0000-4000-8000-000000000117','product_engineering_manager','{tech}','mid','bos','active'),
 ('10000000-0000-4000-8000-000000000118','customer_success_manager','{lifecycle}','mid','bos','active'),
 ('10000000-0000-4000-8000-000000000119','security_it_manager','{risk}','mid','bos','active'),
 ('10000000-0000-4000-8000-000000000120','customer_success_manager','{marketplace}','mid','bos','active'),
 ('10000000-0000-4000-8000-000000000121','audit_compliance_lead','{compliance}','mid','bos','active');
INSERT INTO public.user_roles VALUES('10000000-0000-4000-8000-000000000101','admin');
INSERT INTO public.access_assignments(employee_id,role_id,status,starts_at,ends_at)VALUES
 ('10000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000001','active',NULL,NULL),
 ('10000000-0000-4000-8000-000000000104','30000000-0000-4000-8000-000000000002','active',NULL,now()-interval '1 day'),
 ('10000000-0000-4000-8000-000000000108','30000000-0000-4000-8000-000000000003','active',NULL,NULL),
 ('10000000-0000-4000-8000-000000000110','30000000-0000-4000-8000-000000000005','active',NULL,NULL),
 ('10000000-0000-4000-8000-000000000113','30000000-0000-4000-8000-000000000001','active',now()+interval '1 day',NULL),
 ('10000000-0000-4000-8000-000000000114','30000000-0000-4000-8000-000000000002','revoked',NULL,NULL),
 ('10000000-0000-4000-8000-000000000115','30000000-0000-4000-8000-000000000002','pending',NULL,NULL);
INSERT INTO public.access_actions(id,action_key)VALUES('40000000-0000-4000-8000-000000000001','read'),('40000000-0000-4000-8000-000000000002','create');
INSERT INTO public.access_interfaces(id,interface_key)VALUES('50000000-0000-4000-8000-000000000001','finance.billing');
INSERT INTO public.access_permissions VALUES
 ('30000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',true),
 ('30000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002',false);
-- Reproduce the regressions before applying the repair.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
DO $$BEGIN IF public.can_intranet_action('app.dashboard','read')THEN RAISE EXCEPTION 'legacy-origin regression not reproduced';END IF;END $$;
SELECT set_config('request.jwt.claim.sub','',true);
UPDATE public.profiles SET app_origin='connect'WHERE id='10000000-0000-4000-8000-000000000007';
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
DO $$BEGIN IF public.can_intranet_action('rse.packaging','create')THEN RAISE EXCEPTION 'RSE role omission not reproduced';END IF;END $$;
SELECT set_config('request.jwt.claim.sub','',true);
UPDATE public.profiles SET app_origin='bos'WHERE id='10000000-0000-4000-8000-000000000007';
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000102',true);
DO $$BEGIN IF public.is_intranet_staff(auth.uid())THEN RAISE EXCEPTION 'assigned-only regression not reproduced';END IF;END $$;
SELECT set_config('request.jwt.claim.sub','',true);
-- Supabase migration owners can bypass RLS without being superusers. The
-- protected profile repair must also work in that configuration.
CREATE ROLE access_migration_owner NOLOGIN BYPASSRLS;
GRANT USAGE,CREATE ON SCHEMA public TO access_migration_owner;
GRANT USAGE ON SCHEMA auth TO access_migration_owner;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO access_migration_owner;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO access_migration_owner;
ALTER TABLE public.profiles OWNER TO access_migration_owner;
ALTER TABLE public.intranet_modules OWNER TO access_migration_owner;
ALTER FUNCTION public.is_intranet_staff(uuid)OWNER TO access_migration_owner;
ALTER FUNCTION public.can_intranet_action(text,text)OWNER TO access_migration_owner;
SET SESSION AUTHORIZATION access_migration_owner;
\ir ../../drizzle/migrations/0052_restore_existing_account_access.sql
SET SESSION AUTHORIZATION postgres;
RESET ROLE;
-- Migrations run as the database owner. No live Auth identity is read or changed.
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.profiles'::regclass AND tgname='guard_profile_authorization_fields'AND tgenabled='O')THEN RAISE EXCEPTION 'profile guard not restored after repair';END IF;
 IF(SELECT count(*)FROM public.intranet_legacy_access_repairs)<>24 THEN RAISE EXCEPTION 'repair scope incorrect: %',(SELECT count(*)FROM public.intranet_legacy_access_repairs);END IF;
 IF EXISTS(SELECT 1 FROM public.intranet_legacy_access_repairs WHERE before_state->>'app_origin'NOT IN('bos','connect')OR after_state->>'app_origin'<>'connect')THEN RAISE EXCEPTION 'repair trace missing';END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE id IN('10000000-0000-4000-8000-000000000105','10000000-0000-4000-8000-000000000106','10000000-0000-4000-8000-000000000108')AND app_origin<>'bos')THEN RAISE EXCEPTION 'suspended or foreign profiles converted';END IF;
 IF(SELECT hr_status FROM public.profiles WHERE id='10000000-0000-4000-8000-000000000105')<>'suspended'THEN RAISE EXCEPTION 'suspension removed';END IF;
 IF(SELECT count(*)FROM public.access_assignments)<>7 OR(SELECT count(*)FROM public.access_permissions)<>2 THEN RAISE EXCEPTION 'existing ACLs changed';END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
DO $$DECLARE p record;rights jsonb;BEGIN
 FOR p IN SELECT * FROM original_positions LOOP
  PERFORM set_config('request.jwt.claim.sub',('10000000-0000-4000-8000-'||lpad(p.n::text,12,'0')),true);
  IF NOT public.is_intranet_staff(auth.uid())OR NOT public.can_intranet_action('app.dashboard','read')
   OR NOT public.can_intranet_action(p.page,'read')OR NOT public.can_intranet_action(p.page,'create')THEN RAISE EXCEPTION 'original position not operational: %',p.position;END IF;
  IF public.can_intranet_action('admin.roles','administer')THEN RAISE EXCEPTION 'staff became administrator';END IF;
  rights:=public.get_intranet_permissions();
  IF (SELECT count(*)FROM jsonb_object_keys(rights))<>177 OR NOT(rights->p.page->>'read')::boolean THEN RAISE EXCEPTION 'navigation disagrees with server: %',p.position;END IF;
 END LOOP;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
DO $$DECLARE r jsonb;BEGIN
 r:=public.save_intranet_record(NULL,'rse.packaging',NULL,gen_random_uuid(),'Existing RSE staff can work','{"period":"2026-10","category":"Paper","quantity":12,"unit":"kg","method":"Weighed","source":"Synthetic receipt"}',NULL,NULL,'medium','pole');
 IF(r->>'test_account')::boolean IS DISTINCT FROM false THEN RAISE EXCEPTION 'real RSE dossier misclassified';END IF;
 IF public.can_intranet_action('finance.transactions','read')THEN RAISE EXCEPTION 'RSE gained finance access';END IF;
 BEGIN PERFORM count(*)FROM public.intranet_legacy_access_repairs;RAISE EXCEPTION 'repair log readable by staff';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000101',true);
DO $$BEGIN IF NOT public.can_intranet_action('admin.roles','administer')THEN RAISE EXCEPTION 'old administrator still locked out';END IF;END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000102',true);
DO $$BEGIN
 IF NOT public.has_pole(auth.uid(),'support')THEN RAISE EXCEPTION 'native pole policies still deny assigned staff';END IF;
 IF NOT public.can_intranet_action('support.overview','create')OR NOT public.can_intranet_action('app.dashboard','read')THEN RAISE EXCEPTION 'assigned role without profile poles still unusable';END IF;
 IF public.can_intranet_action('finance.transactions','read')THEN RAISE EXCEPTION 'assigned role escaped its poles';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000103',true);
DO $$BEGIN
 IF NOT public.can_intranet_action('finance.billing','read')OR public.can_intranet_action('finance.billing','create')THEN RAISE EXCEPTION 'precise saved role overridden by broad enum';END IF;
END $$;
DO $$DECLARE n integer;BEGIN
 FOREACH n IN ARRAY ARRAY[104,105,106,107,108,109,112,113,114,115]LOOP
  PERFORM set_config('request.jwt.claim.sub',('10000000-0000-4000-8000-'||lpad(n::text,12,'0')),true);
  IF public.can_intranet_action('app.dashboard','read')OR public.can_intranet_action('finance.transactions','read')THEN RAISE EXCEPTION 'revoked/foreign/unrecognized account gained access: %',n;END IF;
 END LOOP;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000110',true);
DO $$BEGIN IF NOT public.can_intranet_action('support.overview','read')OR public.can_intranet_action('support.overview','create')THEN RAISE EXCEPTION 'read-only contract changed';END IF;END $$;
DO $$DECLARE n integer;p text;BEGIN
 FOR n,p IN SELECT * FROM(VALUES(116,'finance.transactions'),(117,'product.overview'),(118,'support.overview'),(119,'security.overview'),(120,'marketplace.overview'),(121,'compliance.overview'))x(n,p)LOOP
  PERFORM set_config('request.jwt.claim.sub',('10000000-0000-4000-8000-'||lpad(n::text,12,'0')),true);
  IF NOT public.can_intranet_action(p,'create')THEN RAISE EXCEPTION 'legacy scope/status compatibility broken: %',n;END IF;
 END LOOP;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000111',true);
DO $$DECLARE r jsonb;BEGIN
 IF EXISTS(SELECT 1 FROM public.intranet_records)THEN RAISE EXCEPTION 'real dossiers leaked to repaired test account';END IF;
 r:=public.save_intranet_record(NULL,'rse.packaging',NULL,gen_random_uuid(),'Test RSE','{"period":"2026-10","category":"Paper","quantity":2,"unit":"kg","method":"Weighed","source":"Test receipt"}',NULL,NULL,'medium','pole');
 IF(r->>'test_account')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'test account became real';END IF;
 BEGIN UPDATE public.profiles SET app_origin='connect',test_account=false WHERE id=auth.uid();RAISE EXCEPTION 'repaired test account escaped sandbox';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claim.role','',true);
INSERT INTO public.access_roles(id,role_key,poles)VALUES('30000000-0000-4000-8000-000000000006','directeur_marketplace','{marketplace}');
INSERT INTO public.access_interfaces(id,interface_key)VALUES('50000000-0000-4000-8000-000000000002','marketplace.overview');
INSERT INTO public.access_permissions VALUES('30000000-0000-4000-8000-000000000006','50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001',false);
UPDATE public.access_permissions SET allowed=false WHERE action_id='40000000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000103',true);
DO $$BEGIN IF public.can_intranet_action('finance.billing','read')THEN RAISE EXCEPTION 'new saved denial bypassed';END IF;END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000120',true);
DO $$BEGIN IF public.can_intranet_action('marketplace.overview','read')THEN RAISE EXCEPTION 'Marketplace director default bypassed saved denial';END IF;END $$;
ROLLBACK;
