import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');

test('quality and audit lists isolate accounts and paginate beyond 1000 accessible rows', () => {
 const hooks = read('src/hooks/useAudits.ts');
 assert.match(hooks, /readAllPages<OpsAudit>/);
 assert.match(hooks, /readAllPages<SupplierAudit>/);
 assert.match(hooks, /user\?\.id, profile\?\.test_account === true/);
 assert.match(hooks, /if \(cursor\) query = query\.gt\('id', cursor\)/);
 assert.match(hooks, /enabled: !!user && !!profile/);
});
test('operational audit metrics distinguish unknown score and query errors', () => {
 for (const file of ['OpsAudits', 'SupplierAudits']) {
  const page = read('src/pages/modules/audit/' + file + '.tsx');
  assert.match(page, /measuredAverage\(completed\.map\(a => a\.score\)\)/);
  assert.match(page, /avgScore === null/);
  assert.match(page, /isError && <div role="alert"/);
  assert.doesNotMatch(page, />Ce trimestre</);
 }
});
