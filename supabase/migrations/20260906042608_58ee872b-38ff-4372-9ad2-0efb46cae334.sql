-- approval_history
DROP POLICY IF EXISTS approval_history_read_auth ON public.approval_history;
CREATE POLICY approval_history_read_scoped ON public.approval_history
FOR SELECT TO authenticated
USING (actor_id = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- audit_logs
DROP POLICY IF EXISTS "Users can view relevant audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own or governed audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- documents (respect access_level)
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
CREATE POLICY "Documents visible per access level" ON public.documents
FOR SELECT TO authenticated
USING (
  uploaded_by = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR (COALESCE(access_level, 'public') = 'public')
  OR (access_level = 'restricted' AND public.has_pole(auth.uid(), pole_id::text))
);

-- external_messages
DROP POLICY IF EXISTS "Authorized users can view external messages" ON public.external_messages;
CREATE POLICY "Gateway staff can view external messages" ON public.external_messages
FOR SELECT TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR (routed_to_pole IS NOT NULL AND public.has_pole(auth.uid(), routed_to_pole::text))
);

-- feed_posts (respect visibility)
DROP POLICY IF EXISTS "Authenticated users can view feed posts" ON public.feed_posts;
CREATE POLICY "Feed posts visible per visibility" ON public.feed_posts
FOR SELECT TO authenticated
USING (
  author_id = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR COALESCE(visibility, 'company') = 'company'
  OR (visibility = 'pole' AND pole_id IS NOT NULL AND public.has_pole(auth.uid(), pole_id::text))
);

-- inter_pole_messages
DROP POLICY IF EXISTS "Users can view messages for their poles" ON public.inter_pole_messages;
CREATE POLICY "Users can view their pole messages" ON public.inter_pole_messages
FOR SELECT TO authenticated
USING (
  from_user_id = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_pole(auth.uid(), from_pole::text)
  OR public.has_pole(auth.uid(), to_pole::text)
);

-- kpi_catalog writes
DROP POLICY IF EXISTS "kpi_catalog manage authenticated" ON public.kpi_catalog;
CREATE POLICY kpi_catalog_manage_scoped ON public.kpi_catalog
FOR ALL TO authenticated
USING (
  owner_id = auth.uid() OR created_by = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_any_pole(auth.uid(), ARRAY['data','tech'])
)
WITH CHECK (
  owner_id = auth.uid() OR created_by = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_any_pole(auth.uid(), ARRAY['data','tech'])
);

-- media_attachments
DROP POLICY IF EXISTS "Authenticated users can view media attachments" ON public.media_attachments;
CREATE POLICY "Related staff can view media attachments" ON public.media_attachments
FOR SELECT TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_pole(auth.uid(), entity_type)
);

-- message_routing_log
DROP POLICY IF EXISTS "Users can view message routing logs" ON public.message_routing_log;
CREATE POLICY "Gateway staff can view routing logs" ON public.message_routing_log
FOR SELECT TO authenticated
USING (
  performed_by = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.external_messages m
    WHERE m.id = message_routing_log.message_id
      AND m.routed_to_pole IS NOT NULL
      AND public.has_pole(auth.uid(), m.routed_to_pole::text)
  )
);

-- publication_requests
DROP POLICY IF EXISTS "pub_req readable auth" ON public.publication_requests;
CREATE POLICY pub_req_read_scoped ON public.publication_requests
FOR SELECT TO authenticated
USING (
  requested_by = auth.uid() OR data_validator = auth.uid() OR tech_assignee = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_any_pole(auth.uid(), ARRAY['data','tech'])
);

-- publications (respect visibility_scope / visibility_targets)
DROP POLICY IF EXISTS "publications readable auth" ON public.publications;
CREATE POLICY publications_read_scoped ON public.publications
FOR SELECT TO authenticated
USING (
  author_id = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR COALESCE(visibility_scope, 'all') IN ('all', 'company', 'public')
  OR (COALESCE(visibility_targets, '{}'::text[]) && public.my_poles())
);

-- tech request comments / events: scope to parent request visibility
DROP POLICY IF EXISTS tech_request_comments_select ON public.tech_request_comments;
CREATE POLICY tech_request_comments_select ON public.tech_request_comments
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tech_requests r
  WHERE r.id = tech_request_comments.request_id
    AND (
      r.requester_id = auth.uid() OR r.assignee_id = auth.uid()
      OR public.is_leadership(auth.uid())
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_pole(auth.uid(), 'tech')
      OR public.has_pole(auth.uid(), r.requester_pole)
    )
));

DROP POLICY IF EXISTS tech_request_events_select ON public.tech_request_events;
CREATE POLICY tech_request_events_select ON public.tech_request_events
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tech_requests r
  WHERE r.id = tech_request_events.request_id
    AND (
      r.requester_id = auth.uid() OR r.assignee_id = auth.uid()
      OR public.is_leadership(auth.uid())
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_pole(auth.uid(), 'tech')
      OR public.has_pole(auth.uid(), r.requester_pole)
    )
));

DROP POLICY IF EXISTS hr_request_events_select ON public.hr_employee_request_events;
CREATE POLICY hr_request_events_select ON public.hr_employee_request_events
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.hr_employee_requests r
  WHERE r.id = hr_employee_request_events.request_id
    AND (
      r.created_by = auth.uid() OR r.manager_id = auth.uid() OR r.created_user_id = auth.uid()
      OR public.is_leadership(auth.uid())
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_pole(auth.uid(), 'rh')
      OR public.has_pole(auth.uid(), 'tech')
    )
));