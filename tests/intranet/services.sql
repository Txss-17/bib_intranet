\set ON_ERROR_STOP on
\ir fixture.sql
CREATE TABLE public.cashflows(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),created_by uuid,amount numeric,status text DEFAULT 'pending',test_account boolean DEFAULT false);
ALTER TABLE public.cashflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY old_cashflows ON public.cashflows FOR ALL TO authenticated USING(true)WITH CHECK(true);
GRANT ALL ON public.cashflows TO authenticated;
CREATE TABLE public.corporate_card_transactions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,amount numeric,approval_status text DEFAULT 'pending',approved_by uuid,test_account boolean DEFAULT false);
ALTER TABLE public.corporate_card_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY old_cards ON public.corporate_card_transactions FOR ALL TO authenticated USING(true)WITH CHECK(true);
GRANT ALL ON public.corporate_card_transactions TO authenticated;
CREATE TABLE public.products(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),created_by uuid,owner_id uuid,title text);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY old_products ON public.products FOR ALL TO authenticated USING(owner_id=auth.uid())WITH CHECK(owner_id=auth.uid());
GRANT ALL ON public.products TO authenticated;
CREATE TABLE public.rh_employee_documents(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),employee_id uuid,document_url text,status text DEFAULT 'valid');
CREATE TABLE public.external_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender_email text,subject text,routed_to_pole public.pole_id,gmail_thread_id text,gmail_message_id_header text,gmail_references text,status text,response_content text,responded_by uuid,responded_at timestamptz,updated_at timestamptz);
CREATE TABLE public.test_queue(payload jsonb);
GRANT SELECT ON public.test_queue TO service_role;
GRANT ALL ON public.whistleblower_submissions TO service_role;
CREATE FUNCTION public.enqueue_email(queue_name text,payload jsonb)RETURNS void LANGUAGE sql AS $$ INSERT INTO public.test_queue VALUES(payload) $$;
\ir ../../drizzle/migrations/0042_intranet_business_boundaries.sql
\ir ../../drizzle/migrations/0043_intranet_gateway_outbox.sql
\ir ../../drizzle/migrations/0046_intranet_gateway_replies.sql
INSERT INTO public.profiles(id,position,poles,seniority,email)VALUES
 ('10000000-0000-4000-8000-000000000001','ceo','{direction,finance,ops,supplier,marketplace,support,marketing,rh,audit,compliance,rse,product,data,security}','executive','author@bib.test'),
 ('10000000-0000-4000-8000-000000000002','ceo','{direction,finance,ops,supplier,marketplace,support,marketing,rh,audit,compliance,rse,product,data,security}','executive','reviewer@bib.test'),
 ('10000000-0000-4000-8000-000000000003','audit_compliance_lead','{audit,compliance,supplier}','senior','auditor@bib.test'),
 ('10000000-0000-4000-8000-000000000004','ops_logistics_manager','{ops}','junior','junior@bib.test');
INSERT INTO public.profiles(id,position,poles,seniority,email,app_origin)VALUES('10000000-0000-4000-8000-000000000005',NULL,'{}',NULL,'customer@bib.test','platform');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE j jsonb;r jsonb;BEGIN
 j:=public.reserve_intranet_document_job('20000000-0000-4000-8000-000000000001','finance.transactions','export',repeat('a',64),'{"name":"Ledger"}');
 PERFORM set_config('test.job',j::text,true);
 BEGIN PERFORM public.reserve_intranet_document_job('20000000-0000-4000-8000-000000000001','finance.transactions','export',repeat('a',64),'{"name":"Ledger"}');RAISE EXCEPTION 'running lease accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.set_intranet_document_job_ids((j->>'id')::uuid,(j->>'lease_token')::uuid,'fakefileid00001');RAISE EXCEPTION 'client wrote provider IDs';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 INSERT INTO public.cashflows(created_by,amount)VALUES('10000000-0000-4000-8000-000000000002',25);
 IF(SELECT created_by FROM public.cashflows LIMIT 1)<>auth.uid()THEN RAISE EXCEPTION 'actor forged';END IF;
 IF jsonb_array_length(public.list_intranet_business_history('finance.transactions'))<>1 THEN RAISE EXCEPTION 'business journal missing';END IF;
 INSERT INTO public.corporate_card_transactions(user_id,amount)VALUES('10000000-0000-4000-8000-000000000002',125);
 BEGIN UPDATE public.corporate_card_transactions SET approval_status='approved';RAISE EXCEPTION 'financial self approval';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 r:=public.submit_intranet_outbox('20000000-0000-4000-8000-000000000010',NULL,ARRAY['external@example.test'],'Review','Approved content');PERFORM set_config('test.outbox',r->>'id',true);
 IF public.submit_intranet_outbox('20000000-0000-4000-8000-000000000010',NULL,ARRAY['external@example.test'],'Review','Approved content')->>'id'<>r->>'id'THEN RAISE EXCEPTION 'outbox duplicated';END IF;
 BEGIN PERFORM public.submit_intranet_outbox('20000000-0000-4000-8000-000000000010',NULL,ARRAY['other@example.test'],'Review','Approved content');RAISE EXCEPTION 'changed outbox retry accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.decide_intranet_outbox((r->>'id')::uuid,true);RAISE EXCEPTION 'outbox self approval';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.get_intranet_outbox_for_dispatch((r->>'id')::uuid);RAISE EXCEPTION 'pending outbox dispatch';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SET LOCAL ROLE service_role;
