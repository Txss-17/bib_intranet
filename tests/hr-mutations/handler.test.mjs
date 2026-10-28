import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source=fs.readFileSync(new URL("../../supabase/functions/provision-employee-account/index.ts",import.meta.url),"utf8").replace(/^import[^\n]+\n/,"");
const javascript=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const id=n=>"10000000-0000-4000-8000-"+String(n).padStart(12,"0");
async function invoke(options={}) {
 const calls={invites:[],writes:[],rpc:[],clients:[]};
 const request={id:id(1),reference:"HR-TEST",request_kind:"onboarding",status:"hr_validated",hr_validated_by:id(2),created_user_id:null,target_user_id:id(3),
 first_name:"Nouveau",last_name:"Collaborateur",work_email:"new@bib.test",personal_email:null,position:"ops_logistics_manager",
 position_key:"ops_logistics_manager",poles:["ops"],primary_pole:"ops",seniority:"mid",collaborator_type:"internal",manager_id:id(2),
 requested_role:"new_ops",contract_type:"CDI",start_date:"2026-01-01",work_mode:"office",subsidiary:"BIB",attached_documents:[],...options.request};
 const callerProfile={id:id(2),first_name:"Responsable",last_name:"RH",poles:["rh"],position:"rh_manager",hr_status:"active",test_account:false};
 class Query {
  constructor(table){this.table=table;this.verb="select";this.filters={};}
  select(){return this;}eq(key,value){this.filters[key]=value;return this;}
  in(){return this;}order(){return this;}limit(){return this;}
  insert(values){this.verb="insert";this.values=values;return this;}
  update(values){this.verb="update";this.values=values;return this;}
  async maybeSingle(){return this.execute(true);}async single(){return this.execute(true);}
  then(resolve,reject){return Promise.resolve(this.execute(false)).then(resolve,reject);}
  async execute(single){
   if(this.verb!=="select"){calls.writes.push({table:this.table,verb:this.verb,values:this.values});return {data:this.table==="access_assignments"?{id:id(8)}:null,error:null};}
   let value=null;
   if(this.table==="user_roles")value=[{role:"manager"}];
   if(this.table==="profiles")value=this.filters.id===id(2)?callerProfile:{id:this.filters.id};
   if(this.table==="hr_employee_requests")value=request;
   if(this.table==="rh_position_catalog")value={position_key:request.position_key,label:"Poste catalogue",pole_id:"ops",active:true};
   if(this.table==="access_roles")value={id:id(6),role_key:"new_ops",label:"Rôle Ops",business_pole:"ops",status:"active"};
   if(this.table==="access_role_scopes"||this.table==="rh_employee_documents")value=[];
   if(this.table==="access_assignments")value=null;
   return {data:value,error:null};
  }
 }
 const caller={
  auth:{getUser:async()=>({data:{user:options.unauthenticated?null:{id:id(2)}}})},
  rpc:async(name,args)=>{
   calls.rpc.push({client:"caller",name,args});
   if(name==="apply_hr_employee_mutation")return options.mutationError?{data:null,error:options.mutationError}:
     {data:options.mutationResult??{requestId:request.id,userId:request.target_user_id,invitationSent:false,accessAssignmentId:id(8)},error:null};
   if(name==="reserve_hr_onboarding_invitation")return {data:(Object.hasOwn(options,'reservationResult')?options.reservationResult:true),error:options.reservationError??null};
   if(name==="can_hr_employee_mutation_action")return {data:options.permission!==false,error:options.permissionError??null};
   throw new Error("Unexpected caller RPC "+name);
  },
 };
 const admin={
  from:table=>new Query(table),
  rpc:async(name,args)=>{
   calls.rpc.push({client:"admin",name,args});
   if(name==="hr_account_email_exists")return {data:options.emailExists??false,error:options.preflightError??null};
   throw new Error("Unexpected admin RPC "+name);
  },
  auth:{admin:{
   inviteUserByEmail:async(email,settings)=>{
    calls.invites.push({email,settings});
    if(options.inviteError)return {data:{user:null},error:options.inviteError};
    return {data:{user:options.invitedUser??{id:id(3),email,user_metadata:settings.data}},error:null};
   },
   listUsers:async()=>{throw new Error("Existing accounts must never be rebound through email enumeration");},
  }},
 };
 let handler;
 const environment={SUPABASE_URL:"https://supabase.test",SUPABASE_ANON_KEY:"anon",SUPABASE_SERVICE_ROLE_KEY:"service"};
 const context={Deno:{env:{get:key=>environment[key]},serve:fn=>{handler=fn;}},Response,Request,URL,JSON,Date,
 crypto:{randomUUID:()=>id(99)},console:{error(){},warn(){},log(){}},
 createClient:(url,key,settings)=>{calls.clients.push({key,settings});return key==="service"?admin:caller;}};
 vm.runInNewContext(javascript,context,{timeout:2000});
 const response=await handler(new Request("https://bib.test/provision",{method:"POST",headers:{Authorization:"Bearer actual-caller","Content-Type":"application/json"},body:JSON.stringify({requestId:request.id})}));
 return {status:response.status,body:await response.json(),calls};
}
test("mutation dispatch calls SQL with the caller JWT before any invitation or privileged writes",async()=>{
 const r=await invoke({request:{request_kind:"mutation",status:"hr_validated"}});
 assert.equal(r.status,200);assert.equal(r.body.invitationSent,false);assert.equal(r.calls.invites.length,0);assert.equal(r.calls.writes.length,0);
 assert.ok(r.calls.rpc.some(x=>x.client==="caller"&&x.name==="apply_hr_employee_mutation"));
 assert.equal(r.calls.rpc.some(x=>x.name==="hr_account_email_exists"),false);
 assert.equal(r.calls.clients.find(x=>x.key==="anon").settings.global.headers.Authorization,"Bearer actual-caller");
});
test("failed mutation permission produces no invitation or profile writes",async()=>{
 const r=await invoke({request:{request_kind:"mutation"},mutationError:{code:"42501",message:"hr_mutation_forbidden"}});
 assert.equal(r.status,403);assert.equal(r.calls.invites.length,0);assert.equal(r.calls.writes.length,0);
});
test("newhire permission and authentication fail closed",async()=>{
 for(const options of [{permission:false},{permissionError:{message:"unavailable"}},{unauthenticated:true}]){
  const r=await invoke(options);assert.ok([401,403].includes(r.status));assert.equal(r.calls.invites.length,0);assert.equal(r.calls.writes.length,0);
 }
});
test("existing confirmed and unconfirmed accounts are rejected by the preflight before invite",async()=>{
 for(const confirmed of [true,false]){
  const r=await invoke({emailExists:true,invitedUser:{id:id(3),email_confirmed_at:confirmed?"2026-01-01":null,user_metadata:{}}});
  assert.equal(r.status,409);assert.equal(r.calls.invites.length,0);assert.equal(r.calls.writes.length,0);
 }
});
test("an unavailable preflight never attempts an invitation",async()=>{
 const r=await invoke({preflightError:{message:"database unavailable"}});
 assert.equal(r.status,502);assert.equal(r.calls.invites.length,0);assert.equal(r.calls.writes.length,0);
});
test("an existing unconfirmed account racing the preflight cannot pass with an earlier request nonce",async()=>{
 const r=await invoke({invitedUser:{id:id(3),user_metadata:{hr_onboarding_request_id:id(1),hr_onboarding_attempt_nonce:id(98)}}});
 assert.equal(r.status,409);assert.equal(r.calls.invites.length,1);assert.equal(r.calls.writes.length,0);
});
test("duplicate invite errors never authorize an existing-account profile update",async()=>{
 const r=await invoke({inviteError:{code:"email_exists",message:"already registered",status:422}});
 assert.equal(r.status,409);assert.equal(r.calls.invites.length,1);assert.equal(r.calls.writes.length,0);
});
test("normal creation retains its account invitation and completes the new profile/role workflow",async()=>{
 const r=await invoke();
 assert.equal(r.status,200);assert.equal(r.body.invitationSent,true);assert.equal(r.calls.invites.length,1);
 assert.ok(r.calls.writes.some(x=>x.table==="profiles"&&x.verb==="update"));
 assert.ok(r.calls.writes.some(x=>x.table==="access_assignments"&&x.verb==="insert"));
 assert.ok(r.calls.writes.some(x=>x.table==="hr_employee_requests"&&x.values.status==="completed"));
});
test("custom catalogue positions are accepted via position_key when the legacy enum value is null",async()=>{
 const r=await invoke({request:{position:null,position_key:"custom_ops_job"}});
 assert.equal(r.status,200);assert.equal(r.calls.invites.length,1);
 const update=r.calls.writes.find(x=>x.table==="profiles"&&x.verb==="update");
 assert.equal(update.values.position,null);assert.equal(update.values.position_key,"custom_ops_job");
});

