-- 0103: independent inter-pole Audit referrals from real Merchant shops and Logistics incidents.
-- These are requests for Audit review, not technical decisions or financial documents.
-- Invoke only after 0102; no backfill and no automatic source publication.
CREATE TABLE IF NOT EXISTS public.audit_cross_pole_referrals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_pole text NOT NULL CHECK(source_pole IN ('marketplace','ops')),
 source_type text NOT NULL CHECK(source_type IN ('shop','logistics_incident')),
 source_id uuid NOT NULL,
 audit_modality text NOT NULL CHECK(audit_modality IN ('documentary','on_site','quality_control')),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 12 AND 1000),
 sent_by uuid NOT NULL REFERENCES auth.users(id),
 sent_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 test_account boolean NOT NULL,
 status text NOT NULL DEFAULT 'received' CHECK(status='received'),
 CONSTRAINT audit_referral_source_matches_pole CHECK(
   (source_pole='marketplace' AND source_type='shop')
   OR (source_pole='ops' AND source_type='logistics_incident')
 ),
 CONSTRAINT audit_referral_unique_source UNIQUE(test_account,source_type,source_id)
);
-- A direct allowed INSERT still cannot forge the author, timestamp, status or mode.
CREATE OR REPLACE FUNCTION public.audit_cross_pole_referral_stamp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'audit_referral_forbidden' USING ERRCODE='42501'; END IF;
 NEW.sent_by:=auth.uid();
 NEW.sent_at:=clock_timestamp();
 NEW.test_account:=public.intranet_is_test_mode();
 NEW.status:='received';
 RETURN NEW;
END;$;
REVOKE ALL ON FUNCTION public.audit_cross_pole_referral_stamp() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS audit_cross_pole_referral_stamp_trigger ON public.audit_cross_pole_referrals;
CREATE TRIGGER audit_cross_pole_referral_stamp_trigger
BEFORE INSERT ON public.audit_cross_pole_referrals
FOR EACH ROW EXECUTE FUNCTION public.audit_cross_pole_referral_stamp();
CREATE INDEX IF NOT EXISTS audit_cross_pole_referrals_created_idx
 ON public.audit_cross_pole_referrals(sent_at DESC);
ALTER TABLE public.audit_cross_pole_referrals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_cross_pole_referrals FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.audit_cross_pole_referrals TO authenticated;
GRANT ALL ON public.audit_cross_pole_referrals TO service_role;
DROP POLICY IF EXISTS audit_cross_pole_referrals_read ON public.audit_cross_pole_referrals;
CREATE POLICY audit_cross_pole_referrals_read ON public.audit_cross_pole_referrals FOR SELECT TO authenticated USING(
 test_account=public.intranet_is_test_mode()
 AND coalesce(public.is_intranet_staff(auth.uid()),false)
 AND (sent_by=auth.uid() OR coalesce(public.can_intranet_action('audit.missions','read'),false))
);

-- SECURITY INVOKER is deliberate: source row visibility must be verified under
-- the requesting collaborator's own shops/logistics_incidents RLS, never bypassed.
CREATE OR REPLACE FUNCTION public.transmit_cross_pole_audit_request(
 p_source_pole text,p_source_type text,p_source_id uuid,p_modality text,p_reason text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE r public.audit_cross_pole_referrals; visible_source boolean:=false;
BEGIN
 IF auth.uid() IS NULL OR NOT coalesce(public.is_intranet_staff(auth.uid()),false)
 THEN RAISE EXCEPTION 'audit_referral_forbidden' USING ERRCODE='42501'; END IF;
 IF p_source_id IS NULL OR p_modality NOT IN ('documentary','on_site','quality_control')
 OR p_modality IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 12 AND 1000
 THEN RAISE EXCEPTION 'audit_referral_invalid' USING ERRCODE='22023'; END IF;
 IF p_source_pole='marketplace' AND p_source_type='shop'
   AND coalesce(public.can_intranet_action('marketplace.stores','update'),false)
 THEN
   SELECT EXISTS(SELECT 1 FROM public.shops WHERE id=p_source_id AND status NOT IN ('closed')) INTO visible_source;
 ELSIF p_source_pole='ops' AND p_source_type='logistics_incident'
   AND coalesce(public.can_intranet_action('ops.incidents','update'),false)
 THEN
   SELECT EXISTS(SELECT 1 FROM public.logistics_incidents WHERE id=p_source_id
      AND status NOT IN ('closed','resolved')) INTO visible_source;
 ELSE
   RAISE EXCEPTION 'audit_referral_source_forbidden' USING ERRCODE='42501';
 END IF;
 IF NOT visible_source THEN RAISE EXCEPTION 'audit_referral_source_unavailable' USING ERRCODE='42501'; END IF;
 -- A second request never creates a duplicate. A concurrent race can fail with
 -- unique_violation and be retried; no silent overwrite or status change.
 SELECT * INTO r FROM public.audit_cross_pole_referrals WHERE
   test_account=public.intranet_is_test_mode()
   AND source_type=p_source_type AND source_id=p_source_id;
 IF FOUND THEN
   RETURN jsonb_build_object('id',r.id,'status',r.status,'already_transmitted',true);
 END IF;
 INSERT INTO public.audit_cross_pole_referrals(
   source_pole,source_type,source_id,audit_modality,reason,sent_by,test_account
 ) VALUES(p_source_pole,p_source_type,p_source_id,p_modality,btrim(p_reason),auth.uid(),public.intranet_is_test_mode())
 RETURNING * INTO r;
 RETURN jsonb_build_object('id',r.id,'status',r.status,'already_transmitted',false);
END;$$;
-- All writes are routed through the invoker RPC and its own validated source checks.
GRANT INSERT ON public.audit_cross_pole_referrals TO authenticated;
DROP POLICY IF EXISTS audit_cross_pole_referrals_insert ON public.audit_cross_pole_referrals;
CREATE POLICY audit_cross_pole_referrals_insert ON public.audit_cross_pole_referrals FOR INSERT TO authenticated WITH CHECK(
 sent_by=auth.uid() AND test_account=public.intranet_is_test_mode()
 AND status='received'
 AND coalesce(public.is_intranet_staff(auth.uid()),false)
 AND (
  (source_pole='marketplace' AND source_type='shop'
   AND coalesce(public.can_intranet_action('marketplace.stores','update'),false)
   AND EXISTS(SELECT 1 FROM public.shops s WHERE s.id=source_id AND s.status<>'closed'))
  OR
  (source_pole='ops' AND source_type='logistics_incident'
   AND coalesce(public.can_intranet_action('ops.incidents','update'),false)
   AND EXISTS(SELECT 1 FROM public.logistics_incidents i WHERE i.id=source_id AND i.status NOT IN('closed','resolved')))
 )
);
-- Prevent any client from overwriting immutable Audit handoffs.
REVOKE UPDATE,DELETE ON public.audit_cross_pole_referrals FROM authenticated;
REVOKE ALL ON FUNCTION public.transmit_cross_pole_audit_request(text,text,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transmit_cross_pole_audit_request(text,text,uuid,text,text) TO authenticated;
COMMENT ON TABLE public.audit_cross_pole_referrals IS 'Immutable referral inbox for Audit. Existing shop or logistics incident verified with caller RLS; no certification or automatic invoice.';
NOTIFY pgrst,'reload schema';
