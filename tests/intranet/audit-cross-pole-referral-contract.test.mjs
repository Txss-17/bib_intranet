import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const migration102=read('drizzle/migrations/0102_supplier_audit_pole_handoff.sql');
const migration103=read('drizzle/migrations/0103_audit_cross_pole_referrals.sql');
const source=read('src/components/audit/CrossPoleAuditReferral.tsx');
const shops=read('src/pages/modules/marketplace/MarketplaceStores.tsx');
const incidents=read('src/pages/modules/ops/LogisticsIncidents.tsx');
const missions=read('src/pages/modules/audit/AuditMissions.tsx');
const journal=JSON.parse(read('drizzle/migrations/meta/_journal.json'));
test('supplier Audit handoff grant agrees with function signature',()=>{
 assert.match(migration102,/GRANT EXECUTE ON FUNCTION public\.transmit_supplier_audit_to_pole\(uuid,integer,text,text\) TO authenticated/);
 assert.doesNotMatch(migration102,/GRANT EXECUTE ON FUNCTION public\.transmit_supplier_audit_to_pole\(uuid,integer,text\) TO authenticated/);
});
test('referenced source is validated by invoker permissions and source RLS',()=>{
 assert.match(migration103,/SECURITY INVOKER/);
 assert.match(migration103,/can_intranet_action\('marketplace\.stores','update'\)/);
 assert.match(migration103,/can_intranet_action\('ops\.incidents','update'\)/);
 assert.match(migration103,/FROM public\.shops WHERE id=p_source_id/);
 assert.match(migration103,/FROM public\.logistics_incidents WHERE id=p_source_id/);
 assert.match(migration103,/CREATE POLICY audit_cross_pole_referrals_insert/);
 assert.match(migration103,/REVOKE UPDATE,DELETE ON public\.audit_cross_pole_referrals FROM authenticated/);
});
test('author, timestamp and mode are stamped at database, not supplied by client',()=>{
 assert.match(migration103,/NEW\.sent_by:=auth\.uid\(\)/);
 assert.match(migration103,/NEW\.sent_at:=clock_timestamp\(\)/);
 assert.match(migration103,/NEW\.test_account:=public\.intranet_is_test_mode\(\)/);
 assert.match(migration103,/NEW\.status:='received'/);
});
test('Merchant and Logistics requests arrive in Audit rather than auto-approving',()=>{
 assert.match(shops,/<CrossPoleAuditReferralButton sourcePole="marketplace" sourceType="shop" sourceId=\{shop\.id\}/);
 assert.match(incidents,/<CrossPoleAuditReferralButton sourcePole="ops" sourceType="logistics_incident" sourceId=\{incident\.id\}/);
 assert.match(missions,/<AuditCrossPoleInbox\s*\/>/);
 assert.match(source,/Une demande d’audit ne constitue ni une certification, ni une facture/);
 assert.match(source,/Le pôle Audit conserve l’instruction et les validations/);
});
test('migration order includes cross-pole Audit intake',()=>{
 assert.ok(journal.entries.some(e=>e.tag==='0102_supplier_audit_pole_handoff'));
 assert.ok(journal.entries.some(e=>e.tag==='0103_audit_cross_pole_referrals'));
});
