import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../../supabase/migrations/20261121113500_rh_departure_security_preflight.sql', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../../src/components/hr/DepartureCasesPanel.tsx', import.meta.url), 'utf8');

test('departure security preflight permits canonical CEO or a real active technical lead only', () => {
  assert.match(sql, /public\.is_canonical_bib_ceo\(actor\)/);
  assert.match(sql, /ar\.role_key = 'responsable_tech'/);
  assert.match(sql, /aa\.status = 'active'/);
  assert.match(sql, /profile\.test_account IS FALSE/);
  assert.match(sql, /actor = v_case\.employee_id/);
  assert.match(sql, /rh_departure_preflight_independent_technician_required/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.rh_departure_security_preflight\(uuid\)/);
});

test('preflight never claims that sessions, Drive or third-party systems were revoked', () => {
  for (const claim of [
    "'session_token_revocation_verified', false",
    "'document_acl_independently_verified', false",
    "'external_services_independently_verified', false",
    "'ready_for_closure', false",
  ]) assert.ok(sql.includes(claim), claim);
  assert.match(sql, /FROM auth\.sessions/);
  assert.match(sql, /FROM auth\.users/);
  assert.doesNotMatch(sql, /UPDATE auth\.|DELETE FROM auth\.|UPDATE public\.profiles|UPDATE public\.access_assignments/);
  assert.match(ui, /Examiner les accès — lecture seule/);
  assert.match(ui, /Ce bilan ne peut jamais clôturer un départ/);
});
