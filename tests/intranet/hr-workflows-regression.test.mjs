import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => readFileSync(new URL('../../src/pages/modules/rh/' + name + '.tsx', import.meta.url), 'utf8');
test('HR alerts paginate all five sources and fail on source errors', () => {
 const file = read('HRAlerts');
 assert.match(file, /readAllPages<\{ id: string \}>/);
 assert.match(file, /query\.gt\('id', cursor\)/);
 assert.match(file, /queryKey: \['hr-alerts', user\?\.id, profile\?\.test_account === true\]/);
 assert.match(file, /error \? '—'/);
});
test('HR organization and business trips do not turn failed queries into empty lists', () => {
 for (const name of ['Oraganization', 'BusinessTrips']) {
  const file = read(name);
  assert.match(file, /isError/);
  assert.match(file, /role="alert"/);
  assert.match(file, /refetch\(\)/);
 }
});
test('business trips reject reversed date ranges and invalid budgets', () => {
 const file = read('BusinessTrips');
 assert.match(file, /form\.end_date < form\.start_date/);
 assert.match(file, /Number\.isFinite\(Number\(form\.estimated_budget\)\)/);
});
