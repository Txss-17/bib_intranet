import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Data & BI home is organized by shared functions, never job titles', () => {
  const page = read('src/pages/modules/data/DataDashboard.tsx');
  for (const keyword of [
    'Catalogue des données', 'Intégrations & pipelines', 'Qualité des données',
    'Catalogue KPI', 'Business Intelligence', 'Rapports & publications',
    'Demandes & évolutions', 'Versions & gouvernance',
  ]) assert.ok(page.includes(keyword), keyword);
  assert.doesNotMatch(page, /Espace Data Analyst|Espace Data Engineer/);
  assert.match(page, /useDataSources/);
  assert.match(page, /Pipelines mesurés/);
  assert.match(page, /Non confirmés/);
});

test('BI source creation requires explicit role-domain classification and subsidiary', () => {
  const page = read('src/pages/modules/data/bi/BIDataSources.tsx');
  assert.match(page, /business_pole/);
  assert.match(page, /business_subsidiary: profile\.subsidiary/);
  assert.match(page, /profile\.poles/);
  assert.match(page, /isError/);
  assert.match(page, /onClick=\{\(\) => void refetch\(\)\}/);
});

test('RLS guards use server roles, subsidiary, pole, and restrictive policies', () => {
  const sql = read('drizzle/migrations/0064_bi_domain_isolation.sql');
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.bib_data_domain_allowed/);
  assert.match(sql, /public\.access_assignments assignment/);
  assert.match(sql, /profile\.test_account IS FALSE/);
  assert.match(sql, /AS RESTRICTIVE FOR SELECT TO authenticated/);
  for (const table of ['bi_dashboards','bi_dashboard_widgets','bi_data_sources','kpi_catalog']) {
    assert.ok(sql.includes('ON public.' + table), table);
  }
  assert.match(sql, /d\.target_filiale IS NOT NULL/);
  assert.match(sql, /business_pole IS NOT NULL/);
  assert.match(sql, /pole_access/);
});
