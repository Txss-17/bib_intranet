CREATE TABLE public.intranet_business_tables(table_name text PRIMARY KEY,page_ids text[] NOT NULL,shared_platform boolean NOT NULL DEFAULT false);
ALTER TABLE public.intranet_business_tables ENABLE ROW LEVEL SECURITY;
INSERT INTO public.intranet_business_tables(table_name,page_ids,shared_platform)SELECT x->>'table',ARRAY(SELECT jsonb_array_elements_text(x->'pages')),(x->>'shared')::boolean FROM jsonb_array_elements($tables$[{"table":"cashflows","pages":["finance.transactions","finance.cashflow","finance.overview"],"shared":false},{"table":"salaries","pages":["finance.salaries"],"shared":false},{"table":"supplier_payments","pages":["finance.payouts"],"shared":false},{"table":"corporate_cards","pages":["finance.cards"],"shared":false},{"table":"card_transactions","pages":["finance.cards"],"shared":false},{"table":"guarantee_fund","pages":["finance.guarantee"],"shared":false},{"table":"fundraising_rounds","pages":["direction.strategy","finance.overview"],"shared":false},{"table":"financial_reconciliations","pages":["finance.reconciliation"],"shared":false},{"table":"finance_reconciliations","pages":["finance.reconciliation"],"shared":false},{"table":"direction_roadmap_items","pages":["direction.roadmap"],"shared":false},{"table":"direction_roadmap_history","pages":["direction.roadmap"],"shared":false},{"table":"direction_governance_blocks","pages":["direction.governance"],"shared":false},{"table":"governance_documents","pages":["direction.governance"],"shared":false},{"table":"direction_decisions","pages":["direction.arbitrage"],"shared":false},{"table":"direction_decision_events","pages":["direction.arbitrage"],"shared":false},{"table":"board_reports","pages":["direction.reports"],"shared":false},{"table":"strategic_kpis","pages":["direction.strategy"],"shared":false},{"table":"shipments","pages":["ops.shipments"],"shared":false},{"table":"product_catalog","pages":["ops.catalog","supplier.catalog-inbox","marketplace.products","product.performance"],"shared":true},{"table":"partner_stocks","pages":["ops.stocks","ops.thresholds","ops.forecast"],"shared":false},{"table":"logistics_incidents","pages":["ops.incidents"],"shared":false},{"table":"logistics_partners","pages":["ops.partners"],"shared":false},{"table":"partner_sync_events","pages":["ops.flows"],"shared":false},{"table":"replenishment_suggestions","pages":["ops.replenishment"],"shared":false},{"table":"stock_movements","pages":["ops.stocks"],"shared":false},{"table":"order_lifecycle_events","pages":["ops.orders"],"shared":false},{"table":"anomalies","pages":["ops.anomalies"],"shared":false},{"table":"anomaly_events","pages":["ops.anomalies"],"shared":false},{"table":"anomaly_notifications","pages":["ops.anomalies"],"shared":false},{"table":"suppliers","pages":["supplier.suppliers","supplier.portfolios","supplier.overview","product.supplier-performance"],"shared":true},{"table":"products","pages":["supplier.pending-products","supplier.validated-products","marketplace.products","product.performance"],"shared":true},{"table":"supplier_applications","pages":["supplier.applications"],"shared":true},{"table":"supplier_portfolio_assignments","pages":["supplier.portfolios"],"shared":false},{"table":"supplier_portfolios","pages":["supplier.portfolios"],"shared":false},{"table":"supplier_catalog_imports","pages":["supplier.catalog-inbox"],"shared":false},{"table":"supplier_certifications","pages":["supplier.certifications"],"shared":false},{"table":"certifications","pages":["supplier.certifications"],"shared":false},{"table":"quality_alerts","pages":["supplier.alerts","audit.overview"],"shared":false},{"table":"supplier_decisions","pages":["supplier.decisions"],"shared":false},{"table":"user_accounts","pages":["marketplace.merchants","marketplace.portfolio","finance.subscriptions"],"shared":true},{"table":"shops","pages":["marketplace.stores","marketplace.portfolio","ops.shops","finance.subscriptions"],"shared":true},{"table":"orders","pages":["ops.orders","marketplace.orders"],"shared":true},{"table":"shop_activity_documents","pages":["marketplace.stores"],"shared":false},{"table":"merchant_communications","pages":["marketplace.portfolio"],"shared":false},{"table":"merchant_communication_templates","pages":["marketplace.portfolio"],"shared":false},{"table":"merchant_portfolios","pages":["marketplace.portfolio"],"shared":false},{"table":"merchant_portfolio_assignments","pages":["marketplace.portfolio"],"shared":false},{"table":"customer_favorites","pages":["marketplace.favorites"],"shared":true},{"table":"hr_recruitment_needs","pages":["rh.recruitment"],"shared":false},{"table":"hr_candidates","pages":["rh.recruitment"],"shared":false},{"table":"hr_attendance","pages":["rh.attendance"],"shared":false},{"table":"hr_leave_requests","pages":["rh.leave"],"shared":false},{"table":"hr_trainings","pages":["rh.training"],"shared":false},{"table":"hr_training_enrollments","pages":["rh.training"],"shared":false},{"table":"hr_business_trips","pages":["rh.trips"],"shared":false},{"table":"business_trips","pages":["rh.trips"],"shared":false},{"table":"hr_alerts","pages":["rh.alerts"],"shared":false},{"table":"employees","pages":["rh.employees"],"shared":false},{"table":"rh_position_catalog","pages":["rh.onboarding"],"shared":false},{"table":"hr_positions","pages":["rh.organization"],"shared":false},{"table":"field_audits","pages":["audit.missions","audit.field"],"shared":false},{"table":"non_conformities","pages":["audit.nonconformities"],"shared":false},{"table":"audit_reports","pages":["audit.reports"],"shared":false},{"table":"audit_incidents","pages":["independentAudit.incident","independentAudit.resolution"],"shared":false},{"table":"audit_mission_events","pages":["audit.missions"],"shared":false},{"table":"contracts","pages":["compliance.contracts"],"shared":false},{"table":"contract_documents","pages":["compliance.contracts"],"shared":false},{"table":"disputes","pages":["compliance.disputes"],"shared":false},{"table":"policies","pages":["compliance.policies"],"shared":false},{"table":"risk_register","pages":["compliance.risks"],"shared":false},{"table":"campaigns","pages":["marketing.campaigns"],"shared":false},{"table":"media_attachments","pages":["marketing.campaigns","product.documentation"],"shared":false},{"table":"support_tickets","pages":["support.tickets","support.escalations"],"shared":true},{"table":"support_escalations","pages":["support.escalations"],"shared":false},{"table":"lifecycle_email_campaigns","pages":["marketing.crm"],"shared":false},{"table":"trustpilot_reviews","pages":["marketing.reputation"],"shared":false},{"table":"user_lifecycle_events","pages":["support.onboarding","support.monitoring"],"shared":false},{"table":"product_requests","pages":["product.backlog","product.frictions","product.studio"],"shared":false},{"table":"product_request_comments","pages":["product.backlog","product.frictions"],"shared":false},{"table":"product_request_events","pages":["product.backlog","product.frictions"],"shared":false},{"table":"bugs","pages":["product.frictions"],"shared":false},{"table":"kpi_versions","pages":["data.versions"],"shared":false},{"table":"tech_backlog","pages":["data.backlog"],"shared":false},{"table":"bi_dashboards","pages":["data.bi-dashboards"],"shared":false},{"table":"bi_widgets","pages":["data.bi-dashboards"],"shared":false},{"table":"bi_dashboard_widgets","pages":["data.bi-dashboards"],"shared":false},{"table":"bi_data_sources","pages":["data.bi-sources"],"shared":false},{"table":"bi_templates","pages":["data.bi-templates"],"shared":false},{"table":"security_alerts","pages":["security.supervision"],"shared":false},{"table":"vpn_access","pages":["security.vpn"],"shared":false},{"table":"auth_logs","pages":["security.logs"],"shared":false},{"table":"edge_function_logs","pages":["security.logs","security.supervision","product.performance"],"shared":false},{"table":"work_projects","pages":["work.projects"],"shared":false},{"table":"work_processes","pages":["work.processes"],"shared":false},{"table":"work_validations","pages":["work.validations"],"shared":false},{"table":"work_escalations","pages":["work.escalations"],"shared":false},{"table":"corporate_card_transactions","pages":["finance.cards"],"shared":false},{"table":"direction_board_reports","pages":["direction.reports"],"shared":false},{"table":"direction_decision_history","pages":["direction.arbitrage"],"shared":false},{"table":"governance_blocks","pages":["direction.governance"],"shared":false},{"table":"reconciliation_items","pages":["finance.reconciliation"],"shared":false},{"table":"demand_forecasts","pages":["ops.forecast"],"shared":false},{"table":"supplier_lead_times","pages":["ops.forecast"],"shared":false},{"table":"shop_status_events","pages":["ops.shops"],"shared":false},{"table":"supplier_catalog_uploads","pages":["supplier.catalog-inbox"],"shared":false},{"table":"supplier_restock_orders","pages":["supplier.restock"],"shared":false},{"table":"supplier_application_events","pages":["supplier.applications"],"shared":false},{"table":"supplier_portal_notifications","pages":["supplier.catalog-inbox","supplier.restock"],"shared":false},{"table":"portfolio_assignments","pages":["supplier.portfolios"],"shared":false},{"table":"product_decisions","pages":["supplier.decisions"],"shared":false},{"table":"marketplace_customer_favorites","pages":["marketplace.favorites"],"shared":false},{"table":"platform_customization_requests","pages":["supplier.validated-products"],"shared":false},{"table":"platform_stock_restock_requests","pages":["supplier.restock"],"shared":false},{"table":"kpi_catalog","pages":["data.kpi"],"shared":false},{"table":"publication_requests","pages":["data.requests"],"shared":false},{"table":"publications","pages":["data.reports","app.feed"],"shared":false},{"table":"bi_dashboard_versions","pages":["data.bi-dashboards"],"shared":false},{"table":"rd_reports","pages":["product.reports"],"shared":false},{"table":"rd_recommendations","pages":["product.studio"],"shared":false},{"table":"tech_requests","pages":["product.studio","product.backlog","security.code"],"shared":false},{"table":"tech_request_comments","pages":["product.studio","product.backlog","security.code"],"shared":false},{"table":"tech_request_events","pages":["product.studio","product.backlog","security.code"],"shared":false},{"table":"lifecycle_risk_alerts","pages":["support.compliance","compliance.risks"],"shared":false},{"table":"external_messages","pages":["gateway.inbox","gateway.compose","gateway.validation","gateway.journal"],"shared":false},{"table":"message_routing_log","pages":["gateway.journal"],"shared":false},{"table":"email_send_log","pages":["gateway.journal","security.logs"],"shared":false},{"table":"feed_posts","pages":["app.feed"],"shared":false},{"table":"audit_logs","pages":["security.logs","app.dashboard"],"shared":false},{"table":"platform_sync_runs","pages":["security.supervision","marketplace.overview","direction.overview"],"shared":false}]$tables$::jsonb)x;
CREATE OR REPLACE FUNCTION public.is_intranet_actor()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid()AND app_origin='connect'); $$;
CREATE OR REPLACE FUNCTION public.can_intranet_table_action(p_table text,p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE config public.intranet_business_tables%ROWTYPE;
BEGIN
 SELECT * INTO config FROM public.intranet_business_tables WHERE table_name=p_table;
 IF NOT FOUND OR p_action IS NULL THEN RETURN false;END IF;
 -- Shared commercial tables retain the platform's existing row policies.
 IF config.shared_platform AND NOT public.is_intranet_actor()THEN RETURN true;END IF;
 IF p_table IN ('auth_logs','edge_function_logs','audit_logs')AND p_action='create'THEN RETURN public.can_intranet_action('app.dashboard','read');END IF;
 IF p_table IN ('tech_requests','tech_request_comments','tech_request_events')AND p_action='create'THEN RETURN public.can_intranet_action('app.dashboard','read');END IF;
 IF p_table='publications'AND p_action<>'read'THEN RETURN public.can_intranet_action('data.reports',p_action);END IF;
 RETURN EXISTS(SELECT 1 FROM unnest(config.page_ids)p WHERE public.can_intranet_action(p,p_action));
END;
$$;
CREATE TABLE public.intranet_business_history(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),table_name text NOT NULL,row_id text,actor_id uuid,action text NOT NULL,before_state jsonb,after_state jsonb,test_account boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX intranet_business_history_record ON public.intranet_business_history(table_name,row_id,created_at DESC);
ALTER TABLE public.intranet_business_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.intranet_business_history TO authenticated;
GRANT ALL ON public.intranet_business_history TO service_role;
CREATE OR REPLACE FUNCTION public.can_read_intranet_business_history(p_table text,p_id text,p_actor uuid,p_test boolean)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE visible boolean;
BEGIN
 IF NOT public.is_intranet_actor()OR NOT public.can_intranet_table_action(p_table,'read')OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid()AND coalesce(test_account,false)=p_test)THEN RETURN false;END IF;
 IF NOT EXISTS(SELECT 1 FROM public.intranet_business_tables WHERE table_name=p_table)THEN RETURN false;END IF;
 IF public.has_role(auth.uid(),'admin')THEN RETURN true;END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE id::text=$1)',p_table)INTO visible USING p_id;RETURN visible;
