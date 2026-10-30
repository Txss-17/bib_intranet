import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Security access directory excludes BOS test profiles in the server query', () => {
  const source = read('src/hooks/useSecurityData.ts');
  const start = source.indexOf('export const useSecurityAccess =');
  const end = source.indexOf('/*', start + 10);
  const query = source.slice(start, end < 0 ? undefined : end);
  assert.match(query, /\.from\('profiles'\)/);
  assert.match(query, /\.eq\('test_account', false\)/);
});

test('Security access count distinguishes real collaborators from demo accounts', () => {
  const page = read('src/pages/modules/security/SecurityAccess.tsx');
  assert.match(page, /compte\{users\.length > 1/);
  assert.match(page, /Annuaire opérationnel, hors comptes de test/);
  assert.match(page, /isLoading \|\| isError \? '—' : users\.length/);
});
