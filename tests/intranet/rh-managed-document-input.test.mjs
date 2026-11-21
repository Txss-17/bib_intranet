import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(
  new URL('../../src/pages/modules/rh/EmployeeFiles.tsx', import.meta.url),
  'utf8',
);

test('RH employee files reject unmanageable external document links before insertion', () => {
  assert.ok(source.includes('const enteredDocumentUrl = form.document_url.trim();'));
  assert.ok(source.includes('if (enteredDocumentUrl && !controlledDocumentUrl)'));
  assert.ok(source.includes('document_url: controlledDocumentUrl,'));
  assert.ok(source.indexOf('if (enteredDocumentUrl && !controlledDocumentUrl)') <
    source.indexOf(".from('rh_employee_documents')\n        .insert("));
});

test('RH employee file consultation uses BIB controlled document opening only', () => {
  assert.ok(source.includes('openManagedDocument(document.document_url)'));
  assert.ok(source.includes('openManagedDocument(selectedDocument.document_url)'));
  assert.ok(!source.includes('href={document.document_url}'));
  assert.ok(!source.includes('href={selectedDocument.document_url}'));
});

test('onboarding / mobility documents allow only managed BIB references', () => {
  const onboarding = readFileSync(
    new URL('../../src/pages/modules/rh/Onboarding.tsx', import.meta.url),
    'utf8',
  );
  assert.ok(onboarding.includes("import { normalizeHrManagedDocumentUrl } from '@/lib/hrEmployeeMutations'"));
  assert.ok(onboarding.includes('if (enteredUrl && !managedUrl)'));
  assert.ok(onboarding.includes('normalizeHrManagedDocumentUrl(enteredUrl)'));
  assert.ok(onboarding.includes('document_url: managedUrl'));
  assert.ok(onboarding.includes('Les liens Drive ou externes directs ne sont pas autorisés.'));
});
