import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../../'+path,import.meta.url),'utf8');
test('compliance hub exposes all four controlled governance areas',()=>{
  const page=read('src/pages/modules/compliance/ComplianceDashboard.tsx');
  for(const id of ['compliance.contracts','compliance.policies','compliance.disputes','compliance.risks'])assert.ok(page.includes(id),id);
  assert.match(page,/canViewPage\(page\.id\)/);
  assert.match(page,/Cadre juridique & obligations/);
  assert.match(page,/Litiges & maîtrise des risques/);
});
test('compliance hub distinguishes entity ownership, signed contracts and backend readiness',()=>{
 const page=read('src/pages/modules/compliance/ComplianceDashboard.tsx');
 assert.match(page,/bonne entité juridique/);
 assert.match(page,/ne sont pas confirmées opérationnelles/);
 assert.match(page,/vendeurs juridiques/);
 assert.doesNotMatch(page,/\.rpc\(|\.from\(/);
});
