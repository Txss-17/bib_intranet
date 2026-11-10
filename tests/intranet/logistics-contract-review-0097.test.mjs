import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../../drizzle/migrations/0097_logistics_provider_contract_review.sql',import.meta.url),'utf8');
const view=readFileSync(new URL('../../src/components/operations/PartnerPostApplicationWorkflow.tsx',import.meta.url),'utf8');
const journal=JSON.parse(readFileSync(new URL('../../drizzle/migrations/meta/_journal.json',import.meta.url),'utf8'));

test('logistics migration uses unique journal entry after access handoff',()=>{
 const current=journal.entries.find(x=>x.tag==='0097_logistics_provider_contract_review');
 const predecessor=journal.entries.find(x=>x.tag==='0096_partner_access_handoff');
 assert.equal(current?.idx,97);
 assert.equal(predecessor?.idx,96);
 assert.ok(current.when>predecessor.when);
 assert.equal(journal.entries.filter(x=>x.idx===97).length,1);
});

test('logistics signs only after recorded receipt and independently approved legal review',()=>{
 const received=sql.indexOf("WHEN 'requirements_accepted' THEN 'provider_contract_received'");
 const reviewed=sql.indexOf("WHEN 'provider_contract_received' THEN 'provider_contract_reviewed'");
 const signed=sql.indexOf("WHEN 'provider_contract_reviewed' THEN 'contract_signed'");
 assert.ok(received>=0 && received<reviewed && reviewed<signed);
 assert.match(sql,/compliance\.contracts','update'/);
 assert.match(sql,/independent_legal_review_required/);
 assert.match(sql,/provider_contract_review_missing/);
 assert.match(sql,/logistics_legal_review_required/);
 assert.match(view,/provider_contract_received/);
 assert.match(view,/provider_contract_reviewed/);
});

test('existing Gateway invitation and test isolation controls are preserved',()=>{
 assert.match(sql,/confirmed_invitation_delivery_required/);
 assert.match(sql,/h\.delivery_state='confirmed'/);
 assert.match(sql,/v_test AND h\.delivery_state='simulated'/);
 assert.match(sql,/test_account=public\.intranet_is_test_mode\(\)/);
 assert.match(sql,/public\.submit_intranet_outbox/);
 assert.doesNotMatch(view,/generateLink|access_token:/);
});
