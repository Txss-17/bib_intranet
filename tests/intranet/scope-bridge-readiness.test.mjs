import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const editor=read('src/components/admin/HierarchicalScopeEditor.tsx');
const marketplace=read('src/pages/modules/marketplace/MarketplaceDashboard.tsx');

test('scope editor labels draft as not enforced, and only considers mapped active RBAC portfolios',()=>{
 assert.match(editor,/Brouillon non applicable aux données avant intégration RLS/);
 assert.match(editor,/mappingReadiness\.verifiedLinks/);
 assert.match(editor,/rattachement\(s\) relié\(s\) à un portefeuille actif/);
 assert.match(editor,/ne crée jamais une habilitation/);
 assert.match(editor,/access_business_portfolios/);
 assert.match(editor,/access_scope_portfolios/);
 assert.match(editor,/!mappingSubsidiary\|\|!mappingPole\|\|!portfolioDraft/);
});
test('Marketplace dashboard exposes stale sync and last actual success',()=>{
 assert.match(marketplace,/lastSuccessfulSync = syncRuns\.find\(run => run\.status === 'success'\)/);
 assert.match(marketplace,/Les données Platform peuvent être périmées/);
 assert.match(marketplace,/La réactualisation de la page ne lance pas un import/);
 assert.match(marketplace,/\.limit\(25\)/);
});
