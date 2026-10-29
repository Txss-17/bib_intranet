import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile = path => ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
const deferred = () => { let resolve,reject; const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject}; };
function providerHarness() {
 const state=[],refs=[],effects=[],requests=[]; let cursor=0, refCursor=0, started=false, listener;
 const calls={cleared:0,cancelled:0,selected:''};
 const react={createContext:()=>({Provider:'provider'}),useContext:()=>{},
  useState:initial=>{const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v;}];},
  useRef:initial=>{const i=refCursor++;return refs[i]??=( {current:initial} );},useCallback:f=>f,
  useEffect:f=>{if(!started)effects.push(f);},createElement:(type,props)=>({type,props})};
 const supabase={from:()=>({select:s=>{calls.selected=s;return {eq:(_,id)=>({single:()=>{const d=deferred();requests.push({id,...d});return d.promise;}})};}}),
  auth:{onAuthStateChange:fn=>{listener=fn;return {data:{subscription:{unsubscribe(){}}}};},signOut:async()=>({error:null})}};
 const exports={};vm.runInNewContext(compile('../../src/hooks/useAuth.tsx'),{exports,React:react,queueMicrotask,require:name=>name==='react'?react:name==='@tanstack/react-query'?{useQueryClient:()=>({clear:()=>calls.cleared++,cancelQueries:async()=>calls.cancelled++})}:{supabase}});
 const render=()=>{cursor=0;refCursor=0;return exports.AuthProvider({children:null}).props.value;};
 render();effects.forEach(f=>f());started=true;
 return {render,requests,calls,emit:async id=>{listener('SIGNED_IN',id?{user:{id}}:null);await Promise.resolve();},flush:async()=>{await Promise.resolve();await Promise.resolve();},cleanup:()=>effects.forEach(()=>{})};
}
test('loads the real app origin and waits for the matching profile',async()=>{
 const h=providerHarness();await h.emit('a');assert.equal(h.render().loading,true);assert.equal(h.render().profile,null);
 assert.match(h.calls.selected,/app_origin/);
 h.requests[0].resolve({data:{id:'a',app_origin:'connect',test_account:false},error:null});await h.flush();
 assert.equal(h.render().loading,false);assert.equal(h.render().profile.id,'a');
});
test('late profile from the previous account cannot replace the current identity',async()=>{
 const h=providerHarness();await h.emit('a');await h.emit('b');
 h.requests[1].resolve({data:{id:'b',app_origin:'connect'},error:null});await h.flush();
 h.requests[0].resolve({data:{id:'a',app_origin:'connect'},error:null});await h.flush();
 assert.equal(h.render().profile.id,'b');assert.equal(h.render().user.id,'b');assert.equal(h.calls.cleared,2);
});
test('sign-out invalidates in-flight profile reads and clears cached data',async()=>{
 const h=providerHarness();await h.emit('a');await h.render().signOut();
 h.requests[0].resolve({data:{id:'a',app_origin:'connect'},error:null});await h.flush();
 assert.equal(h.render().profile,null);assert.equal(h.render().session,null);assert.equal(h.render().loading,false);assert.equal(h.calls.cleared,2);
});
test('a failed profile request fails closed and supports retry',async()=>{
 const h=providerHarness();await h.emit('a');h.requests[0].reject(new Error('offline'));await h.flush();
 assert.equal(h.render().loading,false);assert.equal(h.render().profile,null);assert.ok(h.render().profileError);
 const retry=h.render().refreshProfile();h.requests[1].resolve({data:{id:'a',app_origin:'connect'},error:null});await retry;
 assert.equal(h.render().profileError,null);assert.equal(h.render().profile.id,'a');
});
function guard(auth) {
 const react={createElement:(type,props,...children)=>({type,props,children}),Fragment:'fragment'};const exports={};
 vm.runInNewContext(compile('../../src/components/AuthGuard.tsx'),{exports,React:react,require:name=>name==='react-router-dom'?{Navigate:'navigate'}:name.includes('useAuth')?{useAuth:()=>auth}:name.includes('lucide')?{Shield:'shield'}:{Button:'button'}});
 return exports.AuthGuard({children:'protected-child'});
}
test('protected children require a loaded profile belonging to this intranet and user',()=>{
 const base={session:{},user:{id:'a'},profile:{id:'a',app_origin:'connect',hr_status:'active'},loading:false};
 assert.equal(guard(base).children[0],'protected-child');
 for(const patch of [{loading:true},{profile:null},{profile:{id:'b',app_origin:'connect'}},{profile:{id:'a',app_origin:'bos'}},{profile:{id:'a',app_origin:null}},{profile:{id:'a',app_origin:'connect',hr_status:'suspended'}},{profileError:'offline'}])
  assert.ok(!JSON.stringify(guard({...base,...patch})).includes('protected-child'));
 assert.equal(guard({...base,session:null}).type,'navigate');
});

function preview(isAdmin) {
 let stored='ceo';
 const exports={};const react={useState:initial=>[initial,()=>{}],useEffect:()=>{}};
 vm.runInNewContext(compile('../../src/hooks/useViewAs.ts'),{exports,
  localStorage:{getItem:()=>stored,setItem:(_,value)=>{stored=value;},removeItem:()=>{stored=null;}},
  window:{dispatchEvent(){}},Event:class {},require:name=>name==='react'?react:name.includes('useUserRole')?{useUserRole:()=>({isAdmin})}:{getJobRole:id=>id?{id}:undefined}});
 return {value:exports.useViewAs(),stored:()=>stored};
}
test('a non-administrator cannot activate the role stored by another account',()=>{
 const h=preview(false);assert.equal(h.value.roleId,null);assert.equal(h.value.role,undefined);
 h.value.setRole('cto');assert.equal(h.stored(),'ceo');
});
test('a verified administrator retains the role preview',()=>{
 const h=preview(true);assert.equal(h.value.role.id,'ceo');h.value.setRole('cto');assert.equal(h.stored(),'cto');
});
