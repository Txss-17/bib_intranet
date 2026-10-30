import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file=(path)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const platform=file('ops/release/platform-preflight.sql');
const intranet=file('ops/release/intranet-preflight.sql');
const workflow=file('.github/workflows/staging-preflight.yml');

test('both SQL gates operate in read-only transactions and fail closed on missing resources',()=>{
 for(const [sql,label] of [[platform,'PLATFORM'],[intranet,'INTRANET']]){
  assert.match(sql,/BEGIN READ ONLY\s*;/);
  assert.match(sql,/ROLLBACK\s*;/);
  assert.match(sql,new RegExp('BIB_'+label+'_STAGING_NOT_READY'));
  assert.match(sql,/WITH\b|FROM \(VALUES/);
  // The scripts must never migrate, backfill, delete, grant or call external services.
  assert.doesNotMatch(sql,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE|GRANT|REVOKE|CALL)\s+(?:TABLE|FROM|INTO|ON|FUNCTION|POLICY|ROLE|TRIGGER|SCHEMA|PUBLIC|ALL)\b/i);
 }
});
test('gate requires SAV workflow and critical RLS boundaries in both databases',()=>{
 for(const name of ['customer_product_favorites','customer_boutique_favorites',
  'stock_restock_requests','sav_escalation_events','respond_to_order_issue',
  'escalate_unanswered_order_issues']) assert.ok(platform.includes(name),name);
 for(const name of ['intranet_modules','intranet_records','intranet_record_events',
  'sav_escalation_queue','acknowledge_sav_escalation','close_sav_escalation',
  'can_intranet_action']) assert.ok(intranet.includes(name),name);
 assert.match(platform,/relrowsecurity/);
 assert.match(intranet,/relrowsecurity/);
 assert.match(intranet,/177/);
});
test('the release gate can only be started manually with staging secrets',()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/\bpush:|\bpull_request:|\bschedule:/);
 assert.ok(workflow.includes('BIB_STAGING_PLATFORM_DATABASE_URL'));
 assert.ok(workflow.includes('BIB_STAGING_INTRANET_DATABASE_URL'));
 assert.ok(workflow.includes('default_transaction_read_only=on'));
 assert.ok(workflow.includes('ON_ERROR_STOP=1'));
 assert.doesNotMatch(workflow,/\b(?:deploy|publish|migrate)\s+(?:project|database|prod)/i);
});
