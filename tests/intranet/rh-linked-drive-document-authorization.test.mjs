import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const sql=readFileSync(new URL('../../ops/release/rh-linked-drive-document-authorization-20261121.sql',import.meta.url),'utf8');

test('managed RH documents are persistently bound to the employee they concern',()=>{
 assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.rh_drive_document_bindings'));
 assert.ok(sql.includes('ON DELETE SET NULL'));
 assert.ok(sql.includes('AFTER INSERT OR UPDATE OF document_url,employee_id'));
 assert.ok(sql.includes('rh_extract_managed_drive_id'));
 assert.ok(sql.includes('rh_managed_drive_document_not_found'));
 assert.ok(sql.includes('ON CONFLICT(document_id,employee_id)'));
 assert.ok(!sql.includes('DROP TABLE public.rh_drive_document_bindings'));
});
test('the existing BIB Drive read permission additionally checks RH portfolio ownership',()=>{
 assert.ok(sql.includes('public.can_intranet_action(\'app.documents\',\'read\')'));
 assert.ok(sql.includes('public.can_read_intranet_record(r)'));
 assert.ok(sql.includes('public.can_read_quality_alert(a)'));
 assert.ok(sql.includes('public.can_read_ops_anomaly(a)'));
 assert.ok(sql.includes('AND public.rh_may_read_linked_drive_document(p.id)'));
 assert.ok(sql.includes("m.entity_kind='employee'"));
 assert.ok(sql.includes("p.owner_id=(SELECT auth.uid())"));
 assert.ok(sql.includes("m.ended_at IS NULL"));
 assert.ok(sql.includes("p.status='active'"));
 assert.ok(sql.includes('public.is_canonical_bib_ceo'));
 assert.ok(sql.includes('b.employee_id=(SELECT auth.uid())'));
});
test('no client bypass of the binding table is authorized',()=>{
 assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'));
 assert.ok(sql.includes('REVOKE ALL ON TABLE public.rh_drive_document_bindings FROM PUBLIC,anon,authenticated'));
 assert.ok(!/GRANT (?:ALL|SELECT) ON TABLE public\.rh_drive_document_bindings TO authenticated/.test(sql));
});

test('the document read RPCs are only executable by signed-in accounts',()=>{
 const grants=readFileSync(new URL('../../ops/release/rh-guarded-drive-read-rpc-execute-20261121.sql',import.meta.url),'utf8');
 assert.ok(grants.includes('REVOKE ALL ON FUNCTION public.get_intranet_document_access(uuid) FROM PUBLIC,anon'));
 assert.ok(grants.includes('REVOKE ALL ON FUNCTION public.list_intranet_documents(text,text) FROM PUBLIC,anon'));
 assert.ok(grants.includes('GRANT EXECUTE ON FUNCTION public.get_intranet_document_access(uuid) TO authenticated,service_role'));
 assert.ok(grants.includes('GRANT EXECUTE ON FUNCTION public.list_intranet_documents(text,text) TO authenticated,service_role'));
 assert.ok(!grants.includes('GRANT ALL'));
});

test('a transferred RH file can be opened by its new portfolio owner, not an unrelated manager',()=>{
 const handoff=readFileSync(new URL('../../ops/release/rh-linked-drive-owner-handoff-20261121.sql',import.meta.url),'utf8');
 assert.ok(handoff.includes('public.can_intranet_action(p.page_id,\'read\')'));
 assert.ok(handoff.includes('EXISTS (SELECT 1 FROM public.rh_drive_document_bindings b'));
 assert.ok(handoff.includes('public.rh_may_read_linked_drive_document(p.id)'));
 assert.ok(handoff.includes('AND public.rh_may_read_linked_drive_document(p.id)'));
});

test('linking a Drive file requires the RH actor to own the file or be an explicit recipient',()=>{
 const source=readFileSync(new URL('../../ops/release/rh-drive-document-link-ownership-20261121.sql',import.meta.url),'utf8');
 assert.ok(source.includes('public.is_canonical_bib_ceo((SELECT auth.uid()))'));
 assert.ok(source.includes('d.owner_id=(SELECT auth.uid())'));
 assert.ok(source.includes('public.is_intranet_document_recipient(doc_id)'));
 assert.ok(source.includes('rh_managed_drive_source_not_readable'));
 assert.ok(!source.includes('public.can_read_intranet_drive_document(d)'));
});
test('the RH records editor receives only missing write grants, with portfolio RLS already enforced',()=>{
 const source=readFileSync(new URL('../../ops/release/rh-document-metadata-managed-writes-20261121.sql',import.meta.url),'utf8');
 assert.ok(source.includes('GRANT INSERT,UPDATE,DELETE ON TABLE public.rh_employee_documents TO authenticated'));
 assert.ok(!source.includes('GRANT ALL'));
 assert.ok(!source.includes('GRANT SELECT'));
});
