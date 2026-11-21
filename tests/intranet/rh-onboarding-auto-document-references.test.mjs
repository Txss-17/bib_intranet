import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const refs = read('supabase/migrations/20261121121500_rh_onboarding_auto_document_references.sql');
const create = read('supabase/migrations/20261121122000_rh_onboarding_create_via_rpc.sql');
const hook = read('src/hooks/useHrOnboarding.ts');
const page = read('src/pages/modules/rh/Onboarding.tsx');

test('server allocates registry and per-file references once, without a Google Drive file claim', () => {
  assert.match(refs, /CREATE SEQUENCE IF NOT EXISTS public\.rh_onboarding_register_reference_seq/);
  assert.match(refs, /CREATE SEQUENCE IF NOT EXISTS public\.rh_onboarding_document_reference_seq/);
  assert.match(refs, /document_register_reference text/);
  assert.match(refs, /CREATE UNIQUE INDEX IF NOT EXISTS uq_rh_onboarding_document_register_reference/);
  assert.match(refs, /BEFORE INSERT OR UPDATE OF attached_documents, document_register_reference, request_kind/);
  assert.match(refs, /'BIB-RH-ONB-'/);
  assert.match(refs, /'BIB-RH-DOC-'/);
  assert.match(refs, /OLD\.document_register_reference/);
  assert.match(refs, /previous_item->>'document_reference'/);
  assert.match(refs, /item-'document_entry_id'-'document_reference'/);
  assert.match(refs, /rh_document_reference_entry_reused/);
  assert.match(refs, /UPDATE public\.hr_employee_requests r/);
  assert.doesNotMatch(refs, /INSERT INTO public\.intranet_drive_documents/);
  assert.match(refs, /REVOKE ALL ON FUNCTION public\.rh_assign_onboarding_document_references\(\)/);
});

test('authenticated create RPC whitelists inputs and journals reference generation atomically', () => {
  assert.match(create, /CREATE OR REPLACE FUNCTION public\.rh_create_onboarding_request\(p_payload jsonb\)/);
  assert.match(create, /can_intranet_action\('rh\.onboarding','create'\)/);
  assert.match(create, /test_account IS FALSE/);
  assert.match(create, /rh_onboarding_unexpected_payload_key/);
  assert.match(create, /public\.rh_position_catalog/);
  assert.match(create, /public\.access_roles/);
  assert.match(create, /'submitted','onboarding'/);
  assert.match(create, /INSERT INTO public\.hr_employee_request_events/);
  assert.match(create, /result\.document_register_reference/);
  assert.match(create, /REVOKE ALL ON FUNCTION public\.rh_create_onboarding_request\(jsonb\)/);
  assert.match(create, /GRANT EXECUTE ON FUNCTION public\.rh_create_onboarding_request\(jsonb\)/);
});

test('UI displays server-generated references and keeps reserved references distinct from file availability', () => {
  assert.match(hook, /'rh_create_onboarding_request' as any/);
  assert.doesNotMatch(hook, /\.insert\(normalizedPayload\)/);
  assert.match(hook, /document_register_reference\?: string \| null/);
  assert.match(hook, /document_reference\?: string/);
  assert.match(page, /Registre documentaire d’onboarding/);
  assert.match(page, /request\.document_register_reference/);
  assert.match(page, /doc\.document_reference/);
  assert.match(page, /Référence réservée — fichier non déposé/);
  assert.match(page, /aucun numéro à saisir|Aucune référence à saisir/i);
});
