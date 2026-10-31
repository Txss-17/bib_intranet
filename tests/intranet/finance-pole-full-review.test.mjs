import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('finance registry retains complete operational navigation',()=>{
 const pages=JSON.parse(read('src/data/intranetRegistry.json'));
 for(const id of ['finance.overview','finance.cashflow','finance.transactions','finance.billing','finance.payouts','finance.reconciliation','finance.subscriptions','finance.cards','finance.guarantee','finance.salaries']){
   assert.ok(pages.some(p=>p.id===id && p.path.startsWith('/pole/finance')),id);
 }
});
test('salary tracking does not execute payouts, does not export employee-level salaries directly and counts full period',()=>{
 const page=read('src/pages/modules/finance/Salaries.tsx');
 assert.doesNotMatch(page,/useUpdateSalary|handleMarkAsPaid|Traiter paie|<ExportButtons/);
 assert.match(page,/fullPeriod = salaryYear\.filter\(s => s\.period_month === selectedMonth\)/);
 assert.match(page,/Payés sur la période/);
 assert.match(page,/En attente sur la période/);
 assert.match(page,/Évolution de la masse salariale \(12 mois\)/);
});
test('payout registers show business names through source-of-truth relationships',()=>{
 const s=read('src/pages/modules/finance/PartnerPayouts.tsx');
 assert.match(s,/shops\(name\)/);
 assert.match(s,/suppliers\(name\)/);
 assert.match(s,/row\.shops\?\.name/);
 assert.match(s,/row\.suppliers\?\.name/);
 assert.match(s,/La consultation n.exécute pas de paiement/);
});
test('finance card approvals enforce server separation of duties and audit history',()=>{
 const sql=read('drizzle/migrations/0077_finance_card_approval_boundary.sql');
 assert.match(sql,/OLD\.user_id=actor/);
 assert.match(sql,/can_intranet_action\('finance\.cards','validate'\)/);
 assert.match(sql,/CREATE TRIGGER audit_finance_card_decision AFTER UPDATE/);
});
