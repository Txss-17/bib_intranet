import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source=fs.readFileSync(new URL("../../src/lib/hrPublications.ts",import.meta.url),"utf8");
const javascript=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {hrPublicationPayload,hrPublicationError,isPublicationReleased}=await import("data:text/javascript;base64,"+Buffer.from(javascript).toString("base64"));
const key="40000000-0000-4000-8000-000000000001";
const input=()=>({title:" Titre ",summary:" Résumé ",body:" Corps ",subtype:"announcement",status:"draft",visibility:"all",poles:[],creationKey:key});
test("new publication payload normalizes content and excludes caller identity",()=>{
  const data=hrPublicationPayload({...input(),author_id:"spoof",type:"news"});
  assert.equal(data.p_title,"Titre");assert.equal(data.p_body,"Corps");
  assert.equal(data.p_creation_key,key);assert.equal("author_id" in data,false);
  assert.equal("type" in data,false);assert.equal(data.p_id,null);
});
test("creation retries preserve the explicit creation key",()=>{
  assert.deepEqual(hrPublicationPayload(input()),hrPublicationPayload(input()));
  assert.throws(()=>hrPublicationPayload({...input(),creationKey:undefined}));
});
test("publication requires substantive body while a draft may be empty",()=>{
  assert.equal(hrPublicationPayload({...input(),body:" \n\t "}).p_body,null);
  assert.throws(()=>hrPublicationPayload({...input(),body:"\u00a0\u2000",status:"published"}));
});
test("rejects invalid category, status and content lengths",()=>{
  for(const patch of [{subtype:"unknown"},{status:"scheduled"},{title:" "},{title:"x".repeat(256)},{summary:"x".repeat(1001)},{body:"x".repeat(20001)}])
    assert.throws(()=>hrPublicationPayload({...input(),...patch}));
});
test("audiences require known poles and never silently widen",()=>{
  for(const patch of [{visibility:"team"},{visibility:"pole",poles:[]},{visibility:"pole",poles:["unknown"]},{visibility:"all",poles:["rh"]}])
    assert.throws(()=>hrPublicationPayload({...input(),...patch}));
  assert.deepEqual(hrPublicationPayload({...input(),visibility:"pole",poles:["rh","ops","rh"]}).p_poles,["ops","rh"]);
});
test("edit requires identity and concurrency token",()=>{
  assert.throws(()=>hrPublicationPayload({...input(),id:key,expectedUpdatedAt:undefined}));
  const data=hrPublicationPayload({...input(),id:key,expectedUpdatedAt:"2026-10-27T12:00:00Z"});
  assert.equal(data.p_id,key);assert.equal(data.p_creation_key,null);
});
test("concurrency and permissions failures have actionable messages",()=>{
  assert.match(hrPublicationError({code:"40001"}),/saisie est conservée/);
  assert.match(hrPublicationError({code:"42501"}),/droits/);
  assert.doesNotMatch(hrPublicationError({code:"PGRST202",message:"sensitive internal details"}),/sensitive/);
});

test("legacy server role inference snapshot matches the current ordered job-role catalogue",()=>{
  const sql=fs.readFileSync(new URL("../../drizzle/migrations/0031_hr_publications.sql",import.meta.url),"utf8");
  const jobRoles=fs.readFileSync(new URL("../../src/data/jobRoles.ts",import.meta.url),"utf8");
  const allPoles=Array.from(jobRoles.match(/const ALL_POLES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)).map(x=>x[1]);
  const catalogue=jobRoles.slice(jobRoles.indexOf("export const jobRoles:"));
  const roles=Array.from(catalogue.matchAll(/\{([^{}]+)\}/g)).map(x=>x[1]).filter(x=>/\bposition:\s*'/.test(x))
    .map(x=>({id:x.match(/\bid:\s*'([^']+)'/)[1],position:x.match(/\bposition:\s*'([^']+)'/)[1],
      poles:/\bpoles:\s*ALL_POLES/.test(x)?allPoles:Array.from(x.match(/\bpoles:\s*\[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)).map(y=>y[1])}));
  const match=sql.match(/\$roles\$([\s\S]*?)\$roles\$/);
  assert.ok(match);assert.ok(roles.length>100);
  assert.deepEqual(JSON.parse(match[1]),roles);
});

test("the common feed never releases draft, archive, scheduled or future content",()=>{
  const now=Date.parse("2026-10-27T12:00:00Z");
  const row={status:"published",publish_at:null,available_at:null,archive_at:null};
  assert.equal(isPublicationReleased(row,now),true);
  for(const patch of [{status:"draft"},{status:"scheduled"},{status:"archived"},{publish_at:"2026-10-28T00:00:00Z"},{available_at:"2026-10-28T00:00:00Z"},{archive_at:"2026-10-27T12:00:00Z"},{publish_at:"invalid"}])
    assert.equal(isPublicationReleased({...row,...patch},now),false);
  assert.equal(isPublicationReleased({...row,publish_at:"2026-10-27T12:00:00Z",archive_at:"2026-10-28T00:00:00Z"},now),true);
});
