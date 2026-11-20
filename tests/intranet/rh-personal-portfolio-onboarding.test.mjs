import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = p => readFileSync(new URL('../../'+p, import.meta.url),'utf8');

test('RH employee directory and files fail closed to the owned portfolio IDs', () => {
  const hook = read('src/hooks/useMyRhEmployeePortfolioScope.ts');
  const list = read('src/pages/modules/rh/Employees.tsx');
  const docs = read('src/pages/modules/rh/EmployeeFiles.tsx');
  const employees = read('src/hooks/useEmployees.ts');
  const portfolio = read('src/pages/modules/rh/RHPortfolio.tsx');
  assert.ok(hook.includes('rh_my_portfolio_employee_ids'));
  assert.ok(hook.includes('queryKey: [\'rh-my-employee-portfolio-ids\', user?.id]'));
  for (const file of [list, docs]) {
    assert.ok(file.includes('useMyRhEmployeePortfolioScope()'));
    assert.ok(file.includes('allowedEmployeeIds: rhScope.ids'));
    assert.ok(file.includes('enabled: rhScope.ready'));
    assert.ok(file.includes('rhScope.error'));
  }
  assert.ok(employees.includes("query = query.in('id', filters.allowedEmployeeIds)"));
  assert.ok(employees.includes('if (filters.allowedEmployeeIds && filters.allowedEmployeeIds.length === 0) return []'));
  assert.ok(portfolio.includes(".in('id', rhScope.ids)"));
  assert.ok(portfolio.includes(".in('employee_id', rhScope.ids)"));
  assert.ok(portfolio.includes('const rhProfiles = profiles;'));
  assert.ok(!portfolio.includes("pole.toLowerCase() === 'rh'"));
});

test('completion maps a provisioned identity only to its RH referent portfolio', () => {
  const sql = read('ops/release/rh-personal-portfolio-onboarding-20261120.sql');
  assert.ok(sql.includes('NEW.manager_id'));
  assert.ok(sql.includes('NEW.created_user_id'));
  assert.ok(sql.includes("NEW.request_kind IS DISTINCT FROM 'onboarding'"));
  assert.ok(sql.includes("p.owner_id=(SELECT auth.uid())"));
  assert.ok(sql.includes("m.ended_at IS NULL"));
  assert.ok(sql.includes("rh_portfolio_required_before_completion"));
  assert.ok(sql.includes('ON public.hr_employee_requests'));
  assert.ok(sql.includes('rh_onboarding_portfolio_conflict'));
  assert.ok(sql.includes('AS RESTRICTIVE FOR SELECT TO authenticated'));
  assert.ok(!sql.includes('NEW.personal_email'));
});

test('HR portfolio writers cannot claim or transfer another RH owner portfolio', () => {
  const sql = read('ops/release/rh-personal-portfolio-owner-write-guards-20261120.sql');
  assert.ok(sql.includes('rh_portfolio_not_owned_by_actor'));
  assert.ok(sql.includes('rh_portfolio_cross_owner_transfer_forbidden'));
  assert.ok(sql.includes('rh_portfolio_owner_must_be_actor'));
  assert.ok(sql.includes('rh_portfolio_transfer_owner_required'));
  assert.ok(sql.includes('rh_portfolio_archive_owner_required'));
  assert.ok(sql.includes('public.is_canonical_bib_ceo'));
});

test('RH manager creates personal portfolio for self, CEO remains a separate oversight case', () => {
 const ui=read('src/components/operations/CasePortfolioManager.tsx');
 assert.ok(ui.includes("isRhPersonal = pole === 'rh'"));
 assert.ok(ui.includes('p_owner_id: isRhPersonal ? user?.id ?? null : ownerId || null'));
 const grant=read('ops/release/rh-case-portfolio-invoker-grants-20261120.sql');
 assert.ok(grant.includes('GRANT EXECUTE ON FUNCTION public.bib_create_case_portfolio'));
 assert.ok(grant.includes('GRANT EXECUTE ON FUNCTION public.bib_change_case_portfolio_owner'));
 assert.ok(!grant.includes('GRANT ALL'));
});
