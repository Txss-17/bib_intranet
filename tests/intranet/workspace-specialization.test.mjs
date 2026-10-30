import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pages = JSON.parse(readFileSync(new URL('../../src/data/intranetRegistry.json', import.meta.url), 'utf8'));
const sql = readFileSync(new URL('../../drizzle/migrations/0053_specialize_intranet_workspaces.sql', import.meta.url), 'utf8');
const ids = [
  'rse.recycling', 'rse.packaging', 'rse.co2', 'rse.esg', 'rse.points',
  'marketing.content', 'marketing.podcasts', 'marketing.analytics',
  'security.vpn', 'security.environments', 'product.integrations',
  'support.onboarding', 'support.compliance', 'audit.reports',
];
const expectedOriginalKeys = {
  'rse.recycling': ['period','category','quantity','unit','method','source'],
  'rse.packaging': ['period','category','quantity','unit','method','source'],
  'rse.co2': ['period','category','quantity','unit','method','source'],
  'rse.esg': ['period','category','quantity','unit','method','source'],
  'rse.points': ['period','category','quantity','unit','method','source'],
  'marketing.content': ['channel','audience','content','publication_date','budget','result','source'],
  'marketing.podcasts': ['channel','audience','content','publication_date','budget','result','source'],
  'marketing.analytics': ['indicator','period','channel','value','unit','source','analysis'],
  'security.vpn': ['asset','environment','finding','action','verification','review_date'],
  'security.environments': ['asset','environment','finding','action','verification','review_date'],
  'product.integrations': ['area','problem','acceptance','version','dependency','result'],
  'support.onboarding': ['account','category','issue','resolution','sla_date'],
  'support.compliance': ['account','category','issue','resolution','sla_date'],
  'audit.reports': ['entity','reference','finding','evidence','corrective_action','review_date'],
};
test('14 domain workspaces retain their historic payload keys', () => {
  for (const id of ids) {
    const p = pages.find(page => page.id === id);
    assert.ok(p, id);
    assert.ok(p.description?.length > 25, id);
    assert.ok(p.operationalNote?.length > 30, id);
    assert.ok(p.recordLabel?.length > 4, id);
    const keys = p.fields.map(field => field.key);
    assert.equal(new Set(keys).size, keys.length, 'duplicate field: ' + id);
    for (const legacy of expectedOriginalKeys[id]) assert.ok(keys.includes(legacy), id + ':' + legacy);
    const newFields = p.fields.filter(field => !expectedOriginalKeys[id].includes(field.key));
    assert.equal(newFields.length, 4, 'four domain-specific fields for ' + id);
    assert.ok(newFields.every(field => field.required === false), 'additive / backward-compatible ' + id);
  }
});
test('SQL field contract matches the frontend registry for all workspaces', () => {
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /COMMIT;/);
  assert.match(sql, /UPDATE public\.intranet_modules/);
  for (const id of ids) {
    const page = pages.find(p => p.id === id);
    assert.ok(sql.includes("'" + id + "'"), 'migration missing ' + id);
    const fieldsJson = JSON.stringify(page.fields).replaceAll("'", "''");
    assert.ok(sql.includes(fieldsJson), 'field mismatch ' + id);
  }
});
test('no placeholder programme is presented as an executed operation', () => {
  for (const id of ['rse.points','security.vpn','security.environments','product.integrations','support.onboarding']) {
    const note = pages.find(page => page.id === id).operationalNote;
    assert.match(note, /aucun|aucune|n'|ne |non activé/i, id);
  }
});
test('page field signatures are specialized rather than copied across the same pole', () => {
  const signature = id => pages.find(page => page.id === id).fields.map(field => field.key + ':' + field.label).join('|');
  for (const scope of ['rse','marketing','security','support']) {
    const group = ids.filter(id => id.startsWith(scope + '.'));
    assert.equal(new Set(group.map(signature)).size, group.length, scope);
  }
});
