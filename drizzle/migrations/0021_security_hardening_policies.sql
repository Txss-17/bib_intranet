-- Bind actor columns to the caller (defaults keep existing inserts working)
ALTER TABLE public.kpi_versions ALTER COLUMN changed_by SET DEFAULT auth.uid();
ALTER TABLE public.audit_incidents ALTER COLUMN declared_by SET DEFAULT auth.uid();
ALTER TABLE public.quality_alerts ALTER COLUMN reported_by SET DEFAULT auth.uid();
ALTER TABLE public.order_lifecycle_events ALTER COLUMN performed_by SET DEFAULT auth.uid();
ALTER TABLE public.stock_movements ALTER COLUMN performed_by SET DEFAULT auth.uid();
ALTER TABLE public.message_routing_log ALTER COLUMN performed_by SET DEFAULT auth.uid();
ALTER TABLE public.feed_posts ALTER COLUMN author_id SET DEFAULT auth.uid();
ALTER TABLE public.edge_function_logs ALTER COLUMN caller_id SET DEFAULT auth.uid();
ALTER TABLE public.bugs ALTER COLUMN reported_by SET DEFAULT auth.uid();
ALTER TABLE public.auth_logs ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "kpi_versions insert auth" ON public.kpi_versions;
CREATE POLICY "kpi_versions insert own" ON public.kpi_versions FOR INSERT TO authenticated WITH CHECK (changed_by = auth.uid());
DROP POLICY IF EXISTS "declare audit incidents" ON public.audit_incidents;
CREATE POLICY "declare audit incidents" ON public.audit_incidents FOR INSERT TO authenticated WITH CHECK (declared_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can create quality alerts" ON public.quality_alerts;
CREATE POLICY "Users create own quality alerts" ON public.quality_alerts FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated can insert order events" ON public.order_lifecycle_events;
CREATE POLICY "Insert own order events" ON public.order_lifecycle_events FOR INSERT TO authenticated WITH CHECK (performed_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated can insert stock movements" ON public.stock_movements;
CREATE POLICY "Insert own stock movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (performed_by = auth.uid() AND (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier'])));
DROP POLICY IF EXISTS "Authenticated can create routing logs" ON public.message_routing_log;
CREATE POLICY "Create own routing logs" ON public.message_routing_log FOR INSERT TO authenticated WITH CHECK (performed_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can create feed posts" ON public.feed_posts;
CREATE POLICY "Users create own feed posts" ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "Authenticated can insert edge function logs" ON public.edge_function_logs;
CREATE POLICY "Insert own edge function logs" ON public.edge_function_logs FOR INSERT TO authenticated WITH CHECK (caller_id = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can create bugs" ON public.bugs;
CREATE POLICY "Users report own bugs" ON public.bugs FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated can insert auth logs" ON public.auth_logs;
CREATE POLICY "Users insert own auth logs" ON public.auth_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can create support tickets" ON public.support_tickets;
CREATE POLICY "Users create own support tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated can insert sync events" ON public.partner_sync_events;
CREATE POLICY "Business poles insert sync events" ON public.partner_sync_events FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['ops','supplier','tech']));
DROP POLICY IF EXISTS "Authenticated can create whistleblower updates" ON public.whistleblower_updates;
CREATE POLICY "Auditors create whistleblower updates" ON public.whistleblower_updates FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_pole(auth.uid(),'compliance')
  OR EXISTS (SELECT 1 FROM public.whistleblower_submissions ws WHERE ws.id = submission_id AND ws.assigned_auditor_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update media attachments" ON public.media_attachments;
CREATE POLICY "Related staff update media attachments" ON public.media_attachments FOR UPDATE TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_pole(auth.uid(), entity_type))
  WITH CHECK (public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_pole(auth.uid(), entity_type));

DROP POLICY IF EXISTS "publications manage auth" ON public.publications;
CREATE POLICY "publications manage scoped" ON public.publications FOR ALL TO authenticated
  USING (author_id = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_any_pole(auth.uid(), ARRAY['rh','marketing','data','tech']))
  WITH CHECK (author_id = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_any_pole(auth.uid(), ARRAY['rh','marketing','data','tech']));
DROP POLICY IF EXISTS "pub_req manage auth" ON public.publication_requests;
CREATE POLICY "pub_req manage scoped" ON public.publication_requests FOR ALL TO authenticated
  USING (requested_by = auth.uid() OR data_validator = auth.uid() OR tech_assignee = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_any_pole(auth.uid(), ARRAY['data','tech']))
  WITH CHECK (requested_by = auth.uid() OR data_validator = auth.uid() OR tech_assignee = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_any_pole(auth.uid(), ARRAY['data','tech']));

DROP POLICY IF EXISTS "bi_widgets_write" ON public.bi_dashboard_widgets;
CREATE POLICY "bi_widgets_write" ON public.bi_dashboard_widgets FOR ALL TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','data']) OR EXISTS (SELECT 1 FROM public.bi_dashboards d WHERE d.id = dashboard_id AND d.owner_id = auth.uid()))
  WITH CHECK (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['tech','data']) OR EXISTS (SELECT 1 FROM public.bi_dashboards d WHERE d.id = dashboard_id AND d.owner_id = auth.uid()));

-- Catalog tables: staff-only reads (no tautology)
DROP POLICY IF EXISTS "Authenticated can read access_scopes" ON public.access_scopes;
CREATE POLICY "Staff read access_scopes" ON public.access_scopes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Interfaces readable" ON public.access_interfaces;
CREATE POLICY "Staff read access_interfaces" ON public.access_interfaces FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated can read access_roles" ON public.access_roles;
CREATE POLICY "Staff read access_roles" ON public.access_roles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Permissions readable" ON public.access_permissions;
CREATE POLICY "Staff read access_permissions" ON public.access_permissions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Actions readable" ON public.access_actions;
CREATE POLICY "Staff read access_actions" ON public.access_actions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated can read access_portfolio_types" ON public.access_portfolio_types;
CREATE POLICY "Staff read access_portfolio_types" ON public.access_portfolio_types FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- Per-person data: owner or managers only
DROP POLICY IF EXISTS "Authenticated can read access_assignments" ON public.access_assignments;
CREATE POLICY "Own or managers read access_assignments" ON public.access_assignments FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_pole(auth.uid(),'rh') OR public.is_leadership(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can read merchant_portfolios" ON public.merchant_portfolios;
CREATE POLICY "Business staff read merchant_portfolios" ON public.merchant_portfolios FOR SELECT TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_any_pole(auth.uid(), ARRAY['ops','lifecycle','rh']));
DROP POLICY IF EXISTS "Authenticated can read merchant_portfolio_assignments" ON public.merchant_portfolio_assignments;
CREATE POLICY "Business staff read merchant_portfolio_assignments" ON public.merchant_portfolio_assignments FOR SELECT TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_any_pole(auth.uid(), ARRAY['ops','lifecycle','rh']));

