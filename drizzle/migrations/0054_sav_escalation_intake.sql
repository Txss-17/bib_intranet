-- Protected, idempotent intake of insured SAV escalations from BIB Platform.
-- No direct seller legal liability transfer, payment or refund occurs here.
-- Requires 0039 (page permissions), 0044 (identity/test isolation), 0052.
BEGIN;
CREATE TABLE public.sav_escalation_queue (
 issue_id uuid PRIMARY KEY,
 platform_order_id uuid NOT NULL,
 platform_boutique_id uuid NOT NULL,
 platform_merchant_id uuid NOT NULL,
 due_at timestamptz NOT NULL,
 escalated_at timestamptz NOT NULL,
 environment text NOT NULL CHECK(environment IN('sandbox','live')),
 reason text NOT NULL DEFAULT 'merchant_silence_48h' CHECK(reason='merchant_silence_48h'),
 status text NOT NULL DEFAULT 'awaiting_intake' CHECK(status IN('awaiting_intake','acknowledged','closed')),
 assigned_to uuid REFERENCES public.profiles(id),
 acknowledged_at timestamptz,
 closed_at timestamptz,
 resolution_note text,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT sav_intake_dates CHECK(due_at<=escalated_at),
 CONSTRAINT sav_intake_status_consistency CHECK (
   (status='awaiting_intake' AND assigned_to IS NULL AND acknowledged_at IS NULL AND closed_at IS NULL)
   OR (status='acknowledged' AND assigned_to IS NOT NULL AND acknowledged_at IS NOT NULL AND closed_at IS NULL)
   OR (status='closed' AND assigned_to IS NOT NULL AND acknowledged_at IS NOT NULL AND closed_at IS NOT NULL
       AND length(btrim(coalesce(resolution_note,'')))>=10)
 )
);
CREATE INDEX sav_intake_status ON public.sav_escalation_queue(status,escalated_at,issue_id);
CREATE TABLE public.sav_escalation_queue_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 issue_id uuid NOT NULL REFERENCES public.sav_escalation_queue(issue_id) ON DELETE RESTRICT,
 actor_id uuid NOT NULL REFERENCES public.profiles(id),
 action text NOT NULL CHECK(action IN('acknowledged','closed')),
 note text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sav_intake_events ON public.sav_escalation_queue_events(issue_id,created_at);
ALTER TABLE public.sav_escalation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sav_escalation_queue_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sav_escalation_queue,public.sav_escalation_queue_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.sav_escalation_queue,public.sav_escalation_queue_events TO authenticated;
GRANT ALL ON public.sav_escalation_queue,public.sav_escalation_queue_events TO service_role;

CREATE POLICY sav_intake_staff_read ON public.sav_escalation_queue
 FOR SELECT TO authenticated USING (
   public.can_intranet_action('support.escalations','read')
   AND (environment='sandbox')=public.intranet_is_test_mode()
 );
CREATE POLICY sav_intake_events_staff_read ON public.sav_escalation_queue_events
 FOR SELECT TO authenticated USING (
   EXISTS(SELECT 1 FROM public.sav_escalation_queue q
          WHERE q.issue_id=sav_escalation_queue_events.issue_id)
 );

CREATE OR REPLACE FUNCTION public.acknowledge_sav_escalation(p_issue_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $claim$
DECLARE actor uuid:=auth.uid(); current public.sav_escalation_queue%ROWTYPE;
BEGIN
 IF actor IS NULL OR NOT public.can_intranet_action('support.escalations','update')
 THEN RAISE EXCEPTION 'sav_intake_not_authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO current FROM public.sav_escalation_queue WHERE issue_id=p_issue_id FOR UPDATE;
 IF NOT FOUND OR (current.environment='sandbox') IS DISTINCT FROM public.intranet_is_test_mode()
 THEN RAISE EXCEPTION 'sav_case_not_accessible' USING ERRCODE='42501'; END IF;
 IF current.status='acknowledged' AND current.assigned_to=actor THEN
   RETURN jsonb_build_object('issue_id',current.issue_id,'status',current.status,'assigned_to',actor);
 END IF;
 IF current.status<>'awaiting_intake' THEN
   RAISE EXCEPTION 'sav_case_already_assigned' USING ERRCODE='55000';
 END IF;
 UPDATE public.sav_escalation_queue
 SET status='acknowledged',assigned_to=actor,acknowledged_at=now()
 WHERE issue_id=p_issue_id;
 INSERT INTO public.sav_escalation_queue_events(issue_id,actor_id,action)
 VALUES(p_issue_id,actor,'acknowledged');
 RETURN jsonb_build_object('issue_id',p_issue_id,'status','acknowledged','assigned_to',actor);
END;
$claim$;

CREATE OR REPLACE FUNCTION public.close_sav_escalation(p_issue_id uuid,p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $close$
DECLARE actor uuid:=auth.uid();current public.sav_escalation_queue%ROWTYPE;normalized text:=nullif(btrim(p_note),'');
BEGIN
 IF actor IS NULL OR NOT public.can_intranet_action('support.escalations','update')
 THEN RAISE EXCEPTION 'sav_intake_not_authorized' USING ERRCODE='42501'; END IF;
 IF normalized IS NULL OR length(normalized)<10 OR length(normalized)>3000
 THEN RAISE EXCEPTION 'sav_resolution_explanation_required' USING ERRCODE='22023'; END IF;
 SELECT * INTO current FROM public.sav_escalation_queue WHERE issue_id=p_issue_id FOR UPDATE;
 IF NOT FOUND OR (current.environment='sandbox') IS DISTINCT FROM public.intranet_is_test_mode()
 THEN RAISE EXCEPTION 'sav_case_not_accessible' USING ERRCODE='42501'; END IF;
 IF current.status<>'acknowledged' OR current.assigned_to<>actor
 THEN RAISE EXCEPTION 'sav_case_not_assigned_to_actor' USING ERRCODE='42501'; END IF;
 UPDATE public.sav_escalation_queue SET status='closed',closed_at=now(),resolution_note=normalized
 WHERE issue_id=p_issue_id;
 INSERT INTO public.sav_escalation_queue_events(issue_id,actor_id,action,note)
 VALUES(p_issue_id,actor,'closed',normalized);
 RETURN jsonb_build_object('issue_id',p_issue_id,'status','closed');
END;
$close$;
REVOKE ALL ON FUNCTION public.acknowledge_sav_escalation(uuid),public.close_sav_escalation(uuid,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.acknowledge_sav_escalation(uuid),public.close_sav_escalation(uuid,text)
 TO authenticated,service_role;
COMMIT;
