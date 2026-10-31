import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL('../../' + file, import.meta.url), 'utf8');

test('validated BIB supplier dossiers display their products, certificates, portfolio and assignee', () => {
 const page = read('src/pages/modules/supplier/SupplierFiles.tsx');
 const dossier = read('src/components/supplier/SupplierDossier.tsx');
 const registry = JSON.parse(read('src/data/intranetRegistry.json'));
 assert.equal(registry.find(x => x.id === 'supplier.suppliers')?.path,'/pole/supplier/suppliers');
 assert.match(page,/useState\('validated'\)/);
 assert.match(page,/Fournisseurs validés & dossiers BIB/);
 assert.match(page,/SupplierDossier supplierId=\{selectedSupplier\.id\}/);
 assert.match(page,/supplierStatus=\{selectedSupplier\.status\}/);
 assert.match(dossier,/\.from\('products'\)/);
 assert.match(dossier,/\.eq\('supplier_id', supplierId\)/);
 assert.match(dossier,/\.from\('certifications'\)/);
 assert.match(dossier,/product_id\.in\.\(/);
 assert.match(dossier,/supplier-dossier-assignment-history/);
 assert.match(dossier,/usePoleCollaborators\('supplier', 'supplier\.suppliers'/);
 assert.match(dossier,/supplierStatus === 'validated'/);
});
test('supplier assignment writes are atomic, RBAC controlled and logged, including old suggestion UI', () => {
 const sql=read('drizzle/migrations/0075_supplier_dossier_assignment.sql');
 const legacy=read('src/components/supplier/AssignmentSuggestion.tsx');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.assign_validated_supplier_dossier/);
 assert.match(sql,/can_intranet_action\('supplier\.suppliers','update'\)/);
 assert.match(sql,/status='validated'/);
 assert.match(sql,/can_intranet_action_for\(p\.id,'supplier\.suppliers','update'\)/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/supplier_assignment_events/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.assign_validated_supplier_dossier/);
 assert.match(legacy,/rpc\('assign_validated_supplier_dossier'/);
 assert.doesNotMatch(legacy,/\.from\(\s*'portfolio_assignments'\s*\)\s*\.update\(/);
});
