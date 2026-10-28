import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

let source=fs.readFileSync(new URL("../../src/data/positionAccess.ts",import.meta.url),"utf8");
source=source
  .replace(/import\s+\{\s*PoleId\s*\}\s+from\s+['"]@\/types['"];?/,"")
  .replace(/import\s+\{\s*EmployeePosition\s*\}\s+from\s+['"]@\/types\/positions['"];?/,"")
  .replace(/import\s+\{\s*isRbacEnforced\s*\}\s+from\s+['"]@\/data\/permissionMatrix['"];?/,
    "const isRbacEnforced=()=>globalThis.__positionRbacEnforced !== false;");
const javascript=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {resolvePositionAccess,isKnownPosition,canAccessPole,canAccessScreen,getAccessiblePoles,positionAccess}=
  await import("data:text/javascript;base64,"+Buffer.from(javascript).toString("base64"));
const actor=patch=>({authenticated:true,loading:false,position:"ops_logistics_manager",poles:["ops"],isAdmin:false,...patch});

test("NULL and custom catalogue positions never become CEO or gain legacy access",()=>{
  for(const position of [null,undefined,"","custom_ops_job","toString","__proto__"]) {
    const access=resolvePositionAccess(actor({position}));
    assert.equal(access.position,undefined);
    assert.deepEqual(access.accessiblePoles,[]);
    assert.equal(access.canAccessPole("direction"),false);
    assert.equal(access.canAccessPole("ops"),false);
    assert.equal(access.canAccessScreen("finance.salaries"),false);
  }
});
test("loading and signed-out actors remain denied even when their input contains admin or CEO",()=>{
  for(const patch of [{loading:true},{authenticated:false}]) {
    const access=resolvePositionAccess(actor({...patch,position:"ceo",isAdmin:true}));
    assert.equal(access.position,undefined);
    assert.deepEqual(access.accessiblePoles,[]);
    assert.equal(access.canAccessPole("rh"),false);
    assert.equal(access.canAccessScreen("rh.onboarding"),false);
  }
});
test("known employee positions retain their normal access and assigned extra poles",()=>{
  const access=resolvePositionAccess(actor({poles:["ops","supplier"]}));
  assert.equal(access.position,"ops_logistics_manager");
  assert.equal(access.canAccessPole("ops"),true);
  assert.equal(access.canAccessPole("supplier"),true);
  assert.equal(access.canAccessScreen("ops.pipeline"),true);
  assert.equal(access.canAccessScreen("finance.salaries"),false);
  assert.equal(access.canAccessPole("finance"),false);
});
test("explicit administrator access does not manufacture a CEO job",()=>{
  const access=resolvePositionAccess(actor({position:null,isAdmin:true,poles:[]}));
  assert.equal(access.position,undefined);
  assert.equal(access.canAccessPole("rh"),true);
  assert.equal(access.canAccessScreen("finance.salaries"),true);
  assert.deepEqual(access.accessiblePoles,positionAccess.ceo.poles);
});
test("simulation uses the simulated position and never inherits the real administrator override",()=>{
  const access=resolvePositionAccess(actor({
    position:"ceo",isAdmin:true,
    simulation:{position:"ops_logistics_manager",poles:["ops"]},
  }));
  assert.equal(access.position,"ops_logistics_manager");
  assert.equal(access.canAccessPole("ops"),true);
  assert.equal(access.canAccessPole("finance"),false);
  assert.equal(access.canAccessScreen("finance.salaries"),false);
  const missing=resolvePositionAccess(actor({isAdmin:true,simulation:{position:null,poles:["rh"]}}));
  assert.equal(missing.position,undefined);
  assert.equal(missing.canAccessPole("rh"),false);
});
test("the legacy helpers tolerate missing and unknown runtime positions without throwing or granting build-mode access",()=>{
  for(const enforced of [true,false]) {
    globalThis.__positionRbacEnforced=enforced;
    for(const position of [null,undefined,"custom_ops_job","toString","__proto__"]) {
      assert.equal(isKnownPosition(position),false);
      assert.equal(canAccessPole(position,"rh",["rh"]),false);
      assert.equal(canAccessScreen(position,"rh.onboarding",["rh"]),false);
      assert.deepEqual(getAccessiblePoles(position,["rh"]),[]);
    }
  }
  globalThis.__positionRbacEnforced=true;
});
test("returned pole lists cannot mutate the shared position catalogue",()=>{
  const access=resolvePositionAccess(actor({}));
  const original=[...positionAccess.ops_logistics_manager.poles];
  access.accessiblePoles.push("finance");
  assert.deepEqual(positionAccess.ops_logistics_manager.poles,original);
});
