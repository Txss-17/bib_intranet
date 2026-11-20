import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = p => readFileSync(new URL('../../'+p, import.meta.url),'utf8');
test('RH profile read and update are constrained by case portfolio with CEO/self exceptions',()=>{
 const sql=read('ops/release/rh-profile-rls-and-referents-20261120.sql');
 assert.ok(sql.includes('rh_can_access_employee_profile'));
 assert.ok(sql.includes('AS RESTRICTIVE'));
 assert.ok(sql.includes('FOR SELECT TO authenticated'));
 assert.ok(sql.includes('FOR UPDATE TO authenticated'));
 assert.ok(sql.includes('p.owner_id=(SELECT auth.uid())'));
 assert.ok(sql.includes('public.is_canonical_bib_ceo'));
 assert.ok(sql.includes('p_employee_id=(SELECT auth.uid())'));
 assert.ok(!sql.includes('GRANT ALL'));
});
test('RH referent picker uses a narrow authenticated RPC, not broad profiles selection',()=>{
 const sql=read('ops/release/rh-profile-rls-and-referents-20261120.sql');
 const hook=read('src/hooks/useHrOnboarding.ts');
 assert.ok(sql.includes('rh_onboarding_referents()'));
 assert.ok(sql.includes("p.position='rh_manager'"));
 assert.ok(sql.includes("p.test_account IS FALSE"));
 assert.ok(hook.includes("supabase.rpc('rh_onboarding_referents' as never)"));
 const block=hook.split('export const useHrReferents = () =>')[1].split('/**\n * Catalogue RBAC réel.')[0];
 assert.ok(!block.includes(".from('profiles')"));
});
