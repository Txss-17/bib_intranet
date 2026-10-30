-- Archive can be requested by the author/owner for unapproved drafts,
-- but approved records require an independent reviewer. Every archive needs
-- an explicit justification and remains in the immutable event journal.
CREATE OR REPLACE FUNCTION public.product_transition_record(p_id uuid, p_expected_revision integer, p_status text, p_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_actor uuid:=auth.uid(); v_old public.product_work_records%ROWTYPE;
 v_next public.product_work_records%ROWTYPE; v_reviewer boolean;
BEGIN
 IF NOT public.product_work_member() THEN RAISE EXCEPTION 'Product role required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_old FROM public.product_work_records WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR NOT public.product_record_visible(v_old.created_by,v_old.owner_id,v_old.visibility)
 THEN RAISE EXCEPTION 'Record unavailable' USING ERRCODE='42501'; END IF;
 IF v_old.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Revision changed' USING ERRCODE='40001'; END IF;
 v_reviewer:=(public.has_pole(v_actor,'product') OR public.has_role(v_actor,'admin'::public.app_role))
   AND v_old.created_by<>v_actor AND v_old.owner_id IS DISTINCT FROM v_actor;
 IF p_status='submitted' THEN
  IF v_old.status NOT IN ('draft','rejected') OR NOT (
    v_old.created_by=v_actor OR v_old.owner_id=v_actor)
  THEN RAISE EXCEPTION 'Submission not authorized' USING ERRCODE='42501'; END IF;
 ELSIF p_status IN ('reviewed','approved','rejected') THEN
  IF NOT v_reviewer OR v_old.status NOT IN ('submitted','reviewed')
  THEN RAISE EXCEPTION 'Independent reviewer required' USING ERRCODE='42501'; END IF;
  IF p_status='rejected' AND length(trim(coalesce(p_note,'')))<8 THEN
   RAISE EXCEPTION 'Review justification required' USING ERRCODE='22023'; END IF;
 ELSIF p_status='draft' THEN
  IF NOT v_reviewer OR v_old.status NOT IN('submitted','reviewed','approved')
    OR length(trim(coalesce(p_note,'')))<8 THEN
   RAISE EXCEPTION 'Reopening requires reason and reviewer' USING ERRCODE='42501'; END IF;
 ELSIF p_status='archived' THEN
  IF NOT (
    (v_old.status IN('draft','rejected') AND
      (v_old.created_by=v_actor OR v_old.owner_id=v_actor OR v_reviewer))
    OR (v_old.status='approved' AND v_reviewer)
   ) OR length(trim(coalesce(p_note,'')))<8 THEN
   RAISE EXCEPTION 'Archive not authorized' USING ERRCODE='42501'; END IF;
 ELSE RAISE EXCEPTION 'Invalid transition' USING ERRCODE='22023';
 END IF;
 UPDATE public.product_work_records SET
  status=p_status,revision=revision+1,updated_at=now(),
  first_reviewer=CASE WHEN p_status='reviewed' THEN v_actor ELSE first_reviewer END,
  approved_by=CASE WHEN p_status='approved' THEN v_actor ELSE approved_by END
 WHERE id=p_id RETURNING * INTO v_next;
 INSERT INTO public.product_work_events(record_id,actor_id,kind,note,before_state,after_state)
 VALUES(p_id,v_actor,p_status,nullif(trim(coalesce(p_note,'')),''),to_jsonb(v_old),to_jsonb(v_next));
 RETURN to_jsonb(v_next);
END;
$function$;
