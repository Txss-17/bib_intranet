import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const pages = JSON.parse(read('src/data/intranetRegistry.json'));
const seed = JSON.parse(read('drizzle/migrations/0039_intranet_modules.sql').match(/\$registry\$([\s\S]*?)\$registry\$/)[1]);
const sql = read('drizzle/migrations/0053_specialize_intranet_workspaces.sql');

const ids = [
  'rse.recycling', 'rse.packaging', 'rse.co2', 'rse.esg', 'rse.points',
  'marketing.content', 'marketing.podcasts', 'marketing.analytics',
  'security.vpn', 'security.environments', 'product.integrations',
  'support.onboarding', 'support.compliance', 'audit.reports',
  'audit.sanctions', 'compliance.policies', 'compliance.risks',
  'security.infrastructure', 'security.documentation', 'security.code', 'security.console',
  'finance.guarantee', 'finance.billing', 'finance.transactions', 'finance.subscriptions',
  'product.studio', 'product.innovation', 'product.documentation',
];

test('28 business workspaces keep their original payload contract', () => {
  assert.equal(new Set(ids).size,28);
  for (const id of ids) {
    const p = pages.find(page => page.id === id);
    const before = seed.find(page => page.id === id);
    assert.ok(p && before, id);
    assert.ok(p.description?.length > 25, id);
    assert.ok(p.operationalNote?.length > 30, id);
    assert.ok(p.recordLabel?.length > 4, id);
    const keys = p.fields.map(field => field.key);
    assert.equal(new Set(keys).size, keys.length, 'duplicate field: ' + id);
    for (let i = 0; i < before.fields.length; i++) {
      const historical = before.fields[i];
      const current = p.fields[i];
      assert.deepEqual(
        [current.key, current.type, current.required],
        [historical.key, historical.type, historical.required],
        'historic field contract ' + id + '/' + historical.key,
      );
    }
    const additions = p.fields.slice(before.fields.length);
    assert.equal(additions.length, 4, 'four specialized fields: ' + id);
    assert.ok(additions.every(field => field.required === false), 'backward-compatible ' + id);
  }
});

test('server migration fields match each frontend module', () => {
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /COMMIT;/);
  assert.match(sql, /UPDATE public\.intranet_modules/);
  for (const id of ids) {
    const page = pages.find(p => p.id === id);
    assert.ok(sql.includes("'" + id + "'"), 'migration missing ' + id);
    assert.ok(sql.includes(JSON.stringify(page.fields).replaceAll("'", "''")), 'field mismatch ' + id);
  }
});

test('manual registers do not pretend to execute external actions', () => {
  for (const id of [
    'rse.points','rse.packaging','security.vpn','security.environments','security.console',
    'security.code','product.integrations','product.studio','support.onboarding',
    'finance.billing','finance.guarantee','finance.subscriptions','audit.sanctions',
  ]) {
    const note = pages.find(p => p.id === id).operationalNote;
    assert.match(note, /aucun|aucune|n'|ne |non activé/i, id);
  }
});

test('workspaces sharing a pole are not the same business form', () => {
  const signature = id => pages.find(page => page.id === id).fields.map(field => field.key + ':' + field.label).join('|');
  for (const scope of ['rse', 'marketing', 'security', 'support', 'audit', 'finance', 'compliance', 'product']) {
    const group = ids.filter(id => id.startsWith(scope + '.'));
    assert.equal(new Set(group.map(signature)).size, group.length, scope);
  }
});
