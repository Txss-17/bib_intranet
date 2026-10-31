import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');

test('salary module remains a tracking ledger, never a payment executor',()=>{
 const s=read('src/pages/modules/finance/Salaries.tsx');
 assert.match(s,/Suivi administratif des salaires/);
 assert.match(s,/Aucun paiement n’est exécuté ici/);
 assert.doesNotMatch(s,/useUpdateSalary|handleMarkAsPaid|Traiter paie|>\s*Payer\s*</);
 assert.match(s,/if \(isError\)/);
});
test('card approval is validated by database, cannot approve own or stale expense and audit is atomic',()=>{
 const sql=read('drizzle/migrations/0077_finance_card_approval_boundary.sql');
 assert.match(sql,/can_intranet_action\('finance\.cards','validate'\)/);
 assert.match(sql,/OLD\.user_id=actor/);
 assert.match(sql,/OLD\.approval_status<>'pending'/);
 assert.match(sql,/NEW\.approval_status NOT IN \('approved','rejected'\)/);
 assert.match(sql,/CREATE TRIGGER audit_finance_card_decision AFTER UPDATE/);
 assert.match(sql,/INSERT INTO public\.approval_history/);
 const hook=read('src/hooks/usePhase4.ts');
 const start=hook.indexOf('export const useApproveTransaction');
 const end=hook.indexOf('export const useApprovalHistory');
 const approval=hook.slice(start,end);
 assert.match(approval,/\.eq\('approval_status', 'pending'\)/);
 assert.match(approval,/\.neq\('user_id', user\.user\?\.id/);
 assert.doesNotMatch(approval,/await logApproval\('card_transaction'/);
});
test('finance cards enforce real amounts and calculate current month in same year',()=>{
 const card=read('src/pages/modules/finance/CorporateCards.tsx');
 assert.match(card,/can\('finance\.cards', 'create'\)/);
 assert.match(card,/Number\(form\.amount\) <= 0/);
 assert.match(card,/getFullYear\(\) === new Date\(\)\.getFullYear\(\)/);
});
test('reconciliation totals do not count missing Stripe amount as a zero-valued payment',()=>{
 const s=read('src/pages/modules/finance/Reconciliation.tsx');
 assert.match(s,/i\.stripe_amount == null/);
 assert.match(s,/i\.stripe_amount != null/);
 assert.doesNotMatch(s,/Number\(i\.stripe_amount \?\? 0\)/);
 assert.match(s,/isError/);
});
