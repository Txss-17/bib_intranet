import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const source = read('src/components/layout/MainLayout.tsx');
const sidebar = read('src/components/layout/AppSidebar.tsx');
const tabs = read('src/components/layout/ModuleNavigation.tsx');
const navigation = read('src/data/moduleNavigations.ts');
const app = read('src/App.tsx');
const registry = JSON.parse(read('src/data/intranetRegistry.json'));
const aliases = JSON.parse(read('src/data/intranetRouteAliases.json'));

test('Project workspace has six discoverable tabs and is not hidden by layout', () => {
  assert.match(source, /type TransversalModule = "work" \|/);
  assert.match(source, /pathname\.startsWith\("\/work\/"/);
  assert.match(source, /"work",/);
  assert.match(sidebar, /name: 'Projets & Travail'/);
  assert.match(sidebar, /path: '\/work\/projects'/);
  assert.match(sidebar, /\.some\(\(path\) => canViewPath\(path\)\)/);
  for (const page of ['tasks','projects','processes','validations','escalations','activities']) {
    assert.match(app, new RegExp('path="\\/work\\/' + page + '"'));
    assert.ok(registry.some(x => x.id === 'work.' + page && x.path === '/work/' + page));
  }
});
test('Finance, Operations/Logistics and Direction are routed and visible by canonical permissions', () => {
  assert.match(tabs, /canViewPath\(item\.path\)/);
  assert.doesNotMatch(tabs, /canViewPage\(\x60\$\{scope\}/);
  assert.match(sidebar, /\{pole\.name\}/);
  for (const pole of ['finance','ops','direction']) {
    assert.match(navigation, new RegExp('^  ' + pole + ': \\{', 'm'));
    assert.match(app, new RegExp('path="\\/pole\\/' + pole + '"'));
    assert.ok(registry.some(page => page.id === pole + '.overview'));
    assert.ok(registry.some(page => page.scope === pole && !page.transversal));
  }
  assert.equal(aliases['/pole/direction/access'], 'admin.roles');
  assert.match(navigation, /path: '\/pole\/direction\/access'/);
  assert.match(app, /path="\/pole\/direction\/access"/);
});
test('CEO is evaluated server-side and work tabs cannot override data access restrictions', () => {
  const sql = read('drizzle/migrations/0071_canonical_ceo_global_actions.sql');
  assert.match(sql, /profile\.position='ceo'/);
  assert.match(sql, /ar\.role_key='ceo'/);
  assert.match(tabs, /canViewPath\(item\.path\)/);
});
