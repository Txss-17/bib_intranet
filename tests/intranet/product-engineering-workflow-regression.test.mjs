import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('product and engineering hub organizes work as a delivery cycle', () => {
  const home = read('src/pages/modules/product/ProductEngineeringDashboard.tsx');
  for (const label of [
    'Stratégie, conception & planification',
    'Engineering & assurance qualité logicielle',
    'Intégrations, livraisons & exploitation',
    'Architecture, documentation & innovation',
    'BIB Platform', 'BIB Intranet', 'BIB Audit Hub',
  ]) assert.ok(home.includes(label), label);
  assert.match(home, /visible = section\.links\.filter\(\(item\) => canViewPage\(item\.pageId\)\)/);
  assert.match(home, /useProductRequests\(\)/);
});

test('product hub cannot claim operational CI or service health from record approvals', () => {
  const home = read('src/pages/modules/product/ProductEngineeringDashboard.tsx');
  assert.match(home, /Dossiers ≠ tests exécutés ≠ versions déployées/);
  assert.match(home, /Les rapports CI\/CD et les environnements réels doivent être vérifiés séparément/);
  assert.match(home, /ne mesure pas la disponibilité des applications/);
  const plan = read('src/components/product/ProductPlanningWorkspace.tsx');
  assert.match(plan, /Une fiche validée ne publie ni version, ni fonctionnalité/);
});

test('product engineering retains separate security, data and business accountabilities', () => {
  const home = read('src/pages/modules/product/ProductEngineeringDashboard.tsx');
  assert.match(home, /Security & IT/);
  assert.match(home, /Data & BI/);
  assert.match(home, /Pôles métier/);
});
