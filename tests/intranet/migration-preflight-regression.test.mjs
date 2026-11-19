import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('migration registry is contiguous and includes Finance and latest synchronization migration', () => {
  const journal = JSON.parse(read('drizzle/migrations/meta/_journal.json'));
  assert.ok(journal.entries.length >= 102);
  for (const entry of journal.entries) assert.ok(read('drizzle/migrations/'+entry.tag+'.sql').trim(),entry.tag);
  // Historical 0089/0091 were superseded by registered 0095/0096; replaying both is unsafe.
  const retired=new Set([89,91]);
  assert.deepEqual(journal.entries.map(e=>e.idx),Array.from({length:journal.entries.at(-1).idx+1},(_,i)=>i).filter(i=>!retired.has(i)));
  for(const [oldTag,newTag] of [['0089_pilot_partner_wave_selections','0095_pilot_partner_wave_selections'],['0091_partner_access_handoff','0096_partner_access_handoff']]){
    assert.ok(!journal.entries.some(e=>e.tag===oldTag));
    assert.ok(journal.entries.some(e=>e.tag===newTag));
    assert.match(read('drizzle/migrations/'+oldTag+'.sql'),/NOTE: not in the Drizzle journal/);
  }
  assert.equal(new Set(journal.entries.map(x => x.when)).size, journal.entries.length);
  for (const tag of [
    '0052_restore_existing_account_access',
    '0078_finance_manual_cashflows_guard',
    '0079_finance_invoice_register',
    '0081_sync_pending_migrations',
    '0082_work_project_priority',
    '0083_supplier_audit_commercial_workflow',
    '0084_legal_document_governance',
    '0085_supplier_audit_bank_receipt_attestation',
    '0086_merchant_supply_model',
    '0087_catalog_sandbox_isolation',
  ]) {
    assert.ok(journal.entries.some(e => e.tag === tag), tag);
  }
});

test('release preflight fails closed on missing Finance and HR dependencies', () => {
  const sql = read('ops/release/intranet-preflight.sql');
  for (const object of [
    'cashflows', 'finance_invoice_register',
    'get_hr_onboarding_permissions',
    'guard_finance_manual_cashflows', 'guard_finance_invoice_register',
  ]) assert.ok(sql.includes(object), object);
  assert.match(sql, /BIB_INTRANET_STAGING_NOT_READY/);
  assert.match(sql, /BEGIN READ ONLY/);
});

test('reconciliation audit does not mutate tables or migration history', () => {
  const sql = read('ops/release/intranet-migration-audit.sql');
  assert.match(sql, /BEGIN READ ONLY/);
  assert.match(sql, /drizzle\.__drizzle_migrations/);
  assert.match(sql, /supabase_migrations\.schema_migrations/);
  assert.match(sql, /intranet_business_tables/);
  assert.match(sql, /ROLLBACK/);
  assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|DROP|CREATE TABLE|ALTER TABLE)\b\s+(?:INTO\s+)?public\./i);
});
