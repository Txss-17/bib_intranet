
-- 1. Suppliers: restrict SELECT to managers/admins
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
CREATE POLICY "Managers and admins can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- 2. user_accounts: restrict SELECT to managers/admins
DROP POLICY IF EXISTS "Authenticated users can view user accounts" ON public.user_accounts;
CREATE POLICY "Managers and admins can view user accounts" ON public.user_accounts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- 3. profiles: own + admin/manager
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users view own profile; admins view all" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- 4. media_attachments: no more ALL true/true
DROP POLICY IF EXISTS "Authenticated users can manage media attachments" ON public.media_attachments;
CREATE POLICY "Authenticated users can insert media attachments" ON public.media_attachments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update media attachments" ON public.media_attachments
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Managers can delete media attachments" ON public.media_attachments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- 5. quality_alerts INSERT
DROP POLICY IF EXISTS "Authenticated users can create quality alerts" ON public.quality_alerts;
CREATE POLICY "Authenticated users can create quality alerts" ON public.quality_alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 6. bugs INSERT
DROP POLICY IF EXISTS "Authenticated users can create bugs" ON public.bugs;
CREATE POLICY "Authenticated users can create bugs" ON public.bugs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 7. security_alerts INSERT — admins/managers only (system uses service_role)
DROP POLICY IF EXISTS "System can insert security alerts" ON public.security_alerts;
CREATE POLICY "Admins can insert security alerts" ON public.security_alerts
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- 8. audit_logs INSERT — must reference the actor
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;
CREATE POLICY "Users can create their own audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 9. notifications INSERT — admins/managers only
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Admins and managers can create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- 10. whistleblower_submissions INSERT — cannot preset assignment or non-default status
DROP POLICY IF EXISTS "Anyone can create whistleblower submissions" ON public.whistleblower_submissions;
CREATE POLICY "Authenticated users can create whistleblower submissions" ON public.whistleblower_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND assigned_auditor_id IS NULL AND resolution_notes IS NULL);

-- 11. Remove vpn_access from realtime broadcasts
ALTER PUBLICATION supabase_realtime DROP TABLE public.vpn_access;

-- 12. Function search_path
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

-- 13. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.detect_replenishment_needs() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text,integer,integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text,bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text,text,bigint,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_demand_forecast() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;

-- 14. Storage.objects policies
DROP POLICY IF EXISTS "product-assets public read" ON storage.objects;
DROP POLICY IF EXISTS "product-assets authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "product-assets authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "product-assets authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "database_export admins only" ON storage.objects;

CREATE POLICY "product-assets public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-assets');
CREATE POLICY "product-assets authenticated insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-assets');
CREATE POLICY "product-assets authenticated update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-assets' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (bucket_id = 'product-assets');
CREATE POLICY "product-assets authenticated delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-assets' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));
CREATE POLICY "database_export admins only" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'database_export_19_07_26' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'database_export_19_07_26' AND public.has_role(auth.uid(),'admin'));
