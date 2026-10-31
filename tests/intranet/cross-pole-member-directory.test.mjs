import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../'+p, import.meta.url), 'utf8');

test('all fourteen poles use one server-scoped directory with separate eligibility', () => {
 const sql=read('drizzle/migrations/0074_cross_pole_collaborator_directory.sql');
 const poleNames=['direction','finance','ops','supplier','marketplace','support','marketing','rh','audit','compliance','rse','product','data','security'];
 for(const pole of poleNames) assert.ok(sql.includes("'"+pole+"'"),'Missing '+pole);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.list_pole_collaborators/);
 assert.match(sql,/public\.is_canonical_bib_ceo/);
 assert.match(sql,/p_pole=ANY\(coalesce\(p\.poles::text\[\]/);
 assert.match(sql,/p\.app_origin='connect' AND p\.hr_status='active'/);
 assert.match(sql,/coalesce\(p\.test_account,false\)=public\.intranet_is_test_mode\(\)/);
 assert.match(sql,/can_intranet_action\(p_page,'read'\)/);
 assert.match(sql,/pole_directory_scope_forbidden/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.list_pole_collaborators/);
});
test('shared member query is reused by Marketplace, Supplier, Logistics and RH', () => {
 const hook=read('src/hooks/usePoleCollaborators.ts');
 assert.match(hook,/list_pole_collaborators/);
 const files=[
 'src/components/marketplace/MarketplacePortfolioManager.tsx',
 'src/components/operations/CasePortfolioManager.tsx',
 'src/pages/modules/supplier/SupplierPortfolios.tsx',
 'src/pages/modules/work/WorkTasks.tsx',
 ];
 for(const file of files) assert.match(read(file),/usePoleCollaborators/, file);
});
test('task member selections are constrained to a chosen pole', () => {
 const page=read('src/pages/modules/work/WorkTasks.tsx');
 assert.match(page,/Pôle du responsable/);
 assert.match(page,/setAssigneePole/);
 assert.match(page,/assigneePole, 'work\.tasks'/);
});
