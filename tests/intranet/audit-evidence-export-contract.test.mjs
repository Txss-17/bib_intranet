import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pdf = readFileSync(new URL('../../src/lib/auditEvidencePdf.ts', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../../src/components/supplier/SupplierAuditWorkflow.tsx', import.meta.url), 'utf8');

test('the audit export remains internal and never issues an invoice or payment', () => {
  assert.match(pdf, /NE CONSTITUE PAS UNE FACTURE/);
  assert.match(pdf, /COPIE DE SUIVI INTERNE/);
  assert.doesNotMatch(pdf, /supabase\.|intranetRpc\(|fetch\(/);
});
test('export requires a linked invoice, approved report and evidence', () => {
  assert.match(pdf, /!c\.report \|\| !c\.invoice \|\| !c\.report_approved_by/);
  assert.match(pdf, /!c\.report\.evidence_reference\.trim\(\)/);
  assert.match(ui, /downloadAuditEvidencePdf\(c\)/);
  assert.match(ui, /disabled=\{!c\.invoice \|\| !c\.report \|\| !c\.report_approved_by/);
});
test('PDF includes actual scoped product references, findings and distinct decisions', () => {
  assert.match(pdf, /c\.scope\.join/);
  assert.match(pdf, /c\.report\.findings/);
  assert.match(pdf, /c\.report\.conclusion/);
  assert.match(pdf, /c\.reference_decisions/);
  assert.match(pdf, /if \(y \+ 5 > 276\) newPage\(\)/);
});
