-- Only authenticated callers may invoke the guarded document read RPCs.
-- Both RPCs enforce can_read_intranet_drive_document and the RH binding guard.
-- Do not expose unguarded helpers or privileged Drive mutations.
REVOKE ALL ON FUNCTION public.get_intranet_document_access(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.list_intranet_documents(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_intranet_document_access(uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.list_intranet_documents(text,text) TO authenticated,service_role;
