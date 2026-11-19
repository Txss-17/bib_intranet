import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL('../../'+file,import.meta.url),'utf8');

test('legacy testing route keeps its engineering permission and redirects to Product',()=>{
 const app=read('src/App.tsx');
 const aliases=JSON.parse(read('src/data/intranetRouteAliases.json'));
 const page=read('src/pages/modules/product/ProductTestingCenter.tsx');
 assert.match(app,/path="\/pole\/product\/testing"/);
 assert.equal(aliases['/pole/product/testing'],'product.engineering');
 assert.match(page,/<Navigate to="\/pole\/product" replace \/>/);
});

test('retired synthetic scenarios cannot create shops, orders or claim completed E2E runs',()=>{
 const page=read('src/pages/modules/product/ProductTestingCenter.tsx');
 assert.doesNotMatch(page,/\.from\(|\.rpc\(|fetch\(|functions\.invoke\(|NON EXÉCUTÉ|key: 'merchant'/);
 assert.match(page,/Synthetic product and order scenarios are not part of BIB production/);
});