DO $$DECLARE j jsonb:=current_setting('test.job')::jsonb;r jsonb;BEGIN
 PERFORM public.set_intranet_document_job_ids((j->>'id')::uuid,(j->>'lease_token')::uuid,'fakefileid00001');
 r:=public.finish_intranet_document_job((j->>'id')::uuid,(j->>'lease_token')::uuid,'Ledger.pdf','application/pdf',100,'confidential');PERFORM set_config('test.document',r->>'id',true);
 BEGIN PERFORM public.finish_intranet_document_job((j->>'id')::uuid,(j->>'lease_token')::uuid,'Ledger.pdf','application/pdf',100,'confidential');RAISE EXCEPTION 'completion replay accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 r:=public.store_intranet_ethics_report('20000000-0000-4000-8000-000000000020',repeat('b',64),'fraud','high','encrypted-envelope-ciphertext','anonymous',false);PERFORM set_config('test.ethics',(SELECT id::text FROM public.whistleblower_submissions WHERE submission_code=r->>'reference'),true);
 IF EXISTS(SELECT 1 FROM public.intranet_ethics_events WHERE actor_id IS NOT NULL)THEN RAISE EXCEPTION 'anonymous intake retained actor';END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
DO $$DECLARE request uuid;BEGIN
 IF public.reserve_intranet_document_job('20000000-0000-4000-8000-000000000001','finance.transactions','export',repeat('a',64),'{"name":"Ledger"}')->>'status'<>'done'THEN RAISE EXCEPTION 'finished document retry lost';END IF;
 BEGIN PERFORM public.reserve_intranet_document_job('20000000-0000-4000-8000-000000000001','finance.transactions','export',repeat('c',64),'{"name":"Ledger"}');RAISE EXCEPTION 'changed bytes reused key';EXCEPTION WHEN serialization_failure THEN NULL;END;
 request:=public.request_intranet_external_share(current_setting('test.document')::uuid,'recipient@example.test','Approved disclosure');PERFORM set_config('test.share',request::text,true);
 BEGIN PERFORM public.decide_intranet_external_share(request,true);RAISE EXCEPTION 'self approved external share';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
SELECT public.decide_intranet_external_share(current_setting('test.share')::uuid,true);
SELECT public.decide_intranet_outbox(current_setting('test.outbox')::uuid,true);
UPDATE public.corporate_card_transactions SET approval_status='approved',approved_by='10000000-0000-4000-8000-000000000001';
DO $$BEGIN
 IF(SELECT approved_by FROM public.corporate_card_transactions LIMIT 1)<>auth.uid()THEN RAISE EXCEPTION 'financial reviewer forged';END IF;
 BEGIN UPDATE public.corporate_card_transactions SET amount=1;RAISE EXCEPTION 'approved amount changed';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 BEGIN UPDATE public.corporate_card_transactions SET approval_status='pending';RAISE EXCEPTION 'approved transaction unlocked';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 BEGIN DELETE FROM public.corporate_card_transactions;RAISE EXCEPTION 'approved transaction deleted';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 BEGIN UPDATE public.intranet_business_history SET action='forged';RAISE EXCEPTION 'business history modified';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;

