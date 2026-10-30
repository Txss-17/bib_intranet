import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Platform RLS supervision is reachable only through the existing Security permission', () => {
  const app = read('src/App.tsx');
  const page = read('src/pages/modules/security/SecurityPlatform.tsx');
  const nav = read('src/data/moduleNavigations.ts');
  assert.match(app, /import SecurityPlatform from/);
  assert.match(app, /path="\/pole\/security\/platform"/);
  assert.match(app, /element=\{<SecurityPlatform \/>\}/);
  assert.match(nav, /Sécurité BIB Platform & RLS/);
  assert.match(page, /canViewPage\('security\.security'\)/);
  assert.match(page, /Accès à la revue de sécurité BIB Platform non autorisé/);
});

test('Platform UI distinguishes governance requirements from audited evidence', () => {
  const page = read('src/pages/modules/security/SecurityPlatform.tsx');
  for (const actor of ['Marchand','Client final','Fournisseur','Logistique','Personnel BIB']) {
    assert.ok(page.includes(actor), actor);
  }
  for (const table of [
    'boutique_members','customer_profiles','orders','supplier_products',
    'order_shipments','order_shipping_addresses','partner_onboarding_submissions',
  ]) assert.ok(page.includes(table), table);
  assert.match(page, /Ce n’est pas une supervision en temps réel/);
  assert.match(page, /Tests d.isolation requis/);
  assert.match(page, /AS RESTRICTIVE|RLS activée sans politique/);
  assert.doesNotMatch(page, /supabase\.from\('profiles'\)/);
});

test('security overview links to Platform without changing the employee identity count', () => {
  const overview = read('src/pages/modules/security/SecurityDashboard.tsx');
  const access = read('src/hooks/useSecurityData.ts');
  assert.match(overview, /to: '\/pole\/security\/platform'/);
  assert.match(access, /eq\('test_account', false\)/);
});
