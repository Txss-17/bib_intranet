import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const poleChecks = {
  direction: ['src/pages/modules/direction/StrategicKPIs.tsx', 'present(data'],
  finance: ['src/pages/modules/finance/PartnerPayouts.tsx', 'merchant_payouts'],
  ops: ['src/pages/modules/ops/Shipments.tsx', 'mutateAsync'],
  supplier: ['src/pages/modules/supplier/Certifications.tsx', 'isError'],
  marketplace: ['src/pages/modules/marketplace/MarketplaceOrders.tsx', 'valuesByCurrency'],
  support: ['src/pages/modules/support/SupportEscalations.tsx', 'events.refetch()'],
  marketing: ['src/components/marketing/MarketingEvidencePage.tsx', "podcasts:"],
  rh: ['src/components/rh/HrRecordsPage.tsx', "'security'"],
  audit: ['src/pages/modules/audit/Reports.tsx', 'audit.reports'],
  compliance: ['src/components/compliance/ComplianceGovernancePage.tsx', 'residual_risk'],
  rse: ['src/components/rse/RseEvidencePage.tsx', 'recycling:'],
  product: ['src/components/product/ProductTechnicalReviewPage.tsx', 'idempotency_key'],
  data: ['src/pages/modules/data/KPIVersions.tsx', 'isError'],
  security: ['src/pages/modules/security/SecurityLogs.tsx', 'http_status'],
};

test('les 14 pôles conservent leurs écrans et règles métier corrigées', () => {
  assert.equal(Object.keys(poleChecks).length, 14);
  for (const [pole, [path, marker]] of Object.entries(poleChecks)) {
    assert.ok(read(path).includes(marker), `Missing expected behavior for ${pole}: ${path}`);
  }
});

test('toutes les sous-pages inventoriées ont une route explicite et une entrée dans le menu de leur pôle', () => {
  const inventory = JSON.parse(read('docs/intranet-inventory.json'));
  const app = read('src/App.tsx');
  const nav = read('src/data/moduleNavigations.ts');
  const polePages = inventory.pages.filter((p) => !p.transversal);
  assert.equal(inventory.poles.length, 14);
  for (const page of polePages) {
    assert.ok(app.includes(`path="${page.path}"`), `Route absente: ${page.id}`);
    const itemId = page.id.slice(page.scope.length + 1);
    assert.ok(nav.includes(`id: '${itemId}'`), `Onglet absent: ${page.id}`);
  }
});

test('les principales pages génériques ont été remplacées par des vues métier', () => {
  const cases = [
    ['src/pages/modules/rse/ValidatedPackaging.tsx', 'mode="packaging"'],
    ['src/pages/modules/rse/RecyclingStats.tsx', 'mode="recycling"'],
    ['src/pages/modules/rse/ESGReports.tsx', 'mode="esg"'],
    ['src/pages/modules/rse/CustomerPoints.tsx', 'mode="points"'],
    ['src/pages/modules/compliance/Policies.tsx', 'mode="policies"'],
    ['src/pages/modules/compliance/RiskRegister.tsx', 'mode="risks"'],
    ['src/pages/modules/marketing/Analytics.tsx', 'mode="analytics"'],
    ['src/pages/modules/marketing/Podcasts.tsx', 'mode="podcasts"'],
    ['src/pages/modules/product/ProductIntegrations.tsx', 'mode="integrations"'],
    ['src/pages/modules/product/ProductDocumention.tsx', 'mode="documentation"'],
    ['src/pages/modules/product/ProductInnovation.tsx', 'mode="innovation"'],
    ['src/pages/modules/audit/Sanctions.tsx', 'audit.sanctions'],
    ['src/pages/modules/audit/Reports.tsx', 'audit.reports'],
    ['src/pages/modules/rse/CO2Impact.tsx', 'rse.co2'],
  ];
  for (const [path, marker] of cases) {
    assert.ok(read(path).includes(marker), `Vue métier manquante : ${path}`);
  }
});

test('les dossiers communs restent bloqués quand leur base ou leurs permissions sont indisponibles', () => {
  const workspace = read('src/components/operations/ModuleWorkspace.tsx');
  assert.match(workspace, /query\.isError \|\| query\.isLoading|query\.isLoading \|\| query\.isError/);
  assert.match(workspace, /Ce registre métier n'est pas accessible/);
  assert.match(workspace, /can\(d\.id, 'create'\)/);
});

test('périmètres, flux de données et paiements ne sont pas activés par une fiche UI', () => {
  assert.match(read('src/components/product/ProductTechnicalReviewPage.tsx'), /Aucune intégration|ne modifie aucun service/);
  assert.match(read('src/pages/modules/finance/PartnerPayouts.tsx'), /n'exécute pas de paiement/);
  assert.match(read('src/components/rse/RseEvidencePage.tsx'), /ne crédite aucun compte client/);
});
