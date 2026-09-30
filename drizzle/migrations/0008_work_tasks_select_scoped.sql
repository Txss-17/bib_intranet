DROP POLICY IF EXISTS work_tasks_select ON public.work_tasks;

CREATE POLICY work_tasks_select ON public.work_tasks
FOR SELECT TO authenticated
USING (
  assignee_id = auth.uid()
  OR created_by = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);