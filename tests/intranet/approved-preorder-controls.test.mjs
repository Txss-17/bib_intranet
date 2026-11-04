import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('governance respects approved decisions and merchant legal seller', () => {
  const source = read('src/pages/modules/direction/GroupGovernance.tsx');
  assert.match(source, /Décisions BIB approuvées/);
  assert.match(source, /BIB-00bis/);
  assert.match(source, /marchand reste le vendeur juridique/);
  assert.match(source, /Stripe et comptabilité restent deux systèmes distincts/);
});
test('Supplier and Ops explain operational preorder production gates', () => {
  const ops = read('src/pages/modules/ops/OpsDashboard.tsx');
  const supplier = read('src/pages/modules/supplier/SupplierDashboard.tsx');
  assert.match(ops, /fenêtre de précommandes regroupées/);
  assert.match(ops, /feu vert de production/);
  assert.match(supplier, /capacité fournisseur vérifiée/);
  assert.match(supplier, /prix de base transmis au marchand/);
});
