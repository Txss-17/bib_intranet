import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../../supabase/migrations/20261121110000_rh_departure_approval_workflow.sql', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../../src/components/hr/DepartureCasesPanel.tsx', import.meta.url), 'utf8');
const employees = readFileSync(new URL('../../src/pages/modules/rh/Employees.tsx', import.meta.url), 'utf8');

test('RH departure is two-person and has no fabricated technical completion', () => {
  assert.match(sql, /rh_departure_separation_of_duties/);
  assert.match(sql, /decided_by <> requested_by/);
  assert.match(sql, /actor=current_case\.employee_id OR actor=current_case\.requested_by/);
  assert.match(sql, /public\.is_canonical_bib_ceo\(actor\)/);
  assert.match(sql, /can_intranet_action\('rh\.employees','validate'\)/);
  assert.match(sql, /public\.rh_departure_tasks/);
  assert.match(sql, /state='pending'/);
  assert.doesNotMatch(sql, /UPDATE auth\.sessions|DELETE FROM auth\.sessions|UPDATE auth\.users/);
  assert.doesNotMatch(sql, /UPDATE public\.profiles SET hr_status/);
});

test('request authorization is bound to an active personal RH portfolio', () => {
  assert.match(sql, /portfolio\.pole='rh' AND portfolio\.status='active'/);
  assert.match(sql, /portfolio\.owner_id=actor/);
  assert.match(sql, /member\.entity_id=p_employee/);
  assert.match(sql, /member\.ended_at IS NULL/);
  assert.match(sql, /employee\.test_account IS DISTINCT FROM FALSE/);
  assert.match(sql, /employee\.position::text='ceo'/);
  assert.match(sql, /p_employee=actor/);
});

test('tables are not directly exposed and RPCs are limited to authenticated actors', () => {
  for (const table of ['rh_departure_cases','rh_departure_tasks','rh_departure_events']) {
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
    assert.match(sql, new RegExp(`REVOKE ALL ON public\\.${table} FROM PUBLIC,anon,authenticated`));
  }
  for (const name of ['rh_departure_prepare','rh_departure_direction_review','rh_departure_list']) {
    assert.ok(sql.includes('FUNCTION public.' + name));
  }
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /TO authenticated/);
});

test('UI distinguishes management approval from actual account revocation', () => {
  assert.match(employees, /<DepartureCasesPanel employees=\{employees\} \/>/);
  assert.match(panel, /Aucun accès n’a été révoqué/);
  assert.match(panel, /sept contrôles techniques/);
  assert.match(panel, /Révocation des sessions/);
  assert.match(panel, /rh_departure_prepare/);
  assert.match(panel, /rh_departure_direction_review/);
  assert.match(panel, /rh_departure_list/);
  assert.doesNotMatch(panel, /deleteUser\(|ban_duration/);
});
