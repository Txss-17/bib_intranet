import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '../..');
const normal = value => JSON.parse(JSON.stringify(value));
function load(file, mocks = {}) {
 const exports = {};
 const code = ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
 vm.runInNewContext(code,{exports,crypto,URLSearchParams,require:name=>{
  if(name in mocks)return mocks[name];if(name==='react/jsx-runtime')return require(name);
  if(name.startsWith('@/lib/'))return load('src/lib/'+name.slice(6)+'.ts',mocks);
  throw new Error('Unexpected dependency '+name);
 }});return exports;
}
const legal=load('src/lib/disputes.ts');
const record={id:'case',revision:7,title:'Case',status:'submitted',created_by:'creator',owner_id:'worker',document_ids:[],visibility:'restricted',priority:'high',due_date:null,dispute_submitted_by:'submitter',dispute_required_reviews:2,first_reviewer:null,payload:legal.disputePayload({party:'Supplier',type:'Paiement',description:'Disagreement',stage:'analysis',assessment:'Checked',proposal:'Correct entry',evidence:'Ledger review',amount:'0.00',currency:'EUR'})};
test('legal reviews exclude the creator, responsible agent and actual submitter',()=>{
 for(const actor of [undefined,'creator','worker','submitter'])assert.equal(legal.disputeMayReview(record,actor,true),false);
 assert.equal(legal.disputeMayReview(record,'reviewer',false),false);assert.equal(legal.disputeMayReview(record,'reviewer',true),true);
 assert.equal(legal.disputeMayReview({...record,status:'reviewed',first_reviewer:'reviewer'},'reviewer',true),false);
 assert.equal(legal.disputeMayReview({...record,status:'reviewed',first_reviewer:'reviewer'},'reviewer',true,'return'),true);
});
test('historical submissions without a known author require rework before a new approval',()=>{
 const historical={...record,dispute_submitted_by:null};
 assert.equal(legal.disputeMayReview(historical,'reviewer',true),false);assert.equal(legal.disputeMayReview(historical,'reviewer',true,'return'),true);
 assert.equal(legal.disputeStatus({...historical,status:'approved',dispute_approved_at:null}),'Validation historique');
});
test('proposal readiness requires analysis, treatment and evidence in an editable dossier',()=>{
 const draft={...record,status:'draft'};assert.equal(legal.disputeReady(draft),true);
 for(const patch of [{stage:'open'},{assessment:' '},{proposal:''},{evidence:''}])assert.equal(legal.disputeReady({...draft,payload:{...draft.payload,...patch}}),false);
 assert.equal(legal.disputeReady({...draft,payload:{...draft.payload,evidence:''},document_ids:['document']}),true);
 assert.equal(legal.disputeReady({...draft,status:'approved'}),false);
});
test('decimal input preserves zero and rejects ambiguous, negative or imprecise amounts',()=>{
 assert.equal(legal.normalizeDisputeAmount('0,00'),'0.00');assert.equal(legal.normalizeDisputeAmount('15 000,50'),'15000.50');assert.equal(legal.normalizeDisputeAmount(''),'');
 for(const value of ['-1','1e9','Infinity','15000 €','1,234','1000000000000'])assert.throws(()=>legal.normalizeDisputeAmount(value));
});
test('displayed amounts retain exact large aggregate strings and their currency',()=>{
 assert.equal(legal.disputeMoney('0.00','EUR'),'0,00 EUR');assert.equal(legal.disputeMoney('1.5','USD'),'1,50 USD');
 assert.equal(legal.disputeMoney('9999999999999999.99','EUR'),'9\u202f999\u202f999\u202f999\u202f999\u202f999,99 EUR');
 for(const [amount,currency]of [[null,'EUR'],['','EUR'],['0',''],['15 000 €','EUR']])assert.equal(legal.disputeMoney(amount,currency),'Non renseigné');
});
test('canonical historical aliases and unstructured amounts remain visible without inventing a currency',()=>{
 const payload=legal.disputePayload({entity:'Supplier',requirement:'Old issue',mitigation:'Old treatment',amount_raw:'15 000 €'});
 assert.equal(payload.party,'Supplier');assert.equal(payload.description,'Old issue');assert.equal(payload.proposal,'Old treatment');assert.equal(payload.amount_raw,'15 000 €');assert.equal(payload.amount,'');assert.equal(payload.currency,'');
});
function client(mode=false){
 const calls=[],invalidated=[],state={fail:false};const hooks=load('src/hooks/useDisputes.ts',{
  react:{useRef:value=>({current:value})},'./useAuth':{useAuth:()=>({user:{id:'actor'},profile:{test_account:mode}})},
  '@tanstack/react-query':{useQuery:options=>options,useMutation:options=>options,useQueryClient:()=>({invalidateQueries:async({queryKey})=>invalidated.push(queryKey[0])})},
  '@/lib/intranet':{intranetRpc:async(name,args={})=>{calls.push({name,args});if(state.fail)throw new Error('uncertain response');return name==='list_compliance_disputes'?{rows:[record],has_more:true}:{id:'case',revision:8};}},
  sonner:{toast:{success(){},error(){}}},
 });return{calls,invalidated,state,hooks,actions:hooks.useDisputeActions()};
}
const fields={title:'Payment dispute',payload:record.payload,owner:'worker',due:null,priority:'high',visibility:'restricted',documents:[]};
test('uncertain canonical creation retries its key and a confirmed save starts a new case',async()=>{
 const{calls,state,actions}=client();state.fail=true;await assert.rejects(actions.save.mutationFn({fields}));state.fail=false;
 await actions.save.mutationFn({fields});await actions.save.mutationFn({fields});
 assert.equal(calls[0].args.p_key,calls[1].args.p_key);assert.notEqual(calls[1].args.p_key,calls[2].args.p_key);
 assert.equal(calls[1].args.p_payload.party,'Supplier');assert.equal('plaintiff'in calls[1].args.p_payload,false);
});
test('edits preserve the original revision and decisions use the dedicated legal workflow',async()=>{
 const{calls,actions,invalidated}=client();const original={...record};const newer={...record,revision:99};assert.notEqual(original.revision,newer.revision);
 await actions.save.mutationFn({original,fields});await actions.transition.mutationFn({record:original,action:'approve',note:'Independent check'});
 assert.equal(calls[0].args.p_revision,7);assert.deepEqual(normal(calls[1]),{name:'transition_compliance_dispute',args:{p_id:'case',p_revision:7,p_action:'approve',p_note:'Independent check'}});
 actions.transition.onSuccess();for(const key of ['disputes','dispute','dispute-stats','dispute-events','intranet-overview','notifications','drive-documents'])assert.ok(invalidated.includes(key));
});
test('server filters and event pages are explicit and cache keys separate real and test records',async()=>{
 const real=client(),synthetic=client(true);await real.hooks.useDisputes('Party','active','negotiation',50).queryFn();await real.hooks.useDisputeEvents('case',100).queryFn();
 assert.deepEqual(normal(real.calls[0]),{name:'list_compliance_disputes',args:{p_search:'Party',p_status:'active',p_stage:'negotiation',p_offset:50}});assert.equal(real.calls[1].args.p_offset,100);
 assert.notDeepEqual(normal(real.hooks.useDisputeStats().queryKey),normal(synthetic.hooks.useDisputeStats().queryKey));
});
function uiMocks(){const mocks={};for(const[file,names]of Object.entries({button:['Button'],badge:['Badge'],input:['Input'],label:['Label'],textarea:['Textarea'],dialog:['Dialog','DialogContent','DialogHeader','DialogTitle','DialogDescription'],select:['Select','SelectContent','SelectItem','SelectTrigger','SelectValue'],sheet:['Sheet','SheetContent','SheetHeader','SheetTitle']}))mocks['@/components/ui/'+file]=Object.fromEntries(names.map(name=>[name,name]));return mocks;}
function nodesOf(tree){const nodes=[];function visit(node){if(Array.isArray(node))return node.forEach(visit);if(!node||typeof node!=='object')return;if(node.type)nodes.push(node);visit(node.props?.children);}visit(tree);return nodes;}
function form(pending=false,original=record){
 const submitted=[],closed=[];const mocks={...uiMocks(),react:{useState:value=>[value,()=>{}]},'@/hooks/useDisputes':{useDisputePeople:()=>({data:[{id:'worker',name:'Responsible'}]})},'@/components/operations/RecordAttachments':{default:'RecordAttachments'},sonner:{toast:{error(message){throw new Error(message);}}}};
 const Form=load('src/components/forms/DisputeForm.tsx',mocks).default;const nodes=nodesOf(Form({original,pending,onClose:()=>closed.push(true),onSubmit:input=>submitted.push(input)}));return{nodes,submitted,closed};
}
test('the form edits subject, party and existing content with no premature close or forged metadata',()=>{
 const{nodes,submitted,closed}=form();nodes.find(node=>node.type==='form').props.onSubmit({preventDefault(){}});
 assert.equal(submitted[0].title,'Case');assert.equal(submitted[0].payload.party,'Supplier');assert.equal(submitted[0].payload.description,'Disagreement');assert.equal(submitted[0].owner,'worker');
 assert.equal('created_by'in submitted[0],false);assert.equal('status'in submitted[0],false);assert.equal('revision'in submitted[0],false);assert.equal(closed.length,0);
 assert.equal(nodes.find(node=>node.type==='RecordAttachments').props.ownerOnly,true);
});
test('pending legal forms prevent a second submission and dismissal',()=>{
 const{nodes,submitted,closed}=form(true);nodes.find(node=>node.type==='form').props.onSubmit({preventDefault(){}});nodes.find(node=>node.type==='Dialog').props.onOpenChange(false);
 assert.equal(submitted.length,0);assert.equal(closed.length,0);assert.equal(nodes.find(node=>node.type==='fieldset').props.disabled,true);
});
test('a creator with archive rights can enter a reason without receiving validation or edit rights',()=>{
 const approved={...record,status:'approved',approved_by:'other',dispute_approved_at:'2026-10-30T10:00:00Z'};
 const actions={save:{isPending:false},transition:{isPending:false}};
 const mocks={...uiMocks(),react:{useState:value=>[value,()=>{}],useEffect(){},useDeferredValue:value=>value},
  'react-router-dom':{useSearchParams:()=>[{get:key=>key==='record'?'case':null},()=>{}]},'lucide-react':{Archive:'Archive',Pencil:'Pencil',Plus:'Plus'},
  '@/hooks/useAuth':{useAuth:()=>({user:{id:'creator'}})},'@/hooks/usePermissions':{usePermissions:()=>({can:(_page,action)=>['read','delete'].includes(action)})},
  '@/hooks/useDisputes':{useDisputes:()=>({data:{rows:[approved],has_more:false}}),useDispute:()=>({data:approved}),useDisputeStats:()=>({data:{active:0,closed:1,awaiting_review:0,overdue:0,amounts:[],unknown_amounts:0}}),useDisputeActions:()=>actions},
  '@/components/forms/DisputeForm':{default:'DisputeForm'},'@/components/operations/DisputeJournal':{default:'DisputeJournal'},'@/components/operations/RecordAttachments':{DocumentLinks:'DocumentLinks'},'@/components/ExportButtons':{ExportButtons:'ExportButtons'},
 };
 const Page=load('src/pages/modules/compliance/Disputes.tsx',mocks).default;const nodes=nodesOf(Page());
 assert.ok(nodes.some(node=>node.type==='Textarea'&&node.props.id==='dispute-decision'));
 assert.ok(nodes.some(node=>node.type==='Archive'));assert.equal(nodes.some(node=>node.type==='DisputeForm'),false);
});
test('a successful private handoff closes the former owner sheet instead of keeping stale access controls',()=>{
 const editable={...record,status:'draft',owner_id:'worker',created_by:'creator'};const navigated=[];
 const actions={save:{isPending:false,mutate:(_input,options)=>options.onSuccess({...editable,owner_id:'replacement'})},transition:{isPending:false}};
 const mocks={...uiMocks(),react:{useState:value=>[value===undefined?editable:value,()=>{}],useEffect(){},useDeferredValue:value=>value},
  'react-router-dom':{useSearchParams:()=>[{get:key=>key==='record'?'case':null,[Symbol.iterator]:function*(){yield['record','case'];}},params=>navigated.push(params)]},'lucide-react':{Archive:'Archive',Pencil:'Pencil',Plus:'Plus'},
  '@/hooks/useAuth':{useAuth:()=>({user:{id:'worker'}})},'@/hooks/usePermissions':{usePermissions:()=>({can:(_page,action)=>['read','update'].includes(action)})},
  '@/hooks/useDisputes':{useDisputes:()=>({data:{rows:[editable],has_more:false}}),useDispute:()=>({data:editable}),useDisputeStats:()=>({data:{active:1,closed:0,awaiting_review:0,overdue:0,amounts:[],unknown_amounts:1}}),useDisputeActions:()=>actions},
  '@/components/forms/DisputeForm':{default:'DisputeForm'},'@/components/operations/DisputeJournal':{default:'DisputeJournal'},'@/components/operations/RecordAttachments':{DocumentLinks:'DocumentLinks'},'@/components/ExportButtons':{ExportButtons:'ExportButtons'},
 };
 const Page=load('src/pages/modules/compliance/Disputes.tsx',mocks).default;const nodes=nodesOf(Page());
 nodes.find(node=>node.type==='DisputeForm').props.onSubmit({...fields,owner:'replacement'});
 assert.equal(navigated.length,1);assert.equal(navigated[0].get('record'),null);
});
