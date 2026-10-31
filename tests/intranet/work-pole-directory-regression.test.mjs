import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url),'utf8');

test('work editor distinguishes pole membership and assignable people', () => {
 const page=read('src/components/operations/WorkModulePage.tsx');
 assert.match(page,/useWorkPoleMembers/);
 assert.match(page,/Membres du pôle/);
 assert.match(page,/Droits insuffisants/);
 assert.match(page,/Filtrer les membres par pôle/);
 assert.match(page,/people\.data/);
});
test('work member directory only reads active colleagues in actor scope and test environment', () => {
 const sql=read('drizzle/migrations/0073_work_pole_directory.sql');
 assert.match(sql,/SECURITY DEFINER/);
 assert.match(sql,/can_intranet_action\('work\.'\|\|p_kind,'read'\)/);
 assert.match(sql,/is_canonical_bib_ceo/);
 assert.match(sql,/p\.app_origin='connect' AND p\.hr_status='active'/);
 assert.match(sql,/coalesce\(p\.test_account,false\)=public\.intranet_is_test_mode\(\)/);
 assert.match(sql,/p_pole=ANY\(coalesce\(p\.poles::text\[\]/);
 assert.match(sql,/can_intranet_action_for\(p\.id,'work\.'\|\|p_kind/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.list_work_pole_members/);
});
