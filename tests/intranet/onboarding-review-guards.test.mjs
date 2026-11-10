import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const view=readFileSync(new URL('../../src/components/operations/PartnerPostApplicationWorkflow.tsx',import.meta.url),'utf8');
const sql=readFileSync(new URL('../../drizzle/migrations/0096_partner_access_handoff.sql',import.meta.url),'utf8');

test('logistics interface refuses to skip independent provider-contract review',()=>{
 assert.match(view,/pendingLegalContractReview=kind==='logistics'&&current==='requirements_accepted'&&next\?\.\[0\]==='contract_signed'/);
 assert.match(view,/transition\.isPending\|\|pendingLegalContractReview\|\|pendingAccessProof/);
 assert.match(view,/réceptionnez la version du contrat, des CGS et du SLA/);
 assert.match(view,/Juridique \/ Logistique \/ Finance/);
});

test('partner access step is blocked until independently verified Gateway delivery',()=>{
 assert.match(view,/pendingAccessProof=next\?\.\[0\]==='portal_access_recorded'/);
 assert.match(view,/\['confirmed','simulated'\]\.includes\(handoffQuery\.data\.delivery_state\)/);
 assert.match(view,/profile\?\.test_account!==true/);
 assert.match(sql,/confirmed_invitation_delivery_required/);
 assert.match(sql,/h\.delivery_state='confirmed'/);
 assert.match(sql,/v_test AND h\.delivery_state='simulated'/);
});

test('UI gates do not claim to replace server authorization',()=>{
 assert.match(view,/PR #61/);
 assert.match(view,/Gateway/);
 assert.doesNotMatch(view,/createUser|generateLink|access_token:/);
});
