import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql=readFileSync(new URL('../../drizzle/migrations/0092_cross_pole_sourcing.sql',import.meta.url),'utf8');
const view=readFileSync(new URL('../../src/components/operations/SourcingWorkspace.tsx',import.meta.url),'utf8');
const suppliers=readFileSync(new URL('../../src/pages/modules/supplier/SupplierApplications.tsx',import.meta.url),'utf8');
const logistics=readFileSync(new URL('../../src/pages/modules/ops/Partners.tsx',import.meta.url),'utf8');
test('sourcing works for both poles and all three mission purposes',()=>{
 assert.match(sql,/CHECK\(pole IN \('supplier','ops'\)\)/);
 assert.match(sql,/CHECK\(purpose IN \('proactive','merchant_request','substitution'\)\)/);
 assert.match(suppliers,/<SourcingWorkspace pole="supplier"/);
 assert.match(logistics,/<SourcingWorkspace pole="ops"/);
});
test('sourcing is independent of recruitment, contracts, partner activation and live orders',()=>{
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.bib_sourcing_missions/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.bib_sourcing_candidates/);
 assert.match(sql,/GRANT SELECT ON public\.bib_sourcing_missions,public\.bib_sourcing_candidates TO authenticated/);
 assert.doesNotMatch(sql,/INSERT INTO public\.(suppliers|supplier_applications|logistics_partners|contracts|orders|products)/);
 assert.match(view,/La présélection ne vaut ni contrat/);
});
test('permissions, sandbox isolation and evidence are server enforced',()=>{
 assert.match(sql,/test_account=public\.intranet_is_test_mode\(\)/);
 assert.match(sql,/can_intranet_action\('supplier\.applications','update'\)/);
 assert.match(sql,/can_intranet_action\('ops\.partners','update'\)/);
 assert.match(sql,/p_status IN \('shortlisted','not_selected'\)/);
 assert.match(sql,/REVOKE ALL ON public\.bib_sourcing_missions/);
});
