import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('migration registry is contiguous and includes Finance and latest synchronization migration', () => {
  const journal = JSON.parse(read('drizzle/migrations/meta/_journal.json'));
  assert.equal(journal.entries.length, 85);
  assert.deepEqual(journal.entries.map(e => e.idx),Array.from({length:journal.entries.length},(_,i)=>i));
  assert.equal(new Set(journal.entries.map(x => x.when)).size, journal.entries.length);
  for (const tag of [
    '0052_restore_existing_account_access',
    '0078_finance_manual_cashflows_guard',
    '0079_finance_invoice_register',
    '0081_sync_pending_migrations',
    '0082_work_project_priority',
    '0083_supplier_audit_commercial_workflow',
    '0084_legal_document_governance',
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
