import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(
  new URL('../../src/pages/modules/rh/EmployeeFiles.tsx', import.meta.url),
  'utf8',
);

test('RH employee files reject unmanageable external document links before insertion', () => {
  assert.ok(source.includes('const controlledDocumentUrl = form.document_url.trim();'));
  assert.ok(source.includes('if (controlledDocumentUrl && !managedDocumentId(controlledDocumentUrl))'));
  assert.ok(source.includes('controlledDocumentUrl || null'));
  assert.ok(source.indexOf('if (controlledDocumentUrl && !managedDocumentId(controlledDocumentUrl))') <
    source.indexOf(".from('rh_employee_documents')\n        .insert("));
});

test('RH employee file consultation uses BIB controlled document opening only', () => {
  assert.ok(source.includes('openManagedDocument(document.document_url)'));
  assert.ok(source.includes('openManagedDocument(selectedDocument.document_url)'));
  assert.ok(!source.includes('href={document.document_url}'));
  assert.ok(!source.includes('href={selectedDocument.document_url}'));
});
