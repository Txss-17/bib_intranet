import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL('../../'+file,import.meta.url),'utf8');
test('RSE overview exposes five controlled functions, grouped by responsibility',()=>{
 const page=read('src/pages/modules/rse/RSEDashboard.tsx');
 const nav=read('src/data/moduleNavigations.ts');
 for(const key of ['rse.packaging','rse.recycling','rse.co2','rse.esg','rse.points']){
  assert.ok(page.includes(key),key);
 }
 assert.match(page,/canViewPage\(entry\.id\)/);
 assert.match(page,/Emballages & circularité/);
 assert.match(page,/Mesures d’impact & reporting/);
 assert.match(page,/Programmes circulaires & amélioration/);
 assert.match(nav,/Points clients/);
});
test('RSE claims no real impact, automatic points or functioning generic backend',()=>{
 const page=read('src/pages/modules/rse/RSEDashboard.tsx');
 const points=read('src/components/rse/RseEvidencePage.tsx');
 assert.match(page,/fonctions serveur/);
 assert.match(page,/aucun programme client/);
 assert.match(points,/Le programme n’est pas activé/);
 assert.doesNotMatch(page,/\.rpc\(|\.from\(/);
});
