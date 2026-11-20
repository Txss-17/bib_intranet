import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL('../../'+path,import.meta.url),'utf8');

test('employee portfolio list opens individual detail without global access', () => {
  const list=read('src/components/dashboard/MyAssignedPortfolios.tsx');
  assert.ok(list.includes('PersonalPortfolioDetails'));
  assert.ok(list.includes('Voir les dossiers et le suivi'));
  assert.ok(list.includes('expanded === itemKey'));
  assert.ok(list.includes('onClose={() => setExpanded(null)}'));
  assert.ok(list.includes('profile?.id === user.id'));
});

test('detail checks ownership again and fails closed on missing rights', () => {
  const detail=read('src/components/dashboard/PersonalPortfolioDetails.tsx');
  assert.ok(detail.includes(".eq('employee_id', userId)"));
  assert.ok(detail.includes(".eq('portfolio_id', reference.id)"));
  assert.ok(detail.includes("portfolio.responsible_id !== userId"));
  assert.ok(detail.includes("portfolio.backup_id !== userId"));
  assert.ok(detail.includes("portfolio.owner_id !== userId"));
  assert.ok(detail.includes("retry:false"));
  assert.ok(detail.includes("enabled:isOwnSession"));
  assert.ok(detail.includes("if (assignmentError) throw assignmentError"));
  assert.ok(detail.includes("if (membersError) throw membersError"));
  assert.ok(detail.includes("if (tasksError) throw tasksError"));
  assert.ok(detail.includes("RLS"));
  assert.ok(!detail.includes("service_role"));
});

test('details distinguish real portfolio memberships from employee pole tasks', () => {
  const detail=read('src/components/dashboard/PersonalPortfolioDetails.tsx');
  assert.ok(detail.includes(".from('portfolio_assignments')"));
  assert.ok(detail.includes(".from('merchant_portfolio_assignments')"));
  assert.ok(detail.includes(".from('bib_case_portfolio_members')"));
  assert.ok(detail.includes(".eq('assignee_id',userId).eq('pole',pole)"));
  assert.ok(detail.includes("leur association directe au portefeuille n'est pas enregistrée"));
});
