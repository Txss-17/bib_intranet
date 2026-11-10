import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../../drizzle/migrations/0102_supplier_audit_pole_handoff.sql',import.meta.url),'utf8');
const component=readFileSync(new URL('../../src/components/supplier/SupplierAuditWorkflow.tsx',import.meta.url),'utf8');
const hook=readFileSync(new URL('../../src/hooks/useSupplierAuditCases.ts',import.meta.url),'utf8');
const auditPage=readFileSync(new URL('../../src/pages/modules/audit/SupplierAudits.tsx',import.meta.url),'utf8');

test('an audit handoff is immutable, identified and authorized at the database',()=>{
  assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.supplier_audit_handoffs/);
  assert.match(sql,/case_id uuid NOT NULL UNIQUE/);
  assert.match(sql,/sent_by uuid NOT NULL/);
  assert.match(sql,/sent_at timestamptz NOT NULL/);
  assert.match(sql,/REVOKE ALL ON public\.supplier_audit_handoffs FROM PUBLIC,anon,authenticated/);
  assert.match(sql,/public\.can_intranet_action\('supplier\.suppliers','update'\)/);
  assert.match(sql,/public\.is_intranet_staff\(auth\.uid\(\)\)/);
  assert.match(sql,/v_case\.test_account IS DISTINCT FROM public\.intranet_is_test_mode\(\)/);
  assert.match(sql,/v_case\.revision <> p_expected_revision/);
  assert.match(sql,/RETURN jsonb_build_object\('case_id',v_handoff\.case_id/);
});
test('documentary, onsite and quality control flow through Audit',()=>{
  for (const modality of ['documentary','on_site','quality_control']) {
    assert.ok(sql.includes(modality));
    assert.ok(component.includes(modality));
  }
  assert.match(sql,/v_case\.kind='counter_audit' AND nullif\(btrim\(v_case\.incident_reference\)/);
  assert.match(component,/Transmettre au pôle Audit/);
  assert.match(component,/canTransmit/);
  assert.match(component,/handoffs\.isError/);
  assert.match(auditPage,/<SupplierAuditWorkflow auditInbox\s*\/>/);
  assert.match(hook,/transmit_supplier_audit_to_pole/);
});
test('formal handoff does not assert compliance, invoice or external transmission',()=>{
  assert.match(sql,/Does not create a new case, admit a product, issue an invoice/);
  assert.match(sql,/Historical cases without a handoff are NOT inferred/);
  assert.match(component,/sans attribuer de conformité, ni publier les documents/);
});
