import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../../src/lib/accountReputation.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const row = (id, rating) => ({ id, company_name: 'Account ' + id, trustpilot_rating: rating });
const normal = value => JSON.parse(JSON.stringify(value));

test('reputation distribution assigns each recorded rating to the matching descending star bucket', () => {
  const result = exports.accountReputation([row('one', 1), row('five-a', 5), row('five-b', 4.9), row('three', 3.1)]);
  assert.deepEqual(normal(result.distribution).map(r => [r.stars, r.count]), [[5, 2], [4, 0], [3, 1], [2, 0], [1, 1]]);
  assert.equal(result.average, 3.5); assert.equal(result.rated, 4);
});
test('missing, non-finite and out-of-range ratings do not manufacture a zero score or count as reviews', () => {
  const result = exports.accountReputation([row('unknown', null), row('zero', 0), row('invalid', NaN), row('outside', 6)]);
  assert.equal(result.average, null); assert.equal(result.total, 4); assert.equal(result.rated, 0);
  assert.ok(result.distribution.every(r => r.count === 0 && r.percentage === 0));
  assert.equal(result.followUp.length, 0);
});
test('the average excludes missing ratings and follow-up lists actual account scores without mutating input', () => {
  const rows = [row('unknown', null), row('high', 5), row('low', 2)];
  const result = exports.accountReputation(rows);
  assert.equal(result.average, 3.5);
  assert.deepEqual(normal(result.followUp).map(r => r.id), ['low', 'high']);
  assert.deepEqual(rows.map(r => r.id), ['unknown', 'high', 'low']);
});

function reputationQuery(failAfterFirstPage = false) {
  const accounts = Array.from({ length: 1001 }, (_, index) => row(String(index).padStart(5, '0'), index === 1000 ? 1 : 5));
  const calls = [];
  const mockedExports = {};
  const mocks = {
    '@tanstack/react-query': { useQuery: options => options },
    '@/hooks/useAuth': { useAuth: () => ({ user: { id: 'actor' }, profile: { test_account: false } }) },
    '@/lib/accountReputation': exports,
    '@/integrations/supabase/client': { supabase: { from: table => {
      assert.equal(table, 'user_accounts'); let cursor;
      const query = { select: fields => { assert.equal(fields, 'id,company_name,trustpilot_rating'); return query; },
        order: field => { assert.equal(field, 'id'); return query; }, limit: size => { assert.equal(size, 500); return query; },
        gt: (field, value) => { assert.equal(field, 'id'); cursor = value; return query; },
        then: (resolve, reject) => {
          calls.push(cursor);
          return Promise.resolve(failAfterFirstPage && cursor ? { data: null, error: new Error('unavailable') }
            : { data: accounts.filter(account => !cursor || account.id > cursor).slice(0, 500), error: null }).then(resolve, reject);
        } };
      return query;
    } } },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../../src/hooks/useAccountReputation.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: mockedExports, require: name => {
    if (!(name in mocks)) throw new Error('Unexpected dependency ' + name); return mocks[name];
  } });
  return { query: mockedExports.useAccountReputation(), calls };
}
test('reputation reads beyond the default API page using an ordered cursor and only selects rating fields', async () => {
  const { query, calls } = reputationQuery();
  const result = await query.queryFn();
  assert.equal(result.total, 1001); assert.equal(result.rated, 1001);
  assert.equal(result.distribution.find(row => row.stars === 1).count, 1);
  assert.deepEqual(calls, [undefined, '00499', '00999']);
});
test('a failed reputation page rejects the summary instead of publishing partial totals', async () => {
  const { query } = reputationQuery(true);
  await assert.rejects(query.queryFn(), /unavailable/);
});
