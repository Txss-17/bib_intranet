-- After migration, grant the current RH portfolio owner read access to a linked file
-- even when the Drive import was owned by an earlier case manager.
CREATE OR REPLACE FUNCTION public.can_read_intranet_drive_document(p public.intranet_drive_documents)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public','pg_temp'
AS $function$
 SELECT public.can_intranet_action('app.documents','read')
 AND EXISTS (
    SELECT 1 FROM public.profiles me
    WHERE me.id=auth.uid() AND coalesce(me.test_account,false)=p.test_account
 )
 AND (
   (public.can_intranet_action(p.page_id,'read')
     AND (p.owner_id=auth.uid() OR p.classification='internal'
          OR public.can_intranet_action(p.page_id,'validate')
          OR (EXISTS (SELECT 1 FROM public.rh_drive_document_bindings b
                      WHERE b.document_id=p.id)
              AND public.rh_may_read_linked_drive_document(p.id))))
   OR public.is_intranet_document_recipient(p.id)
   OR EXISTS (SELECT 1 FROM public.intranet_records r
     WHERE p.id=ANY(r.document_ids) AND public.can_read_intranet_record(r))
   OR EXISTS (SELECT 1 FROM public.quality_alerts a
     WHERE p.id=ANY(a.document_ids) AND public.can_read_quality_alert(a))
   OR EXISTS (SELECT 1 FROM public.anomalies a
     WHERE p.id=ANY(a.document_ids) AND public.can_read_ops_anomaly(a))
 )
 AND public.rh_may_read_linked_drive_document(p.id);
$function$;
