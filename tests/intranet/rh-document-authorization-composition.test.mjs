import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const originalGuard = read('ops/release/rh-linked-drive-document-authorization-20261121.sql');
const departureGuard = read('supabase/migrations/20261121182000_rh_departure_revoke_bib_review_shares.sql');
const canonicalRead = read('drizzle/migrations/0040_intranet_drive.sql');
const driveEdge = read('supabase/functions/intranet-drive/index.ts');

test('RH document guard is an additional restriction, never a standalone file permission', () => {
  // A document without an RH binding must still be assessed using normal BIB document rights.
  assert.match(departureGuard, /AND NOT EXISTS\s*\(\s*SELECT 1 FROM public\.rh_drive_document_bindings/);
  assert.match(departureGuard, /AND NOT public\.rh_departure_access_blocked\(\(SELECT auth\.uid\(\)\)\)/);
  assert.match(originalGuard, /public\.can_intranet_action\('app\.documents','read'\)/);
  assert.match(originalGuard, /AND public\.rh_may_read_linked_drive_document\(p\.id\);/);
  assert.match(originalGuard, /public\.can_intranet_action\(p\.page_id,'read'\)/);
});

test('opening BIB Drive file checks existence and canonical permission before returning bytes reference', () => {
  assert.match(canonicalRead, /IF NOT FOUND OR NOT public\.can_read_intranet_drive_document\(d\) THEN RAISE EXCEPTION 'document_forbidden'/);
  assert.match(driveEdge, /call<Document>\(caller, 'get_intranet_document_access'/);
  assert.doesNotMatch(driveEdge, /rh_may_read_linked_drive_document/);
});

test('the RH binding table cannot be read or updated directly by browser roles', () => {
  assert.match(originalGuard, /REVOKE ALL ON TABLE public\.rh_drive_document_bindings FROM PUBLIC,anon,authenticated/);
  assert.match(originalGuard, /GRANT SELECT,INSERT ON TABLE public\.rh_drive_document_bindings TO service_role/);
  assert.doesNotMatch(originalGuard, /GRANT (?:SELECT|UPDATE|ALL) ON TABLE public\.rh_drive_document_bindings TO authenticated/);
});
