import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('les principales sous-pages autrefois redirigées disposent de leurs propres écrans', () => {
  const app = read('src/App.tsx');
  for (const [route, component] of [
    ['/pole/product/roadmap', '<ProductPlanningWorkspace mode="roadmap" />'],
    ['/pole/product/backlog', '<ProductPlanningWorkspace mode="backlog" />'],
    ['/pole/product/product', '<ProductFunctionWorkspace area="product" />'],
    ['/pole/product/engineering', '<ProductFunctionWorkspace area="engineering" />'],
    ['/pole/marketing/crm', '<MarketingWorkflowPage mode="crm" />'],
    ['/pole/marketing/journeys', '<MarketingWorkflowPage mode="journeys" />'],
    ['/pole/marketing/reputation', '<MarketingWorkflowPage mode="reputation" />'],
    ['/pole/audit/corrective-actions', '<CorrectiveActions />'],
    ['/pole/support/compliance', '<SupportCoordinationPage mode="compliance" />'],
    ['/pole/support/onboarding', '<SupportCoordinationPage mode="onboarding" />'],
  ]) {
    assert.ok(app.includes(`path="${route}"`), `Missing route ${route}`);
    assert.ok(app.includes(`element={${component}}`), `Missing page for ${route}`);
  }
});

test('les contrôles de sécurité utilisent des écrans contextualisés et des registres indépendants', () => {
  for (const [page, kind] of [
    ['SecurityInfrastructure', 'infrastructure'], ['SecurityEnvironments', 'environments'],
    ['SecurityVPN', 'vpn'], ['SecurityCode', 'code'],
    ['SecurityConsole', 'console'], ['SecurityDocumentation', 'documentation'],
  ]) {
    assert.match(read(`src/pages/modules/security/${page}.tsx`), new RegExp(`kind="${kind}"`));
  }
  const component = read('src/components/security/SecurityControlWorkspace.tsx');
  assert.match(component, /ModuleWorkspace pageId={d.pageId}/);
  assert.match(component, /canViewPage\(d.pageId\)/);
});

test('les sous-pages répertoriées ont un accès de navigation ou un routage dédié', () => {
  const inventory = JSON.parse(read('docs/intranet-inventory.json'));
  const nav = read('src/data/moduleNavigations.ts');
  const app = read('src/App.tsx');
  const allIds = inventory.pages.filter((page) => !page.transversal);
  for (const page of allIds) {
    assert.ok(app.includes(`path="${page.path}"`) || app.includes('path="/pole/:poleId/:subSection"'),
      `No route for ${page.id}`);
    const subId = page.id.slice(page.scope.length + 1);
    assert.ok(nav.includes(`id: '${subId}'`), `Missing navigation item: ${page.id}`);
  }
});

test('pages métier distinctes : aucune action financière ou technique exécutée par l’interface de revue', () => {
  const roadmap = read('src/components/product/ProductPlanningWorkspace.tsx');
  const corrective = read('src/pages/modules/audit/CorrectiveActions.tsx');
  assert.match(roadmap, /ModuleWorkspace pageId={config.page}/);
  assert.match(corrective, /list_quality_alerts|useQualityAlerts/);
  assert.match(corrective, /\/pole\/audit\/nonconformities\?alert=/);
});

test('Marketplace : la vue Mon portefeuille ne permet pas de basculer vers le portefeuille global', () => {
  const page = read('src/pages/modules/marketplace/MerchantPortfolio.tsx');
  assert.match(page, /isPortfolioView \? 'mine' : portfolioFilter/);
  assert.match(page, /!isPortfolioView && <select/);
  assert.match(page, /effectivePortfolioFilter/);
});
