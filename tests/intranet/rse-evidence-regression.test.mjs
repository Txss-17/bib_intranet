import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');

test('RSE evidence gates queries, and opens the same record in the validation workspace', () => {
 const page = read('src/components/rse/RseEvidencePage.tsx');
 assert.match(page, /useIntranetRecords\(d\.id, search, 'all', offset, allowed\)/);
 assert.match(page, /next\.set\('record', id\)/);
 assert.match(page, /setTab\('decisions'\)/);
 assert.match(page, /<Tabs value=\{tab\} onValueChange=\{setTab\}>/);
 assert.match(page, /onClick=\{\(\) => openRecord\(row\.id\)\}/);
});

test('RSE measures are never described as externally certified and pagination is error-safe', () => {
 const page = read('src/components/rse/RseEvidencePage.tsx');
 assert.match(page, /Dossier validé en interne \(non certifié\)/);
 assert.match(page, /Donnée déclarée, non validée/);
 assert.match(page, /query\.isFetching \|\| query\.isError/);
});
