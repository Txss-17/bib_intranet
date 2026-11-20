import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const sql = readFileSync(new URL('../../ops/release/enable-pole-lead-portfolio-assignment-writes-20261120.sql',import.meta.url),'utf8');

test('lead-only portfolio assignment writes retain governed RLS', () => {
 assert.match(sql,/GRANT INSERT, UPDATE ON TABLE public\.access_portfolio_assignments TO authenticated/);
 assert.match(sql,/DROP POLICY IF EXISTS "intranet_authority_insert"/);
 assert.match(sql,/DROP POLICY IF EXISTS "intranet_authority_update"/);
 assert.match(sql,/public\.bib_can_manage_access_portfolio\(portfolio_id\)/);
 assert.match(sql,/NOT public\.intranet_is_test_mode\(\)/);
 assert.doesNotMatch(sql,/^\s*GRANT DELETE\b/im);
 assert.doesNotMatch(sql,/^\s*GRANT ALL\b/im);
 assert.doesNotMatch(sql,/DROP POLICY IF EXISTS "access_portfolio_assignments_insert_governed"/);
 assert.doesNotMatch(sql,/DROP POLICY IF EXISTS "access_portfolio_assignments_update_governed"/);
});
