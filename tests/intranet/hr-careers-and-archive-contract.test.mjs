import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const recruitment = readFileSync(new URL('../../src/pages/modules/rh/Recruitment.tsx', import.meta.url),'utf8');
const inbox = readFileSync(new URL('../../src/components/rh/TalentPlatformInbox.tsx', import.meta.url),'utf8');
const sql = readFileSync(new URL('../../drizzle/migrations/0101_portfolio_archival_lifecycle.sql', import.meta.url),'utf8');

test('recruitment explicitly points at the Careers public entry', () => {
  assert.match(recruitment, /page Carrières de BIB Platform/);
  assert.match(recruitment, /\/carrieres/);
  assert.match(inbox, /Réception Carrières BIB/);
});

test('legacy application source contract stays intact for historical records', () => {
  assert.match(inbox, /data\?\.source !== 'bib_talent'/);
  assert.match(recruitment, /value: 'bib_talent'/);
  assert.match(recruitment, /Aucun compte Intranet, contrat ni accès opérationnel/);
});

test('portfolio archive migration uses valid paired PLpgSQL dollar quoting', () => {
  assert.doesNotMatch(sql, /AS \$\n/);
  assert.doesNotMatch(sql, /END;\$;/);
  assert.match(sql, /FUNCTION public\.bib_archive_supplier_portfolio/);
  assert.match(sql, /FUNCTION public\.bib_guard_supplier_archive_assignment/);
});