-- Storage: bind product-assets writes to the uploader
DROP POLICY IF EXISTS "product-assets authenticated insert" ON storage.objects;
CREATE POLICY "product-assets authenticated insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-assets' AND owner = auth.uid());
DROP POLICY IF EXISTS "product-assets authenticated update" ON storage.objects;
CREATE POLICY "product-assets authenticated update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-assets' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (bucket_id = 'product-assets' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

-- Business trips: owners cannot decide their own trip
CREATE OR REPLACE FUNCTION public.guard_business_trip_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(auth.role(),'') = 'service_role' THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('approved','rejected','manager_approved','finance_approved','validated')
     AND NOT (
       (OLD.manager_id IS NOT NULL AND OLD.manager_id = auth.uid() AND OLD.user_id <> auth.uid())
       OR public.has_role(auth.uid(),'admin')
       OR public.has_any_pole(auth.uid(), ARRAY['rh','finance'])
       OR public.is_leadership(auth.uid())
     ) THEN
    RAISE EXCEPTION 'Seul le manager, les RH, la Finance ou la Direction peuvent valider ou refuser ce déplacement';
  END IF;
  IF OLD.user_id = auth.uid() AND NEW.manager_id IS DISTINCT FROM OLD.manager_id
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_pole(auth.uid(),'rh') OR public.is_leadership(auth.uid())) THEN
    RAISE EXCEPTION 'Le manager d''un déplacement ne peut pas être modifié par le demandeur';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_business_trip_decision ON public.business_trips;
CREATE TRIGGER trg_guard_business_trip_decision BEFORE UPDATE ON public.business_trips
  FOR EACH ROW EXECUTE FUNCTION public.guard_business_trip_decision();