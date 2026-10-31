import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('audit reports access checks precede fetching and a report opens its validation record', () => {
  const page = read('src/pages/modules/audit/Reports.tsx');
  assert.match(page, /useIntranetRecords\('audit\.reports', search, 'all', offset, allowed\)/);
  assert.match(page, /next\.set\('record', id\)/);
  assert.match(page, /setTab\('drafts'\)/);
  assert.match(page, /<Tabs value=\{tab\} onValueChange=\{setTab\}>/);
  assert.match(page, /onClick=\{\(\) => openReport\(row\.id\)\}/);
});
test('intranet record list cache isolates real and test environments and honours optional authorization gate', () => {
  const hook = read('src/hooks/useIntranetRecords.ts');
  assert.match(hook, /allowed = true/);
  assert.match(hook, /profile\?\.test_account === true/);
  assert.match(hook, /enabled: !!user && !!profile && !!page && allowed/);
});
test('corrective action views document per-page metrics and stop paging while data is unreliable', () => {
  const page = read('src/pages/modules/audit/CorrectiveActions.tsx');
  assert.match(page, /Les indicateurs portent uniquement sur les constats affichés sur cette page/);
  assert.match(page, /query\.data\?\.has_more \? ' ; d’autres constats/);
  assert.match(page, /query\.isFetching \|\| query\.isError/);
});
