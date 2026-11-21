import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {test} from 'node:test';
const s=readFileSync(new URL('../../ops/release/rh-document-employee-immutability-20261121.sql',import.meta.url),'utf8');
test('a personnel document is permanently bound to one employee identity',()=>{
 assert.ok(s.includes('NEW.employee_id IS DISTINCT FROM OLD.employee_id'));
 assert.ok(s.includes('rh_document_employee_immutable'));
 assert.ok(s.includes('BEFORE UPDATE OF employee_id'));
 assert.ok(s.includes('SECURITY INVOKER'));
 assert.ok(s.includes('REVOKE ALL ON FUNCTION public.rh_guard_document_employee_identity() FROM PUBLIC,anon,authenticated'));
});
