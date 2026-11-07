import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql=readFileSync(new URL('../../drizzle/migrations/0091_partner_access_handoff.sql',import.meta.url),'utf8');
const ui=readFileSync(new URL('../../src/components/operations/PartnerPostApplicationWorkflow.tsx',import.meta.url),'utf8');

test('signed contract triggers an approved Gateway request, not a secret-bearing email',()=>{
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.bib_partner_access_handoffs/);
 assert.match(sql,/c\.stage<>'contract_signed'/);
 assert.match(sql,/public\.submit_intranet_outbox/);
 assert.match(sql,/ARRAY\[v_email\]/);
 assert.match(sql,/https:\/\/brand-in-a-box\.space\/suppliers\/resume\?portal=suppliers/);
 assert.match(sql,/https:\/\/brand-in-a-box\.space\/ops\/resume\?portal=ops/);
 assert.match(sql,/can_intranet_action\('gateway.compose','create'\)/);
 assert.doesNotMatch(sql,/INSERT INTO public\.partner_onboarding_submissions/);
});

test('only independently approved confirmed Gateway transport releases portal-ready milestone',()=>{
 assert.match(sql,/confirmed_invitation_delivery_required/);
 assert.match(sql,/h\.delivery_state='confirmed'/);
 assert.match(sql,/h\.prepared_by=v_actor/);
 assert.match(sql,/o\.status<>'sent'/);
 assert.match(sql,/o\.approved_by=o\.created_by/);
 assert.match(sql,/o\.recipients<>ARRAY\[h\.recipient_email\]::text\[\]/);
 assert.match(sql,/test_account=public\.intranet_is_test_mode\(\)/);
});

test('read only RLS and no direct user writes on invitation ledger',()=>{
 assert.match(sql,/ALTER TABLE public\.bib_partner_access_handoffs ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/GRANT SELECT ON public\.bib_partner_access_handoffs TO authenticated/);
 assert.doesNotMatch(sql,/GRANT (INSERT|UPDATE|DELETE) ON public\.bib_partner_access_handoffs TO authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.bib_prepare_partner_access_invitation\(uuid\) TO authenticated/);
});

test('intranet portal access UI uses Gateway and records no credentials',()=>{
 assert.match(ui,/current==='contract_signed'/);
 assert.match(ui,/bib_prepare_partner_access_invitation/);
 assert.match(ui,/bib_confirm_partner_access_delivery/);
 assert.match(ui,/code OTP/);
 assert.match(ui,/Simulation confirmée/);
 assert.doesNotMatch(ui,/send-transactional-email|generateLink|access_token:/);
});
