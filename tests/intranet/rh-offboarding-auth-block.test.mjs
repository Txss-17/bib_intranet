import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../../supabase/migrations/20261121115000_rh_departure_auth_block_approved_case.sql', import.meta.url), 'utf8');
const fn = readFileSync(new URL('../../supabase/functions/rh-offboarding-auth-block/index.ts', import.meta.url), 'utf8');
const config = readFileSync(new URL('../../supabase/config.toml', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../../src/components/hr/DepartureCasesPanel.tsx', import.meta.url), 'utf8');

test('CEO sign-in suspension requires a previously approved distinct RH request', () => {
  assert.match(sql, /is_canonical_bib_ceo\(actor\)/);
  assert.match(sql, /can_intranet_action\('rh\.employees','validate'\)/);
  assert.match(sql, /v_case\.status<>'approved'/);
  assert.match(sql, /v_case\.planned_at > current_date/);
  assert.match(sql, /v_case\.decided_by IS DISTINCT FROM actor/);
  assert.match(sql, /v_case\.requested_by=v_case\.employee_id/);
  assert.match(sql, /employee\.test_account IS DISTINCT FROM FALSE/);
  assert.match(sql, /employee\.position::text='ceo'/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.rh_departure_auth_block_target\(uuid\)/);
});

test('Auth ban is performed only server-side after caller JWT and RPC authorization', () => {
  const checks = [
    'await caller.auth.getUser()',
    "'rh_departure_auth_block_target'",
    "createClient(url, serviceKey",
    'admin.auth.admin.updateUserById(',
    "ban_duration: '876000h'",
    "'rh_departure_record_auth_block'",
  ];
  checks.forEach(s => assert.ok(fn.includes(s), s));
  assert.ok(fn.indexOf("'rh_departure_auth_block_target'") < fn.indexOf('admin.auth.admin.updateUserById'));
  assert.ok(fn.indexOf('admin.auth.admin.updateUserById') < fn.indexOf("'rh_departure_record_auth_block'"));
  assert.ok(fn.indexOf('await caller.auth.getUser()') < fn.indexOf('createClient(url, serviceKey'));
  assert.match(config, /\[functions\.rh-offboarding-auth-block\]\s*verify_jwt = false/);
});

test('sign-in ban record verifies Auth state; no JWT, Drive or offboarding closure claims', () => {
  assert.match(sql, /u\.banned_until > now\(\)\+interval '30 days'/);
  assert.match(sql, /state='verified'/);
  assert.match(sql, /task_key='auth_signin'/);
  assert.match(sql, /rh_departure_events\(case_id,action,actor_id,note\)/);
  assert.doesNotMatch(sql, /DELETE FROM auth\.sessions|UPDATE auth\.sessions|UPDATE public\.profiles SET hr_status/);
  assert.match(fn, /sessions_revoked: false/);
  assert.match(fn, /existing_jwts_invalidated: false/);
  assert.match(fn, /departure_closed: false/);
  assert.match(panel, /authBlockConfirmation !== 'BLOQUER'/);
  assert.match(panel, /Préparer le blocage Auth/);
  assert.match(panel, /Les sessions déjà ouvertes/);
});