test("mutation requires the complete authoritative request and assignment confirmation",async()=>{
 for(const mutationResult of [{userId:id(3),invitationSent:false},{requestId:id(9),userId:id(3),accessAssignmentId:id(8),invitationSent:false}]){
  const r=await invoke({request:{request_kind:"mutation"},mutationResult});
  assert.equal(r.status,502);assert.equal(r.calls.invites.length,0);assert.equal(r.calls.writes.length,0);
 }
});

test("reservation errors fail before any invitation or profile/role writes",async()=>{
 for(const [reservationError,status] of [[{code:"42501",message:"forbidden"},403],[{code:"40001",message:"changed"},409]]){
  const r=await invoke({reservationError});assert.equal(r.status,status);assert.equal(r.calls.invites.length,0);assert.equal(r.calls.writes.length,0);
 }
});
test("only an explicit true invitation reservation can authorize sending",async()=>{
 for(const reservationResult of [false,null,{},undefined]){
  const r=await invoke({reservationResult});assert.equal(r.status,502);assert.equal(r.calls.invites.length,0);assert.equal(r.calls.writes.length,0);
 }
});
test("normal newhire reservation and invitation use the same fresh request nonce",async()=>{
 const r=await invoke();assert.equal(r.status,200);
 const reservation=r.calls.rpc.find(x=>x.name==="reserve_hr_onboarding_invitation");
 assert.ok(reservation);assert.equal(reservation.client,"caller");assert.equal(reservation.args.p_request_id,id(1));
 assert.equal(reservation.args.p_attempt_nonce,r.calls.invites[0].settings.data.hr_onboarding_attempt_nonce);
});
