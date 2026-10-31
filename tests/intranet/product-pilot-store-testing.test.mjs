import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL('../../'+file,import.meta.url),'utf8');

test('test center is linked and gated by Engineering permission',()=>{
 const app=read('src/App.tsx');
 const nav=read('src/data/moduleNavigations.ts');
 const home=read('src/pages/modules/product/ProductEngineeringDashboard.tsx');
 const page=read('src/pages/modules/product/ProductTestingCenter.tsx');
 assert.match(app,/import ProductTestingCenter from/);
 assert.match(app,/path="\/pole\/product\/testing"/);
 assert.match(nav,/Tests & boutiques pilotes/);
 assert.match(home,/path: '\/pole\/product\/testing'/);
 assert.match(home,/pageId: 'product.engineering'/);
 assert.match(page,/canViewPage\('product\.engineering'\)/);
});

test('test center specifies the six cross-app E2E scenarios without falsely running them',()=>{
 const page=read('src/pages/modules/product/ProductTestingCenter.tsx');
 for(const scenario of ['merchant','checkout','supplier','logistics','sav','permissions'])
   assert.ok(page.includes("key: '"+scenario+"'"),scenario);
 for(const boundary of ['48 h','Stripe','RLS','marchand','fournisseur','logistique'])
   assert.ok(page.includes(boundary),boundary);
 assert.match(page,/NON EXÉCUTÉ/);
 assert.match(page,/Ne renseigner une réussite que sur preuve/);
 assert.match(page,/Cette page ne crée pas de boutique/);
 assert.doesNotMatch(page,/\.from\(|\.rpc\(|fetch\(/);
});
