import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
test('Ops partner inventory is distinct from supplier-owned stock', () => {
  const stocks = read('src/pages/modules/ops/DistributedStocks.tsx');
  assert.match(stocks, /stock encore détenu par les fournisseurs/);
  assert.match(stocks, /<StockTraceabilityPanel/);
});
test('supplier dashboard explains procurement triggered by real orders', () => {
  const supplier = read('src/pages/modules/supplier/SupplierDashboard.tsx');
  assert.match(supplier, /l'achat de la quantité correspondante/);
  assert.match(supplier, /n'expose pas encore un inventaire fournisseur vérifié/);
});
test('stock journal is read-only, access-controlled by existing RLS', () => {
  const audit = read('src/components/operations/StockTraceabilityPanel.tsx');
  assert.match(audit, /\.from\('stock_movements'\)/);
  assert.doesNotMatch(audit, /\.insert\(|\.update\(|\.delete\(/);
});
