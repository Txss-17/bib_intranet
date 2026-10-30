import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'../..');
const NO_ACCESS=Object.fromEntries(['read','create','update','delete','publish','validate','administer'].map(key=>[key,false]));
const allow=(...actions)=>Object.fromEntries(Object.keys(NO_ACCESS).map(key=>[key,actions.includes(key)]));
const good={'app.dashboard':allow('read'),'support.overview':allow('read','create')};
function load(file,mocks={},globals={}){
 const exports={};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
 vm.runInNewContext(code,{exports,AbortController,setTimeout,clearTimeout,React:{createElement:(type,props,...children)=>({type,props,children}),Fragment:'fragment'},require:name=>{if(name in mocks)return mocks[name];throw new Error('Unexpected import '+name);},...globals});return exports;
}
const readiness=()=>load('src/lib/permissionReadiness.ts',{'@/integrations/supabase/client':{supabase:{}}});
test('malformed or unavailable permission maps are not treated as a global revocation',()=>{
 const {parseIntranetPermissions,permissionQueryState}=readiness();
 assert.equal(parseIntranetPermissions(good),good);
 for(const value of [null,{},[],{'app.dashboard':{}},{'app.dashboard':{...NO_ACCESS,read:'true'}}])assert.throws(()=>parseIntranetPermissions(value));
 assert.equal(permissionQueryState({data:undefined,isError:false}),'loading');
 assert.equal(permissionQueryState({data:good,isError:false}),'ready');
 assert.equal(permissionQueryState({data:good,isError:true}),'error');
 assert.equal(permissionQueryState({data:{'app.dashboard':NO_ACCESS},isError:false}),'ready');
});
test('permission requests time out, abort and release the access screen for retry',async()=>{
 let expire,signal,cleared=false;
 const rpc=()=>({abortSignal:value=>{signal=value;return new Promise(()=>{});}});
 const {readIntranetPermissions}=load('src/lib/permissionReadiness.ts',{'@/integrations/supabase/client':{supabase:{rpc}}},{setTimeout:fn=>{expire=fn;return 1;},clearTimeout:()=>{cleared=true;}});
 const result=readIntranetPermissions(new AbortController().signal);expire();
 await assert.rejects(result,/Droits indisponibles/);assert.equal(signal.aborted,true);assert.equal(cleared,true);
});
test('an RPC error cannot grant cached or client-inferred permissions',async()=>{
 const rpc=()=>({abortSignal:async()=>({data:good,error:{code:'PGRST202'}})});
 const {readIntranetPermissions}=load('src/lib/permissionReadiness.ts',{'@/integrations/supabase/client':{supabase:{rpc}}});
 await assert.rejects(()=>readIntranetPermissions(new AbortController().signal));
});
function permissions(options={}){
 const queries=[],retried=[];const query=(key,overrides={})=>({data:allow('read'),isError:false,refetch:async()=>{retried.push(key);},...overrides});
 const task=query('tasks',options.tasks);
 const profile=options.profile||{id:'actor',position:'custom_position',poles:[],test_account:false};
 const role=options.simulated;
 const result=load('src/hooks/usePermissions.ts',{
  react:{useCallback:fn=>fn,useMemo:fn=>fn(),useEffect:()=>{},useState:()=>[0,()=>{}]},
  '@tanstack/react-query':{useQuery:config=>{queries.push(config);const key=config.queryKey[0];return query(key,key==='intranet-permissions'?{data:good,...options.server}:key==='hr-publication-permissions'?options.hr:key==='hr-onboarding-permissions'?options.onboarding:{data:{}});}},
  '@/integrations/supabase/client':{supabase:{}},'@/hooks/useAuth':{useAuth:()=>({user:{id:'actor'},profile})},
  '@/lib/intranet':{moduleById:id=>({id:id==='legacy.support'?'support.overview':id})},
  '@/lib/permissionReadiness':readiness(),
  '@/hooks/useWorkTasks':{useWorkTaskPermissions:()=>task},'@/hooks/useUserRole':{useUserRole:()=>({isAdmin:false})},
  '@/hooks/useViewAs':{useViewAs:()=>({role})},'@/data/jobRoles':{jobRoles:[]},
  '@/lib/hrPublications':{effectiveHrPublicationPermissions:data=>data||{}},
  '@/lib/hrEmployeeMutations':{effectiveHrOnboardingPermissions:data=>data||{},normalizeHrOnboardingPermissions:data=>data},
  '@/data/permissionMatrix':{NO_ACCESS,MATRIX_EVENT:'matrix',getDataScope:()=>({}),getPageByPath:()=>({id:'support.overview'}),isTestRbacEnforced:()=>true,loadTestMatrixOverrides:()=>({}),pageRegistry:[{id:'support.overview',scope:'support'},{id:'finance.overview',scope:'finance'}],resolvePagePermissions:()=>allow('read','create','update','delete','validate','administer'),startPermissionSync:()=>{}},
 }).usePermissions();
 return {result,queries,retried};
}
test('an assigned role remains navigable without a recognized profile position',()=>{
 const {result}=permissions();
 assert.equal(result.can('support.overview','create'),true);assert.equal(result.canViewPath('/pole/support'),true);
 assert.equal(result.canViewPage('legacy.support'),true);assert.equal(result.canViewPage('finance.overview'),false);
 assert.deepEqual([...result.visiblePoles],['support']);assert.equal(result.accessState('support.overview'),'ready');
});
test('loading permissions and network errors have a retry path without showing protected content',()=>{
 const pending=permissions({server:{data:undefined}}).result;
 assert.equal(pending.accessState('app.dashboard'),'loading');assert.equal(pending.canViewPage('app.dashboard'),false);
 const {result,retried}=permissions({server:{data:good,isError:true}});
 assert.equal(result.accessState('app.dashboard'),'error');assert.equal(result.canViewPage('app.dashboard'),false);
 result.retryAccess('app.dashboard');assert.deepEqual(retried,['intranet-permissions']);
});
test('task and HR readiness use their own authoritative RPC result',()=>{
 const {result,retried}=permissions({server:{data:undefined},tasks:{data:undefined,isError:true},hr:{data:allow('read')},onboarding:{data:undefined,isError:false}});
 assert.equal(result.accessState('work.tasks'),'error');assert.equal(result.accessState('rh.publications'),'ready');assert.equal(result.accessState('rh.onboarding'),'loading');
 result.retryAccess('work.tasks');result.retryAccess('rh.publications');result.retryAccess('rh.onboarding');
 assert.deepEqual(retried,['tasks','hr-publication-permissions','hr-onboarding-permissions']);
});
test('saved denials and an account change cannot be bypassed by the role preview',()=>{
 const denied=permissions({server:{data:{'app.dashboard':NO_ACCESS}},simulated:{id:'ceo',poles:['direction'],seniority:'executive'}}).result;
 assert.equal(denied.canViewPage('app.dashboard'),false);assert.equal(denied.accessState('app.dashboard'),'ready');
 const stale=permissions({profile:{id:'previous',position:'ceo',poles:['direction']}}).result;
 assert.equal(stale.canViewPage('support.overview'),false);
});
function gate(state,allowed=true,pathKnown=true){
 const retries=[];const permissions={accessState:()=>state,canViewPage:()=>allowed,retryAccess:id=>retries.push(id)};
 const {RouteAccessGate}=load('src/components/operations/RouteAccessGate.tsx',{
  'react-router-dom':{useLocation:()=>({pathname:'/pole/support'})},'@/hooks/usePermissions':{usePermissions:()=>permissions},
  '@/lib/intranet':{resolveIntranetPage:()=>pathKnown?{id:'support.overview'}:undefined},
  '@/components/ProtectedScreen':{AccessDenied:'denied'},'./AccessStatus':{AccessStatus:'status'},
 });
 return {tree:RouteAccessGate({children:'protected-content'}),retries};
}
test('routes distinguish loading, retryable failure, explicit denial and authorized access',()=>{
 for(const state of ['loading','error']){const {tree,retries}=gate(state);assert.equal(tree.type,'status');assert.equal(JSON.stringify(tree).includes('protected-content'),false);tree.props.retry();assert.deepEqual(retries,['support.overview']);}
 assert.equal(gate('ready',false).tree.type,'denied');assert.equal(gate('ready',true,false).tree.type,'denied');
 assert.equal(gate('ready').tree.children[0],'protected-content');
});
