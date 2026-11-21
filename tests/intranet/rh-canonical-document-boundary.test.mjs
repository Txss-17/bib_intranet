import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const migration = readFileSync(
  new URL('../../supabase/migrations/20261121092000_rh_canonical_document_references.sql', import.meta.url),
  'utf8',
);
const mutation = readFileSync(new URL('../../src/lib/hrEmployeeMutations.ts', import.meta.url), 'utf8');
const employeeFiles = readFileSync(new URL('../../src/pages/modules/rh/EmployeeFiles.tsx', import.meta.url), 'utf8');
const onboarding = readFileSync(new URL('../../src/pages/modules/rh/Onboarding.tsx', import.meta.url), 'utf8');

test('database rejects unmanaged URLs even for requests bypassing React', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.rh_guard_canonical_document_links\(\)/);
  assert.match(migration, /BEFORE INSERT OR UPDATE OF document_url/);
  assert.match(migration, /BEFORE INSERT OR UPDATE OF attached_documents/);
  assert.match(migration, /rh_managed_document_reference_required/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.rh_guard_canonical_document_links\(\)/);
  assert.match(migration, /FROM PUBLIC, anon, authenticated/);
  assert.ok(!migration.includes("item->>'document_url' !~ '^https://"));
  assert.ok(migration.includes("item->>'document_url' !~ '^/documents[?]document="));
});

test('RH frontend stores only origin-independent BIB-managed references', () => {
  assert.match(mutation, /export function normalizeHrManagedDocumentUrl\(/);
  assert.match(mutation, /url\.origin !== expectedOrigin/);
  assert.match(mutation, /document_url:managedUrl/);
  assert.match(employeeFiles, /document_url: controlledDocumentUrl/);
  assert.match(onboarding, /normalizeHrManagedDocumentUrl\(enteredUrl\)/);
  assert.match(onboarding, /ManagedDocumentLink url=\{doc\.document_url\}/);
  assert.match(onboarding, /Ancien lien externe : réimport dans Documents BIB requis/);
  assert.doesNotMatch(onboarding, /href=\{doc\.document_url\}/);
  assert.match(onboarding, /independentCompletionReviewer/);
  assert.match(onboarding, /Une autre personne habilitée doit effectuer la revue indépendante/);
  assert.doesNotMatch(onboarding, /new URL\(enteredUrl, window\.location\.origin\)\.href/);
});
