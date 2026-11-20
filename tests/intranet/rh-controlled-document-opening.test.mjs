import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source=readFileSync(new URL('../../src/pages/modules/rh/EmployeeFiles.tsx',import.meta.url),'utf8');
test('all RH employee dossier links open through controlled BIB document route',()=>{
 assert.ok(source.includes("import { managedDocumentId, openManagedDocument } from '@/lib/driveDocuments'"));
 assert.ok(source.includes('openManagedDocument(document.document_url)'));
 assert.ok(source.includes('openManagedDocument(selectedDocument.document_url)'));
 assert.ok(source.includes('disabled={!managedDocumentId(document.document_url)}'));
 assert.ok(source.includes('disabled={!managedDocumentId(selectedDocument.document_url)}'));
 assert.ok(!/href=\{\s*(document|selectedDocument)\.document_url\s*\}/.test(source));
 assert.ok(source.includes('importer dans Drive BIB'));
});
