import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const read=path=>fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');
function emailHandler(file,transport={}){
 let handler;const calls=[];
 const client={from(table){calls.push({table});return {select(){return this},eq(){return this},maybeSingle:async()=>({data:table==='email_unsubscribe_tokens'?{token:'stored-token',used_at:null}:null,error:null}),insert:async(value)=>{calls.push({table,insert:value});return{error:null}}}},rpc:async(name,args)=>{calls.push({rpc:name,args});return{data:{queued:true},error:null}}};
 const sandbox={exports:{},Request,Response,Headers,crypto,atob,btoa,console,Date,setTimeout,Deno:{env:{get:key=>({SUPABASE_URL:'https://supabase.test',SUPABASE_SERVICE_ROLE_KEY:'actual-service-key'})[key]},serve:fn=>{handler=fn}},require:name=>{
  if(name.includes('supabase'))return {createClient:()=>{calls.push({client:true});return client}};
  if(name.includes('google-gmail'))return{getImpersonatedGmailUser:()=> 'sender@bib.test',...transport};
  if(name.includes('registry'))return{TEMPLATES:{'gateway-outbound':{component:()=>null,subject:d=>d.subject}}};
  if(name.includes('react-email'))return{renderAsync:async()=> 'rendered-message'};
  if(name.includes('react'))return{createElement:()=>null};throw new Error(name);
 }};
 vm.runInNewContext(ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);return{handler,calls};
}
const request=token=>new Request('https://supabase.test/functions/v1/email',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({templateName:'gateway-outbound',recipientEmail:'recipient@example.test',idempotencyKey:'frozen-key',templateData:{subject:'Approved subject',intranetOutboxId:'outbox-id',rfcMessageId:'<stable@bib.test>'}})});
test('an ordinary session and a forged service-role claim cannot send or consume email',async()=>{
 const forged='eyJhbGciOiJub25lIn0.'+btoa(JSON.stringify({role:'service_role'}))+'.invalid';
 for(const file of ['supabase/functions/send-transactional-email/index.ts','supabase/functions/process-email-queue/index.ts'])for(const token of ['ordinary-user-token',forged]){
  const h=emailHandler(file);const response=await h.handler(request(token));assert.equal(response.status,403,file);assert.equal(h.calls.length,0,'no database or transport effects before authorization');
 }
});
test('approved email dispatch queues the frozen reference and only confirms an atomic queue success',async()=>{
 const h=emailHandler('supabase/functions/send-transactional-email/index.ts');const response=await h.handler(request('actual-service-key'));assert.equal(response.status,200);assert.equal((await response.json()).queued,true);
 const call=h.calls.find(c=>c.rpc==='enqueue_intranet_email');assert.equal(call.args.p_key,'frozen-key');assert.equal(call.args.p_payload.intranet_outbox_id,'outbox-id');assert.equal(call.args.p_payload.rfc_message_id,'<stable@bib.test>');assert.equal(call.args.p_payload.to,'recipient@example.test');
});
