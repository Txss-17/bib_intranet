import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
test('supplier applications and restock registers paginate with user-isolated keys', () => {
 for (const path of ['src/hooks/useSupplierApplications.ts','src/hooks/useSupplierRestockOrders.ts']) {
  const code = read(path);
  assert.match(code, /readAllPages/);
  assert.match(code, /query\.gt\('id', cursor\)/);
  assert.match(code, /profile\?\.test_account === true/);
  assert.match(code, /enabled: !!user && !!profile/);
 }
});
test('supplier tables show read failures instead of an empty register, and disable exports', () => {
 for (const path of ['src/pages/modules/supplier/SupplierApplications.tsx','src/pages/modules/supplier/SupplierRestockOrders.tsx']) {
  const code = read(path);
  assert.match(code, /isError/);
  assert.match(code, /role="alert"/);
  assert.match(code, /!isLoading && !isError && <ExportButtons/);
 }
});
