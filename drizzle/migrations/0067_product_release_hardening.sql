-- Harden product release evidence: no synthetic staff reads and independent
-- approval. Does not change existing releases or mark any deployment successful.
DO $migration$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint
   WHERE conrelid='public.product_release_tracking'::regclass
     AND conname='product_release_reviewer_independent') THEN
  ALTER TABLE public.product_release_tracking
    ADD CONSTRAINT product_release_reviewer_independent
    CHECK (reviewer_id IS NULL OR reviewer_id <> created_by);
 END IF;
END;
$migration$;

DROP POLICY IF EXISTS product_release_real_staff_guard ON public.product_release_tracking;
CREATE POLICY product_release_real_staff_guard ON public.product_release_tracking
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.product_work_member());

DROP POLICY IF EXISTS product_release_events_real_staff_guard ON public.product_release_tracking_events;
CREATE POLICY product_release_events_real_staff_guard ON public.product_release_tracking_events
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.product_work_member());

-- Previous product release RPC checks product pole and active app_origin, but a
-- test account must never be able to record or approve a real release.
-- This trigger also protects any future server-side DML path.
CREATE OR REPLACE FUNCTION public.guard_product_release_actor()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $fn$
BEGIN
 IF auth.uid() IS NULL OR NOT public.product_work_member() THEN
   RAISE EXCEPTION 'Active non-test Product member required' USING ERRCODE='42501';
 END IF;
 IF TG_OP='INSERT' AND NEW.created_by<>auth.uid() THEN
   RAISE EXCEPTION 'Release creator mismatch' USING ERRCODE='42501';
 END IF;
 IF TG_OP='UPDATE' AND NEW.created_by<>OLD.created_by THEN
   RAISE EXCEPTION 'Release creator immutable' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS guard_product_release_actor_trigger ON public.product_release_tracking;
CREATE TRIGGER guard_product_release_actor_trigger
BEFORE INSERT OR UPDATE ON public.product_release_tracking
FOR EACH ROW EXECUTE FUNCTION public.guard_product_release_actor();
REVOKE ALL ON FUNCTION public.guard_product_release_actor() FROM PUBLIC,anon,authenticated;
