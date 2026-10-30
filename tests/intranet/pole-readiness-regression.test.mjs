import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('sécurité : les erreurs API utilisent le vrai champ de journal et les statuts sont protégés', () => {
  const dashboard = read('src/pages/modules/security/SecurityDashboard.tsx');
  const access = read('src/pages/modules/security/SecurityAccess.tsx');
  const alertHook = read('src/hooks/useSecurityData.ts');
  assert.match(dashboard, /log\.http_status/);
  assert.doesNotMatch(dashboard, /log\.status_code/);
  assert.doesNotMatch(access, /positionAccess/);
  assert.match(alertHook, /expectedStatus/);
});

test('data : les sources indisponibles ne sont pas comptabilisées comme des zéros', () => {
  for (const path of [
    'src/pages/modules/data/DataDashboard.tsx',
    'src/pages/modules/data/Reports.tsx',
    'src/pages/modules/data/bi/BIOverview.tsx',
  ]) {
    assert.match(read(path), /isError|dataIncomplete|incomplete/);
  }
  assert.doesNotMatch(read('src/pages/modules/data/Reports.tsx'), /<Button[^>]*>\s*<Filter/);
});

test('produit : volumes des commandes séparés par devise et paginés', () => {
  const hook = read('src/hooks/useRDData.ts');
  const page = read('src/pages/modules/product/ProductPerformance.tsx');
  assert.match(hook, /\.range\(offset, offset \+ orderPageSize - 1\)/);
  assert.match(hook, /gross_orders_by_currency/);
  assert.match(page, /gross_orders_display/);
  assert.doesNotMatch(page, /CA sur 30 jours/);
});

test('marketing : la campagne est confirmée avant de fermer son formulaire', () => {
  const page = read('src/pages/modules/marketing/Campaigns.tsx');
  assert.match(page, /await createCampaign\.mutateAsync/);
  assert.match(page, /await updateCampaign\.mutateAsync/);
  assert.match(page, /setFormOpen\(false\)/);
});

test('finance et dossiers communs : pas d’export si la source est indisponible', () => {
  for (const path of [
    'src/components/operations/ModuleWorkspace.tsx',
    'src/components/operations/FinancialOverview.tsx',
  ]) {
    assert.match(read(path), /!query\.isError/);
    assert.match(read(path), /<ExportButtons/);
  }
});

test('direction, RH, opérations et marketplace signalent les erreurs des sources métier', () => {
  const pairs = [
    ['src/pages/modules/direction/ExecutiveDashboard.tsx', /alertsError/],
    ['src/pages/modules/rh/RHDashboard.tsx', /employeesError \? '—'/],
    ['src/pages/modules/ops/OpsDashboard.tsx', /syncError \|\| replError/],
    ['src/pages/modules/marketplace/MarketplaceDashboard.tsx', /merchantsError/],
  ];
  for (const [path, expression] of pairs) assert.match(read(path), expression);
});