END;
$$;
-- Only the table registry is readable to staff; its management is deployment-only.
GRANT SELECT ON public.intranet_business_tables TO authenticated;
CREATE POLICY intranet_business_catalog ON public.intranet_business_tables FOR SELECT TO authenticated USING(public.is_intranet_actor());
CREATE POLICY intranet_business_history_read ON public.intranet_business_history FOR SELECT TO authenticated USING(public.can_read_intranet_business_history(table_name,row_id,actor_id,test_account));
CREATE OR REPLACE FUNCTION public.guard_intranet_business_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE before jsonb; after jsonb; next_status text; prior_status text; actor uuid:=auth.uid(); field text; originator text;
BEGIN
 IF auth.role()='service_role'OR actor IS NULL THEN IF TG_OP='DELETE'THEN RETURN OLD;ELSE RETURN NEW;END IF;END IF;
 IF NOT public.is_intranet_actor()AND EXISTS(SELECT 1 FROM public.intranet_business_tables WHERE table_name=TG_TABLE_NAME AND shared_platform)THEN IF TG_OP='DELETE'THEN RETURN OLD;ELSE RETURN NEW;END IF;END IF;
 IF NOT public.can_intranet_table_action(TG_TABLE_NAME,CASE TG_OP WHEN 'INSERT'THEN 'create'WHEN 'DELETE'THEN 'delete'ELSE 'update'END)THEN RAISE EXCEPTION 'business_action_forbidden' USING ERRCODE='42501';END IF;
 IF TG_OP='DELETE'THEN
  IF TG_TABLE_NAME IN ('card_transactions','corporate_card_transactions','salaries','supplier_payments','contracts','board_reports','direction_board_reports','work_validations') AND coalesce(to_jsonb(OLD)->>'approval_status',to_jsonb(OLD)->>'status') IN ('approved','validated','paid','published','archived','active','expired','terminated') THEN RAISE EXCEPTION 'business_record_locked' USING ERRCODE='55000';END IF;
  RETURN OLD;
 END IF;
 after:=to_jsonb(NEW);IF TG_OP='UPDATE'THEN before:=to_jsonb(OLD);END IF;
 FOREACH field IN ARRAY ARRAY['created_by','recorded_by','reported_by','requester_id','requested_by','raised_by','caller_id']LOOP
  IF after?field THEN
   IF TG_OP='INSERT'THEN after:=jsonb_set(after,ARRAY[field],to_jsonb(actor));
   ELSIF after->field IS DISTINCT FROM before->field THEN RAISE EXCEPTION 'business_actor_immutable' USING ERRCODE='42501';END IF;
  END IF;
 END LOOP;
 IF TG_TABLE_NAME='corporate_card_transactions'AND TG_OP='INSERT'THEN after:=jsonb_set(after,'{user_id}',to_jsonb(actor));END IF;
 next_status:=coalesce(after->>'approval_status',after->>'status');prior_status:=coalesce(before->>'approval_status',before->>'status');
 IF (TG_OP='INSERT'OR next_status IS DISTINCT FROM prior_status)AND(next_status IN ('approved','validated','rejected','published','paid')OR TG_TABLE_NAME='tech_requests'AND next_status='accepted')THEN
  IF TG_OP='INSERT'THEN RAISE EXCEPTION 'business_decision_requires_existing_record' USING ERRCODE='42501';END IF;
  IF NOT public.can_intranet_table_action(TG_TABLE_NAME,CASE WHEN next_status='published'THEN 'publish'ELSE 'validate'END)THEN RAISE EXCEPTION 'business_validation_forbidden' USING ERRCODE='42501';END IF;
  FOREACH field IN ARRAY ARRAY['created_by','recorded_by','reported_by','requester_id','requested_by','user_id']LOOP
   originator:=before->>field;IF originator=actor::text THEN RAISE EXCEPTION 'business_self_approval_forbidden' USING ERRCODE='42501';END IF;
  END LOOP;
  FOREACH field IN ARRAY ARRAY['approved_by','validated_by','rejected_by','paid_by','decided_by']LOOP IF after?field THEN after:=jsonb_set(after,ARRAY[field],to_jsonb(actor));END IF;END LOOP;
  IF TG_TABLE_NAME='tech_requests'AND next_status='rejected'AND length(btrim(coalesce(after->>'decision_reason','')))=0 THEN RAISE EXCEPTION 'business_rejection_reason_required' USING ERRCODE='22023';END IF;
  IF TG_TABLE_NAME='work_validations'AND before->>'validator_id'IS NOT NULL AND before->>'validator_id'<>actor::text THEN RAISE EXCEPTION 'business_validator_forbidden' USING ERRCODE='42501';END IF;
 END IF;
 IF TG_OP='UPDATE'AND TG_TABLE_NAME IN ('card_transactions','corporate_card_transactions','salaries','supplier_payments','contracts','board_reports','direction_board_reports','work_validations')AND(prior_status IN ('approved','validated','paid','published','archived','terminated','expired')OR(TG_TABLE_NAME='contracts'AND prior_status='active'))THEN
  IF next_status IS DISTINCT FROM prior_status AND NOT(
   TG_TABLE_NAME IN ('salaries','supplier_payments')AND prior_status IN ('approved','validated')AND next_status='paid'
   OR TG_TABLE_NAME='contracts'AND prior_status='active'AND next_status IN ('terminated','expired')
   OR TG_TABLE_NAME='board_reports'AND prior_status='published'AND next_status='archived')THEN RAISE EXCEPTION 'business_record_locked' USING ERRCODE='55000';END IF;
  IF next_status IS DISTINCT FROM prior_status AND NOT public.can_intranet_table_action(TG_TABLE_NAME,'validate')THEN RAISE EXCEPTION 'business_validation_forbidden' USING ERRCODE='42501';END IF;
  IF (after-CASE WHEN next_status='paid'AND prior_status<>'paid'THEN ARRAY['status','approval_status','updated_at','revision','paid_date','paid_at']ELSE ARRAY['status','approval_status','updated_at','revision']END)IS DISTINCT FROM(before-CASE WHEN next_status='paid'AND prior_status<>'paid'THEN ARRAY['status','approval_status','updated_at','revision','paid_date','paid_at']ELSE ARRAY['status','approval_status','updated_at','revision']END)THEN RAISE EXCEPTION 'business_record_locked' USING ERRCODE='55000';END IF;
 END IF;
 NEW:=jsonb_populate_record(NEW,after);RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.log_intranet_business_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE before jsonb;after jsonb; actor uuid:=auth.uid();mode boolean;
