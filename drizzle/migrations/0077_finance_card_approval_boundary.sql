-- Finance: prevent self-approval, non-atomic client audit logs and repeated decisions.
-- The UI is not an authorization boundary; every decision is verified in PostgreSQL.
CREATE OR REPLACE FUNCTION public.guard_finance_card_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF NEW.approval_status IS NOT DISTINCT FROM OLD.approval_status THEN RETURN NEW; END IF;
 IF coalesce(auth.role(),'')='service_role' THEN RETURN NEW; END IF;
 IF actor IS NULL
   OR NOT coalesce(public.can_intranet_action('finance.cards','validate'),false)
   OR OLD.approval_status<>'pending'
   OR NEW.approval_status NOT IN ('approved','rejected')
   OR OLD.user_id=actor
 THEN RAISE EXCEPTION 'Finance card approval forbidden or already decided' USING ERRCODE='42501'; END IF;
 IF (OLD.card_id,OLD.user_id,OLD.amount,OLD.currency,OLD.merchant,OLD.transaction_date)
   IS DISTINCT FROM
    (NEW.card_id,NEW.user_id,NEW.amount,NEW.currency,NEW.merchant,NEW.transaction_date)
 THEN RAISE EXCEPTION 'Cannot change transaction amounts or ownership while approving' USING ERRCODE='42501'; END IF;
 IF NEW.approval_status='rejected' AND length(btrim(coalesce(NEW.rejection_reason,'')))=0
 THEN RAISE EXCEPTION 'Rejection reason is required' USING ERRCODE='22023'; END IF;
 IF NEW.approval_status='approved' THEN
   NEW.approved_by:=actor; NEW.approved_at:=now();
   NEW.rejected_by:=null; NEW.rejected_at:=null; NEW.rejection_reason:=null;
 ELSE
   NEW.rejected_by:=actor; NEW.rejected_at:=now();
   NEW.approved_by:=null; NEW.approved_at:=null;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_finance_card_decision ON public.corporate_card_transactions;
CREATE TRIGGER guard_finance_card_decision BEFORE UPDATE ON public.corporate_card_transactions
 FOR EACH ROW EXECUTE FUNCTION public.guard_finance_card_decision();

CREATE OR REPLACE FUNCTION public.audit_finance_card_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.approval_status IS DISTINCT FROM OLD.approval_status AND NEW.approval_status IN ('approved','rejected') THEN
   INSERT INTO public.approval_history(entity_type,entity_id,action,actor_id,comment)
   VALUES('card_transaction',NEW.id,NEW.approval_status,
     CASE WHEN NEW.approval_status='approved' THEN NEW.approved_by ELSE NEW.rejected_by END,
     CASE WHEN NEW.approval_status='rejected' THEN NEW.rejection_reason ELSE NULL END);
 END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS audit_finance_card_decision ON public.corporate_card_transactions;
CREATE TRIGGER audit_finance_card_decision AFTER UPDATE ON public.corporate_card_transactions
 FOR EACH ROW EXECUTE FUNCTION public.audit_finance_card_decision();
NOTIFY pgrst,'reload schema';