DO $$BEGIN BEGIN PERFORM public.get_approved_intranet_share(current_setting('test.share')::uuid);RAISE EXCEPTION 'reviewer released another actor share';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$BEGIN
 IF NOT public.can_review_intranet_ethics('update') THEN RAISE EXCEPTION 'referent denied';END IF;
 IF public.read_intranet_ethics(current_setting('test.ethics')::uuid)->>'ciphertext'<>'encrypted-envelope-ciphertext' THEN RAISE EXCEPTION 'encrypted case missing';END IF;
 BEGIN PERFORM public.update_intranet_ethics(current_setting('test.ethics')::uuid,1,'closed',NULL,'Reason');RAISE EXCEPTION 'case closed before investigation';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM public.update_intranet_ethics(current_setting('test.ethics')::uuid,1,'under_review',auth.uid(),'Assigned');
 BEGIN PERFORM public.update_intranet_ethics(current_setting('test.ethics')::uuid,1,'investigating',auth.uid(),'Stale');RAISE EXCEPTION 'stale case accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 PERFORM public.update_intranet_ethics(current_setting('test.ethics')::uuid,2,'investigating',auth.uid(),'Investigation');
 PERFORM public.update_intranet_ethics(current_setting('test.ethics')::uuid,3,'resolved',auth.uid(),'Resolution evidence');
 PERFORM public.update_intranet_ethics(current_setting('test.ethics')::uuid,4,'closed',auth.uid(),'Closure reviewed');
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.whistleblower_submissions)THEN RAISE EXCEPTION 'nonreferent read ethics';END IF;
 IF jsonb_array_length(public.list_intranet_documents())<>0 OR EXISTS(SELECT 1 FROM public.cashflows)OR jsonb_array_length(public.list_intranet_outbox())<>0 THEN RAISE EXCEPTION 'cross-pole data leaked';END IF;
 BEGIN PERFORM public.get_intranet_document_access(current_setting('test.document')::uuid);RAISE EXCEPTION 'confidential document leaked';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
INSERT INTO public.rh_employee_documents(employee_id,document_url)VALUES('10000000-0000-4000-8000-000000000004','https://intranet.bib.test/documents?document='||current_setting('test.document'));
SET LOCAL ROLE authenticated;
DO $$BEGIN IF public.get_intranet_document_access(current_setting('test.document')::uuid)->>'id'<>current_setting('test.document')THEN RAISE EXCEPTION 'employee own HR document inaccessible';END IF;END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
INSERT INTO public.products(owner_id,title)VALUES(auth.uid(),'Platform product');
DO $$BEGIN IF(SELECT count(*)FROM public.products)<>1 THEN RAISE EXCEPTION 'shared platform policies broken';END IF;IF public.can_intranet_action('finance.transactions','read')THEN RAISE EXCEPTION 'platform accessed intranet';END IF;END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SET LOCAL ROLE service_role;
DO $$DECLARE payload jsonb;BEGIN
 PERFORM public.finish_intranet_external_share(current_setting('test.share')::uuid,'releasedfile0001');
 PERFORM public.finish_intranet_external_share(current_setting('test.share')::uuid,'releasedfile0001');
 BEGIN PERFORM public.finish_intranet_external_share(current_setting('test.share')::uuid,'differentfile001');RAISE EXCEPTION 'release file changed';EXCEPTION WHEN serialization_failure THEN NULL;END;
 payload:=jsonb_build_object('to','external@example.test','message_id','queue-message-1','intranet_outbox_id',current_setting('test.outbox'),'rfc_message_id','<fixed@bib.test>','text','Approved content');
 PERFORM public.enqueue_intranet_email('stable-dispatch',payload);PERFORM public.enqueue_intranet_email('stable-dispatch',payload||'{"message_id":"retry-random-id"}');
 IF(SELECT count(*)FROM public.test_queue)<>1 THEN RAISE EXCEPTION 'duplicate email queue item';END IF;
 PERFORM public.mark_intranet_outbox_queued(current_setting('test.outbox')::uuid);
 IF public.claim_intranet_delivery('stable-dispatch','queue-message-1')<>'claimed'THEN RAISE EXCEPTION 'initial send claim failed';END IF;
 IF public.claim_intranet_delivery('stable-dispatch','queue-message-1')<>'unknown'OR public.claim_intranet_delivery('stable-dispatch','queue-message-1')<>'unknown'THEN RAISE EXCEPTION 'uncertain delivery resent';END IF;
 PERFORM public.mark_intranet_delivery_sent('stable-dispatch','queue-message-1','gmail-confirmation');
 IF public.claim_intranet_delivery('stable-dispatch','queue-message-1')<>'sent'THEN RAISE EXCEPTION 'confirmed delivery resent';END IF;
 IF(SELECT status FROM public.intranet_outbox WHERE id=current_setting('test.outbox')::uuid)<>'sent'THEN RAISE EXCEPTION 'receipt did not settle outbox';END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DELETE FROM public.cashflows;
RESET ROLE;
INSERT INTO public.user_roles(user_id,role)VALUES('10000000-0000-4000-8000-000000000001','admin');
SET LOCAL ROLE authenticated;
DO $$BEGIN IF NOT EXISTS(SELECT 1 FROM public.intranet_business_history WHERE table_name='cashflows'AND action='delete')THEN RAISE EXCEPTION 'administrator lost deleted-row audit';END IF;END $$;
ROLLBACK;