BEGIN
 IF TG_OP<>'INSERT'THEN before:=to_jsonb(OLD);END IF;IF TG_OP<>'DELETE'THEN after:=to_jsonb(NEW);END IF;
 IF public.is_intranet_actor()OR auth.role()='service_role'THEN
 SELECT coalesce(test_account,false)INTO mode FROM public.profiles WHERE id=actor;
 INSERT INTO public.intranet_business_history(table_name,row_id,actor_id,action,before_state,after_state,test_account)VALUES(TG_TABLE_NAME,coalesce(after->>'id',before->>'id'),actor,lower(TG_OP),before,after,coalesce((coalesce(after,before)->>'test_account')::boolean,mode,false));
 END IF;
 IF TG_OP='DELETE'THEN RETURN OLD;ELSE RETURN NEW;END IF;
END;
$$;
DO $$DECLARE t record;BEGIN
 FOR t IN SELECT table_name FROM public.intranet_business_tables LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass('public.'||quote_ident(t.table_name))AND relkind IN ('r','p'))THEN CONTINUE;END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t.table_name);
  EXECUTE format('CREATE POLICY intranet_read_boundary ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING(public.can_intranet_table_action(%L,''read''))',t.table_name,t.table_name);
  EXECUTE format('CREATE POLICY intranet_create_boundary ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.can_intranet_table_action(%L,''create''))',t.table_name,t.table_name);
  EXECUTE format('CREATE POLICY intranet_update_boundary ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.can_intranet_table_action(%L,''update''))WITH CHECK(public.can_intranet_table_action(%L,''update''))',t.table_name,t.table_name,t.table_name);
  EXECUTE format('CREATE POLICY intranet_delete_boundary ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING(public.can_intranet_table_action(%L,''delete''))',t.table_name,t.table_name);
  IF t.table_name NOT IN ('auth_logs','edge_function_logs','audit_logs','email_send_log','message_routing_log','tech_request_events','supplier_application_events','direction_decision_history','shop_status_events','audit_mission_events','direction_roadmap_history','anomaly_events','order_lifecycle_events')THEN
   EXECUTE format('CREATE TRIGGER zz_intranet_business_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_intranet_business_write()',t.table_name);
   EXECUTE format('CREATE TRIGGER zz_intranet_business_history AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_intranet_business_write()',t.table_name);
  END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.guard_intranet_business_write(),public.log_intranet_business_write()FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.is_intranet_actor(),public.can_intranet_table_action(text,text),public.can_read_intranet_business_history(text,text,uuid,boolean)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_intranet_actor(),public.can_intranet_table_action(text,text),public.can_read_intranet_business_history(text,text,uuid,boolean)TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.list_intranet_business_history(p_page text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb) FROM (
 SELECT h.id,h.table_name,h.row_id,h.actor_id,h.action,h.before_state,h.after_state,h.created_at FROM public.intranet_business_history h JOIN public.intranet_business_tables t ON t.table_name=h.table_name
 WHERE p_page=ANY(t.page_ids) AND public.can_intranet_action(p_page,'read') ORDER BY h.created_at DESC LIMIT 100)x;
$$;
REVOKE ALL ON FUNCTION public.list_intranet_business_history(text)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_intranet_business_history(text)TO authenticated,service_role;

-- Existing ticket comments/events must refer to a request visible through its original row policy.
DO $$DECLARE table_name text;BEGIN
 FOREACH table_name IN ARRAY ARRAY['tech_request_comments','tech_request_events']LOOP
 IF to_regclass('public.'||table_name)IS NOT NULL THEN
 EXECUTE format('CREATE POLICY intranet_ticket_parent ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.tech_requests r WHERE r.id=request_id))',table_name);
 END IF;
 END LOOP;
END $$;
