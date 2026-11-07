import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql=readFileSync(new URL('../../drizzle/migrations/0091_partner_access_handoff.sql',import.meta.url),'utf8');
const ui=readFileSync(new URL('../../src/components/operations/PartnerPostApplicationWorkflow.tsx',import.meta.url),'utf8');
test('post-contract access milestone requires an independent verified invitation handoff',()=>{
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.bib_partner_access_handoffs/);
 assert.match(sql,/confirmed_invitation_delivery_required/);
 assert.match(sql,/h\.delivery_state='confirmed'/);
 assert.match(sql,/prepared_by=v_actor/);
 assert.match(sql,/v_handoff\.prepared_by=v_actor/);
 assert.match(sql,/delivery_reference=btrim\(p_delivery_reference\)/);
 assert.match(sql,/supplier_recipient_mismatch/);
 assert.match(sql,/logistics_recipient_mismatch/);
});
test('handoff records are restricted and contain no credentials',()=>{
 assert.match(sql,/ALTER TABLE public\.bib_partner_access_handoffs ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/GRANT SELECT ON public\.bib_partner_access_handoffs TO authenticated/);
 assert.doesNotMatch(sql,/GRANT (INSERT|UPDATE|DELETE) ON public\.bib_partner_access_handoffs TO authenticated/);
 assert.match(sql,/test_account=public\.intranet_is_test_mode\(\)/);
 assert.match(sql,/p_delivery_reference ~\*/);
 assert.doesNotMatch(sql,/CREATE TABLE[^;]*access_token/);
});
test('workflow exposes verified OTP access instructions, not an automatic activation or secret URL',()=>{
 assert.match(ui,/current==='contract_signed'/);
 assert.match(ui,/bib_record_partner_access_handoff/);
 assert.match(ui,/code OTP/);
 assert.match(ui,/https:\/\/brand-in-a-box\.space\/suppliers\/resume\?portal=suppliers/);
 assert.match(ui,/https:\/\/brand-in-a-box\.space\/ops\/resume\?portal=ops/);
 assert.doesNotMatch(ui,/send-transactional-email|createUser|generateLink|access_token:/);
});
