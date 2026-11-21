import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const sql = readFileSync(new URL('../../ops/release/revoke-rbac-trigger-public-execute-20261121.sql',import.meta.url),'utf8');
test('RBAC trigger SECURITY DEFINER function is not externally executable',()=>{
 assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.bib_guard_access_portfolio_assignment()'));
 assert.ok(sql.includes('FROM PUBLIC, anon, authenticated'));
 assert.ok(!sql.includes('GRANT EXECUTE ON FUNCTION'));
});
