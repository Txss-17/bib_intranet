-- Confidential payroll documents: explicit recipient or narrowly authorized payroll staff.
-- A salary processing record is NOT a payslip; payroll documents are stored only
-- as references in the BIB document environment with separate Drive ACLs.
ALTER TABLE public.rh_employee_documents
 DROP CONSTRAINT IF EXISTS rh_employee_documents_type_check;
ALTER TABLE public.rh_employee_documents
 ADD CONSTRAINT rh_employee_documents_type_check CHECK (
   document_type IN (
     'contract','charter','policy','payroll','regulatory',
     'identity','diploma','administrative','medical',
     'training','evaluation','disciplinary','other'
   )
 );
CREATE INDEX IF NOT EXISTS idx_rh_employee_documents_payroll_employee_date
 ON public.rh_employee_documents(employee_id,document_date DESC)
 WHERE document_type='payroll';

CREATE OR REPLACE FUNCTION public.can_read_bib_payslip(p_employee_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp
AS $$
 SELECT p_employee_id IS NOT NULL AND auth.uid() IS NOT NULL
 AND EXISTS(
   SELECT 1 FROM public.profiles recipient
   JOIN public.profiles actor ON actor.id=auth.uid()
   WHERE recipient.id=p_employee_id
     AND recipient.app_origin='connect'
     AND actor.app_origin='connect'
     AND coalesce(recipient.test_account,false)=false
     AND coalesce(actor.test_account,false)=false
     AND (
       p_employee_id=auth.uid()
       OR public.is_canonical_bib_ceo(auth.uid())
       OR (
         actor.hr_status='active'
         AND 'rh'=ANY(coalesce(actor.poles::text[],'{}'::text[]))
         AND public.can_intranet_action('rh.files','update')
         AND public.can_intranet_action('finance.salaries','read')
       )
     )
 )
$$;
REVOKE ALL ON FUNCTION public.can_read_bib_payslip(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_read_bib_payslip(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_bib_payslip(p_employee_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp
AS $$
 SELECT public.can_read_bib_payslip(p_employee_id) AND
   (
     public.is_canonical_bib_ceo(auth.uid())
     OR (
       public.has_any_pole(auth.uid(),ARRAY['rh'])
       AND public.can_intranet_action('rh.files','update')
       AND public.can_intranet_action('finance.salaries','update')
     )
   )
$$;
REVOKE ALL ON FUNCTION public.can_manage_bib_payslip(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_bib_payslip(uuid) TO authenticated;

ALTER TABLE public.rh_employee_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bib_payslip_private_read_20261031 ON public.rh_employee_documents;
CREATE POLICY bib_payslip_private_read_20261031 ON public.rh_employee_documents
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING (document_type <> 'payroll' OR public.can_read_bib_payslip(employee_id));

DROP POLICY IF EXISTS bib_payslip_private_insert_20261031 ON public.rh_employee_documents;
CREATE POLICY bib_payslip_private_insert_20261031 ON public.rh_employee_documents
 AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (document_type <> 'payroll' OR public.can_manage_bib_payslip(employee_id));

DROP POLICY IF EXISTS bib_payslip_private_update_20261031 ON public.rh_employee_documents;
CREATE POLICY bib_payslip_private_update_20261031 ON public.rh_employee_documents
 AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (document_type <> 'payroll' OR public.can_manage_bib_payslip(employee_id))
 WITH CHECK (document_type <> 'payroll' OR public.can_manage_bib_payslip(employee_id));

DROP POLICY IF EXISTS bib_payslip_private_delete_20261031 ON public.rh_employee_documents;
CREATE POLICY bib_payslip_private_delete_20261031 ON public.rh_employee_documents
 AS RESTRICTIVE FOR DELETE TO authenticated
 USING (document_type <> 'payroll' OR public.can_manage_bib_payslip(employee_id));

-- Prevent declassification by changing document_type=payroll into 'other'
-- or reassigning the employee while editing an existing payroll record.
CREATE OR REPLACE FUNCTION public.guard_bib_payslip_document_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF OLD.document_type='payroll' AND
   (NEW.document_type IS DISTINCT FROM OLD.document_type
    OR NEW.employee_id IS DISTINCT FROM OLD.employee_id)
 THEN RAISE EXCEPTION 'A payslip recipient and classification cannot be changed' USING ERRCODE='42501';END IF;
 RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS guard_bib_payslip_document_update ON public.rh_employee_documents;
CREATE TRIGGER guard_bib_payslip_document_update
 BEFORE UPDATE ON public.rh_employee_documents
 FOR EACH ROW EXECUTE FUNCTION public.guard_bib_payslip_document_update();
NOTIFY pgrst,'reload schema';
