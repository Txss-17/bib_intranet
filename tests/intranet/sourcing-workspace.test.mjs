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

test('merchant sourcing refers to an existing merchant account, not a free-text identity',()=>{
 assert.match(sql,/merchant_id uuid REFERENCES public\.user_accounts\(id\)/);
 assert.match(sql,/p_purpose='merchant_request' AND p_merchant_id IS NULL/);
 assert.match(sql,/SELECT 1 FROM public\.user_accounts WHERE id=p_merchant_id/);
 assert.match(view,/p_merchant_id:merchantId\|\|null/);
 assert.match(view,/merchantAccounts/);
});
test('comparison metrics are bounded and follow-up decisions are traceable',()=>{
 assert.match(sql,/bib_set_sourcing_offer_metrics/);
 assert.match(sql,/price_amount numeric\(14,2\)/);
 assert.match(sql,/sla_percent numeric\(5,2\)/);
 assert.match(sql,/bib_record_sourcing_followup/);
 assert.match(sql,/bib_sourcing_followups/);
 assert.match(view,/Enregistrer les critères comparatifs/);
 assert.match(view,/Planifier une relance/);
});
test('shortlisted supplier conversion is explicit, idempotent, and fails closed for sandbox or duplicates',()=>{
 assert.match(sql,/bib_convert_sourcing_to_supplier_application/);
 assert.match(sql,/public\.intranet_is_test_mode\(\) OR m\.test_account IS DISTINCT FROM false/);
 assert.match(sql,/c\.candidate_status<>'shortlisted'/);
 assert.match(sql,/IF c\.converted_application_id IS NOT NULL THEN RETURN/);
 assert.match(sql,/existing_supplier_application_requires_manual_link/);
 assert.match(sql,/INSERT INTO public\.supplier_applications/);
 assert.match(sql,/audit_accepted,raw_payload,source,status/);
 assert.match(view,/profile\?\.test_account===true/);
});

test('automatic sourcing reminders use owner-only notifications, cron and deduplicated receipts',()=>{
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.bib_sourcing_notification_receipts/);
 assert.match(sql,/followup_id uuid PRIMARY KEY/);
 assert.match(sql,/bib_dispatch_due_sourcing_notifications/);
 assert.match(sql,/f\.outcome='scheduled'/);
 assert.match(sql,/f\.due_at<=p_now/);
 assert.match(sql,/c\.followup_due_at=f\.due_at/);
 assert.match(sql,/p\.hr_status='active'/);
 assert.match(sql,/p\.test_account,false\)=m\.test_account/);
 assert.match(sql,/INSERT INTO public\.notifications\(user_id,pole_id,title,message,type,action_url,metadata,read\)/);
 assert.match(sql,/VALUES\(item\.owner_id,item\.pole::public\.pole_id/);
 assert.match(sql,/FOR UPDATE SKIP LOCKED/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.bib_dispatch_due_sourcing_notifications/);
 assert.match(sql,/cron\.schedule\('bib-sourcing-followup-reminders','\*\/15 \* \* \* \*'/);
 assert.doesNotMatch(sql,/net\.http_post|send-transactional-email/);
});
