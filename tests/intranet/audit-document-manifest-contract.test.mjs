import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../../drizzle/migrations/0093_supplier_audit_document_manifest.sql', import.meta.url), 'utf8');
const journal = readFileSync(new URL('../../drizzle/migrations/meta/_journal.json', import.meta.url), 'utf8');

test('manifest migration is in migration journal', () => {
  assert.match(journal, /0093_supplier_audit_document_manifest/);
});
test('manifest is immutable to authenticated clients, separated by test tenant', () => {
  assert.match(sql, /REVOKE ALL ON public\.supplier_audit_document_manifest FROM PUBLIC,anon,authenticated/);
  assert.match(sql, /GRANT SELECT ON public\.supplier_audit_document_manifest TO authenticated/);
  assert.doesNotMatch(sql, /GRANT (INSERT|UPDATE|DELETE) ON public\.supplier_audit_document_manifest TO authenticated/);
  assert.match(sql, /supplier_audit_document_manifest\.test_account/);
  assert.match(sql, /public\.intranet_is_test_mode\(\)/);
});
test('writing a manifest requires verified source and role, not just a client checkbox', () => {
  assert.match(sql, /public\.can_intranet_action\('finance\.billing','validate'\)/);
  assert.match(sql, /public\.can_intranet_action\('audit\.supplier','validate'\)/);
  assert.match(sql, /c\.report_approved_by IS NULL/);
  assert.match(sql, /c\.quote_state<>'accepted'/);
  assert.match(sql, /v_doc IS DISTINCT FROM btrim\(c\.invoice->>'document_reference'\)/);
  assert.match(sql, /v_doc IS DISTINCT FROM btrim\(c\.report->>'evidence_reference'\)/);
});
test('document identity and content digest cannot be duplicated silently', () => {
  assert.match(sql, /UNIQUE\(test_account,document_reference\)/);
  assert.match(sql, /UNIQUE\(case_id,document_kind,sha256_hex\)/);
  assert.match(sql, /sha256_hex ~ '\^\[0-9a-f\]\{64\}\$'/);
});
test('manifest never issues legal invoices or stores PDF bytes', () => {
  assert.match(sql, /not a PDF store and not a fiscal invoicing service/);
  assert.doesNotMatch(sql, /CREATE POLICY .* FOR (INSERT|UPDATE|DELETE) TO authenticated/);
});
