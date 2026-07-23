
DROP POLICY IF EXISTS "declare audit incidents" ON public.audit_incidents;
CREATE POLICY "declare audit incidents" ON public.audit_incidents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert auth logs" ON public.auth_logs;
CREATE POLICY "Authenticated can insert auth logs" ON public.auth_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "bi_widgets_write" ON public.bi_dashboard_widgets;
CREATE POLICY "bi_widgets_write" ON public.bi_dashboard_widgets
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert edge function logs" ON public.edge_function_logs;
CREATE POLICY "Authenticated can insert edge function logs" ON public.edge_function_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create feed posts" ON public.feed_posts;
CREATE POLICY "Authenticated users can create feed posts" ON public.feed_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can create routing logs" ON public.message_routing_log;
CREATE POLICY "Authenticated can create routing logs" ON public.message_routing_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert order events" ON public.order_lifecycle_events;
CREATE POLICY "Authenticated can insert order events" ON public.order_lifecycle_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert sync events" ON public.partner_sync_events;
CREATE POLICY "Authenticated can insert sync events" ON public.partner_sync_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert stock movements" ON public.stock_movements;
CREATE POLICY "Authenticated can insert stock movements" ON public.stock_movements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create support tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can create support tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can create whistleblower updates" ON public.whistleblower_updates;
CREATE POLICY "Authenticated can create whistleblower updates" ON public.whistleblower_updates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
