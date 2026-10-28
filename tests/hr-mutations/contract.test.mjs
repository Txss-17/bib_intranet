import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const file=new URL("../../src/lib/hrEmployeeMutations.ts",import.meta.url);
const javascript=ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {hrMutationPayload,hrMutationError,normalizeHrOnboardingPermissions,effectiveHrOnboardingPermissions}=await import("data:text/javascript;base64,"+Buffer.from(javascript).toString("base64"));
const id=n=>"20000000-0000-4000-8000-"+String(n).padStart(12,"0");
const input=()=>({targetUserId:id(3),creationKey:id(4),expectedTargetRevision:"a".repeat(32),replaceAssignmentIds:[id(7)],
 payload:{position:"custom_ops_job",primary_pole:"ops",poles:["ops","data"],seniority:"mid",requested_role:"new_ops",
 contract_type:" CDI ",start_date:"2026-10-28",manager_id:id(1),work_mode:"hybrid",subsidiary:" BIB FR ",notes:"Note",
 attached_documents:[{name:" Charte ",document_type:"charter",document_url:"https://bib.test/charte"}]}});
test("submission binds account UUID, source revision and exact replacement IDs without email authority",()=>{
 const payload=hrMutationPayload(input());
 assert.equal(payload.p_target_user_id,id(3));assert.equal(payload.p_expected_target_revision,"a".repeat(32));
 assert.deepEqual(payload.p_replace_assignment_ids,[id(7)]);assert.equal("work_email" in payload.p_payload,false);
 assert.equal("created_user_id" in payload.p_payload,false);assert.equal(payload.p_payload.subsidiary,"BIB FR");
});
test("retries preserve nonce and canonical payload",()=>{
 assert.deepEqual(hrMutationPayload(input()),hrMutationPayload(input()));
 const row=input();row.replaceAssignmentIds=[id(9),id(7)];assert.deepEqual(hrMutationPayload(row).p_replace_assignment_ids,[id(7),id(9)]);
});
test("identity, revision and replacement IDs are mandatory and validated",()=>{
 for(const patch of [{targetUserId:"email@bib.test"},{creationKey:"bad"},{expectedTargetRevision:"bad"},{replaceAssignmentIds:[id(7),id(7)]}])
  assert.throws(()=>hrMutationPayload({...input(),...patch}));
});
test("does not accept authority or identity fields hidden in the classification payload",()=>{
 for(const patch of [{created_by:id(1)},{target_user_id:id(1)},{first_name:"Other"},{user_roles:["admin"]}])
  assert.throws(()=>hrMutationPayload({...input(),payload:{...input().payload,...patch}}));
});
test("requires known poles, actual field choices, a valid date and distinct manager",()=>{
 for(const patch of [{poles:["unknown"]},{primary_pole:"rh"},{seniority:"superuser"},{work_mode:"anything"},{start_date:"2026-02-30"},{manager_id:id(3)},{subsidiary:""}])
  assert.throws(()=>hrMutationPayload({...input(),payload:{...input().payload,...patch}}));
});
test("documents require bounded text and credential-free HTTPS addresses",()=>{
 for(const doc of [{name:"",document_type:"charter",document_url:null},{name:"Doc",document_type:"charter",document_url:"http://bib.test/doc"},{name:"Doc",document_type:"charter",document_url:"https://user:pass@bib.test/doc"}])
  assert.throws(()=>hrMutationPayload({...input(),payload:{...input().payload,attached_documents:[doc]}}));
 assert.equal(hrMutationPayload({...input(),payload:{...input().payload,attached_documents:[{name:"Doc",document_type:"other",document_url:null}]}}).p_payload.attached_documents[0].document_url,null);
});
test("failure messages distinguish stale data and do not leak internal database text",()=>{
 assert.match(hrMutationError({message:"hr_mutation_target_changed",code:"40001"}),/Rien n’a été appliqué/);
 assert.match(hrMutationError({message:"hr_mutation_not_effective_yet",code:"22023"}),/date d’effet/);
 assert.match(hrMutationError({code:"42501"}),/auto-mutation/);
 assert.doesNotMatch(hrMutationError({message:"private database credentials"}),/credentials/);
});

test("onboarding navigation fails closed on denied or unavailable server rights",()=>{
 const none={read:false,create:false,update:false,delete:false,publish:false,validate:false,administer:false};
 assert.deepEqual(effectiveHrOnboardingPermissions(undefined),none);
 assert.deepEqual(effectiveHrOnboardingPermissions({read:false,create:true,validate:true,apply:true}),none);
 assert.equal(effectiveHrOnboardingPermissions({read:true,create:false,validate:false,apply:true}).update,false);
});
test("assigned-role grants do not depend on a legacy position and shared RPC cache retains apply",()=>{
 const raw=normalizeHrOnboardingPermissions({read:true,create:true,validate:true,apply:true});
 assert.equal(raw.apply,true);assert.equal("update" in raw,false);
 const actions=effectiveHrOnboardingPermissions(raw);
 assert.equal(actions.read,true);assert.equal(actions.create,true);assert.equal(actions.update,true);assert.equal(actions.validate,true);
 assert.equal(actions.administer,false);
 const code=fs.readFileSync(new URL("../../src/hooks/usePermissions.ts",import.meta.url),"utf8");
 assert.match(code,/pageId === 'rh\.onboarding'/);assert.match(code,/normalizeHrOnboardingPermissions\(data\)/);
 assert.match(code,/\['hr-onboarding-permissions', profile\?\.id\]/);
});
test("a role preview may only reduce actual onboarding actions",()=>{
 const full={read:true,create:true,validate:true,apply:true};
 assert.equal(effectiveHrOnboardingPermissions(full,{read:false,create:true,validate:true,update:true}).read,false);
 const readonly=effectiveHrOnboardingPermissions(full,{read:true,create:false,validate:false,update:true});
 assert.equal(readonly.create,false);assert.equal(readonly.validate,false);assert.equal(readonly.update,false);
 assert.equal(effectiveHrOnboardingPermissions({read:true,create:false,validate:false,apply:false},{read:true,create:true,validate:true,update:true}).create,false);
});
