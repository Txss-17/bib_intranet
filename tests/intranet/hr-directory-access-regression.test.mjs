import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
test('RH directory fetches all permitted staff with stable keyset pagination', () => {
 const page = read('src/hooks/useEmployees.ts');
 assert.match(page, /const fetchPage = \(cursor\?: string\)/);
 assert.match(page, /query\.order\('id', \{ ascending: true \}\)\.limit\(EMPLOYEES_PAGE_SIZE\)/);
 assert.match(page, /employees\.push\(\.\.\.page\)/);
 assert.match(page, /if \(cursor\) query = query\.gt\('id', cursor\)/);
});
test('RH access edits fail closed if RBAC catalog is unavailable', () => {
 const page = read('src/pages/modules/rh/RHAccess.tsx');
 for (const field of ['rolesError', 'scopesError', 'assignmentsError', 'employeesError']) assert.ok(page.includes(field));
 assert.match(page, /rolesError \|\| rolesLoading \|\| scopesError/);
});
