import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = p => readFileSync(new URL('../../'+p, import.meta.url), 'utf8');

const sql = read('supabase/migrations/20261121123000_rh_employee_document_reference_propagation.sql');
const provision = read('supabase/functions/provision-employee-account/index.ts');
const files = read('src/pages/modules/rh/EmployeeFiles.tsx');

test('employee document register inherits validated onboarding references or allocates manual reference',()=>{
  assert.match(sql, /ADD COLUMN IF NOT EXISTS document_reference text/);
  assert.match(sql, /onboarding_request_id uuid/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS uq_rh_employee_documents_reference/);
  assert.match(sql, /document_reference'=NEW\.document_reference/);
  assert.match(sql, /NEW\.source='onboarding'/);
  assert.match(sql, /rh_onboarding_document_reference_mismatch/);
  assert.match(sql, /NEW\.document_reference := OLD\.document_reference/);
  assert.match(sql, /nextval\('public\.rh_onboarding_document_reference_seq'/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.rh_assign_employee_document_reference\(\)/);
  assert.doesNotMatch(sql, /INSERT INTO public\.intranet_drive_documents/);
});

test('provisioner forwards the numbered reference from the onboarding source and reconciles by reference',()=>{
  assert.match(provision, /document_reference\?: string \| null/);
  assert.match(provision, /select\('name,document_reference'\)/);
  assert.match(provision, /existingRefs/);
  assert.match(provision, /onboarding_request_id: requestId/);
  assert.match(provision, /document_reference: d\.document_reference \?\? null/);
  assert.match(provision, /docsError\) return json/);
});

test('RH employee file UI displays immutable reference and onboarding provenance',()=>{
  assert.match(files, /document_reference: string \| null/);
  assert.match(files, /onboarding_request_id: string \| null/);
  assert.match(files, /documentSourceLabels: Record<DocumentSource/);
  assert.match(files, /onboarding: 'Onboarding RH'/);
  assert.match(files, /document\.document_reference/);
  assert.match(files, /selectedDocument\.document_reference/);
  assert.match(files, /Pièce liée au dossier d’onboarding d’origine/);
});
