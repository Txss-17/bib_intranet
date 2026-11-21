import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const employeeView = readFileSync(
  new URL('../../src/pages/modules/rh/Employees.tsx', import.meta.url),
  'utf8',
);
const employeeHook = readFileSync(
  new URL('../../src/hooks/useEmployees.ts', import.meta.url),
  'utf8',
);

test('RH directory may only patch first_name and last_name', () => {
  const start = employeeView.indexOf('await updateEmployee.mutateAsync({');
  const end = employeeView.indexOf('});', start);
  const payload = employeeView.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(payload, /first_name:/);
  assert.match(payload, /last_name:/);
  for (const forbidden of ['email:', 'position:', 'poles:', 'hr_status:', 'seniority:', 'work_mode:', 'subsidiary:', 'collaborator_type:']) {
    assert.ok(!payload.includes(forbidden), `unexpected direct field: ${forbidden}`);
  }
});

test('mutation hook rejects privileged fields before sending the database update', () => {
  assert.match(employeeHook, /Object\.keys\(updates\)/);
  assert.match(employeeHook, /\['first_name', 'last_name'\]\.includes\(key\)/);
  assert.ok(employeeHook.indexOf('keys.some') < employeeHook.indexOf(".rpc("));
  assert.match(employeeHook, /'rh_correct_employee_name'/);
  assert.doesNotMatch(employeeHook, /\.update\(updates\)/);
  assert.match(employeeView, /Préparer une mutation RH/);
  assert.match(employeeView, /Un statut « sortant » ou « archivé » n’atteste pas la révocation/);
});

test('database RPC enforces portfolio scope and persists an actor-attributed audit', () => {
  const sql = readFileSync(
    new URL('../../supabase/migrations/20261121094000_rh_controlled_employee_name_correction.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rh_correct_employee_name\(/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /can_intranet_action\('rh\.employees','update'\)/);
  assert.match(sql, /portfolio\.owner_id = manager\.id/);
  assert.match(sql, /member\.entity_id = p_employee_id/);
  assert.match(sql, /member\.ended_at IS NULL/);
  assert.match(sql, /INSERT INTO public\.hr_record_events/);
  assert.match(sql, /'name_corrected'/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.rh_correct_employee_name/);
  assert.match(sql, /TO authenticated, service_role/);
});
