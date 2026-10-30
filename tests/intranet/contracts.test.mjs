import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function load(p,mocks={}){
 const exports={};const req=name=>{
  if(name in mocks)return mocks[name];
  if(name.startsWith('npm:'))return require(name.slice(4).replace(/@\d[^/]*$/,''));
  if(name.includes('supabase'))return {supabase:{}};
  if(name.startsWith('@/'))return name.endsWith('.json')?JSON.parse(read('src/'+name.slice(2))):load('src/'+name.slice(2)+'.ts',mocks);
  if(name.startsWith('.'))return load(path.relative(root,path.resolve(root,path.dirname(p),name)),mocks);
  return require(name);
 };
 const code=ts.transpileModule(read(p),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{exports,require:req,crypto,URL,URLSearchParams,TextEncoder,TextDecoder,Request,Response,Headers,Uint8Array,ArrayBuffer,atob,btoa,fetch,console,Date,Map,Set,window:{location:{pathname:'/pole/finance/transactions',origin:'https://bib.test'}}});return exports;
}
const registry=JSON.parse(read('src/data/intranetRegistry.json'));
const intranet=load('src/lib/intranet.ts');
test('all fourteen poles and every transversal section have unique canonical definitions',()=>{
 assert.equal(new Set(registry.filter(r=>!r.transversal).map(r=>r.scope)).size,14);
 assert.equal(new Set(registry.map(r=>r.id)).size,registry.length);
 assert.equal(new Set(registry.map(r=>r.path)).size,registry.length);
 for(const r of registry){assert.equal(intranet.resolveIntranetPage(r.path)?.id,r.id,r.path);assert.ok([1,2].includes(r.approvalLevels));}
});
test('every concrete protected route and dynamic detail resolves to a real permission page',()=>{
 const source=read('src/App.tsx');const ast=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const failures=[];
 function visit(n){if(ts.isJsxAttribute(n)&&n.name.getText(ast)==='path'&&n.initializer&&ts.isStringLiteral(n.initializer)){
 const p=n.initializer.text;if(['/login','/reset-password','/unsubscribe','*','/pole/:poleId','/pole/:poleId/:subSection','/modules/:moduleId/:subSection','/modules/gateway/:subSection','/modules/ethics/:subSection'].includes(p))return;
 if(!intranet.resolveIntranetPage(p.replace(/:[^/]+/g,'detail-id')))failures.push(p);
 }ts.forEachChild(n,visit)}visit(ast);assert.deepEqual(failures,[]);
 for(const p of ['/pole/finance/unknown','/pole/ops/orders/id/unknown','/admin/unknown','/documents/unknown','/pole/not-real'])assert.equal(intranet.resolveIntranetPage(p),undefined,p);
 assert.equal(intranet.resolveIntranetPage('/pole/security/edge-functions/id/logs').id,'security.logs');
});
test('server migrations reconstruct the frontend registry including domain schemas',()=>{
 const seed=JSON.parse(read('drizzle/migrations/0039_intranet_modules.sql').match(/\$registry\$([\s\S]*?)\$registry\$/)[1]);
 const dispute=JSON.parse(read('drizzle/migrations/0051_compliance_dispute_workflow.sql').match(/\$dispute_definition\$([\s\S]*?)\$dispute_definition\$/)[1]);
 const migration=read('drizzle/migrations/0053_specialize_intranet_workspaces.sql');
 const row=/^\s*\('([^']+)', '((?:''|[^'])*)'::jsonb, '((?:''|[^'])*)', '((?:''|[^'])*)', '((?:''|[^'])*)'\),?\s*$/gm;
 const unescapeSql=s=>s.replaceAll("''", "'");
 const overrides=new Map([...migration.matchAll(row)].map(m=>[m[1],{
   fields: JSON.parse(unescapeSql(m[2])),
   description: unescapeSql(m[3]),
   operationalNote: unescapeSql(m[4]),
   recordLabel: unescapeSql(m[5]),
 }]));
 assert.equal(overrides.size,28,'migration must override all specialized pages');
 const effective=seed.map(page=>{
   const afterDispute=page.id===dispute.id?dispute:page;
   return {...afterDispute,...(overrides.get(page.id)||{})};
 });
 assert.deepEqual(effective,registry);
 const marketplace=JSON.parse(read('drizzle/migrations/0052_restore_existing_account_access.sql').match(/\$marketplace_lead_pages\$([\s\S]*?)\$marketplace_lead_pages\$/)[1]);
 // 0052 extends server-side default grants only. It must not be mistaken for
 // a frontend registry rewrite: saved permissions continue to take precedence.
 assert.equal(marketplace.length,8);
 assert.ok(marketplace.every(id=>seed.some(page=>page.id===id)));
 const repaired=seed.map(page=>marketplace.includes(page.id)
   ? {...page,restrictedRoles:[...page.restrictedRoles,'directeur_marketplace']}
   : page);
 for(const id of marketplace) {
   const effectiveServer=repaired.find(page=>page.id===id);
   assert.ok(effectiveServer.restrictedRoles.includes('directeur_marketplace'),id);
   assert.ok(registry.find(page=>page.id===id),'frontend page still present: '+id);
 }
 for(const r of registry)for(const alias of r.permissionAliases||[])assert.equal(intranet.moduleById(alias).id,r.id);
});
test('dynamic form values preserve zero, optional numbers and line data',()=>{
 const value=intranet.normalizeModulePayload([{key:'amount',type:'number'},{key:'empty',type:'number'},{key:'lines',type:'lines'}],{amount:'0',empty:'',lines:[{label:'Item',quantity:1,amount:0}],forged:'x'});
 assert.equal(value.amount,0);assert.equal(value.empty,null);assert.equal(value.lines[0].amount,0);assert.equal(value.forged,undefined);
});
const drive=load('supabase/functions/_shared/intranet-drive.ts');
test('Drive import accepts only strict Google HTTPS links or bounded IDs',()=>{
 for(const p of ['https://drive.google.com/file/d/abcdefghij_123/view','https://docs.google.com/document/d/abcdefghij_123/edit','abcdefghij_123'])assert.equal(drive.parseDriveId(p),'abcdefghij_123');
 for(const p of ['http://drive.google.com/file/d/abcdefghij_123','https://drive.google.com.evil.test/file/d/abcdefghij_123','https://user:pass@drive.google.com/file/d/abcdefghij_123','https://drive.google.com:8443/file/d/abcdefghij_123','https://127.0.0.1/file/d/abcdefghij_123','../private',null])assert.throws(()=>drive.parseDriveId(p));
 assert.equal(drive.workspaceEmail(' Staff@BIB.test ','bib.test'),'staff@bib.test');assert.throws(()=>drive.workspaceEmail('staff@bib.test.evil','bib.test'));
});
test('document input streams enforce byte limits without relying on Content-Length',async()=>{
 await assert.rejects(drive.readBoundedJson(new Request('https://bib.test',{method:'POST',body:'{"payload":"too big"}'}),5));
 await assert.rejects(drive.readBoundedJson(new Request('https://bib.test',{method:'POST',body:'[]'}),20));
 assert.equal((await drive.readBoundedJson(new Request('https://bib.test',{method:'POST',body:'{"ok":true}'}),100)).ok,true);
 assert.throws(()=>drive.decodeDocumentBase64('aGVsbG8=',2));assert.throws(()=>drive.decodeDocumentBase64('%%%'));
 assert.equal(new TextDecoder().decode(drive.decodeDocumentBase64('aGVsbG8=')),'hello');
});
test('Drive configuration fails closed and only permits the BIB custodian',()=>{
 assert.throws(()=>drive.getDriveConfig(()=>undefined));
 const config={BIB_WORKSPACE_DOMAIN:'bib.test',GOOGLE_SERVICE_ACCOUNT_EMAIL:'svc@test',GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:'key',BIB_DRIVE_CUSTODIAN:'custodian@bib.test',BIB_DRIVE_MANAGED_FOLDER_ID:'abcdefghij_123',BIB_APP_ORIGIN:'https://bib.test'};
 assert.equal(drive.getDriveConfig(k=>config[k]).custodian,'custodian@bib.test');
 for(const patch of [{BIB_DRIVE_CUSTODIAN:'custodian@other.test'},{BIB_APP_ORIGIN:'https://bib.test/path'},{BIB_APP_ORIGIN:'http://bib.test'}])assert.throws(()=>drive.getDriveConfig(k=>({...config,...patch})[k]));
});
test('managed folder ACL and effective download restrictions are verified',async()=>{
 const client=new drive.WorkspaceDrive({custodian:'custodian@bib.test'});client.metadata=async()=>({mimeType:'application/vnd.google-apps.folder',permissions:[{type:'anyone',role:'reader'}]});await assert.rejects(client.assertManagedFolder());
 client.metadata=async()=>({mimeType:'application/vnd.google-apps.folder',permissions:[{type:'user',emailAddress:'custodian@bib.test'}]});await client.assertManagedFolder();
 client.api=async()=>new Response('{}');client.metadata=async()=>({downloadRestrictions:{}});await assert.rejects(client.protect('abcdefghij_123'));
 client.metadata=async()=>({downloadRestrictions:{effectiveDownloadRestrictionWithContext:{restrictedForReaders:true,restrictedForWriters:true}}});await client.protect('abcdefghij_123');
});
test('confidential PDF watermark is embedded on every page and document scripts are removed',async()=>{
 const pdf=require('pdf-lib');const original=await pdf.PDFDocument.create();original.addPage();original.addPage();original.catalog.set(pdf.PDFName.of('OpenAction'),original.context.obj({S:'JavaScript',JS:'x'}));
 const service=load('supabase/functions/_shared/document-watermark.ts');const out=await service.watermarkDocument(await original.save(),'staff@bib.test','2026-10-29T12:00:00Z','trace-001');const parsed=await pdf.PDFDocument.load(out);
 assert.equal(parsed.getPageCount(),2);assert.equal(parsed.catalog.has(pdf.PDFName.of('OpenAction')),false);
 for(const page of parsed.getPages())assert.ok(page.node.Contents());assert.ok(out.byteLength>0);
 await assert.rejects(service.documentAsPdf(new TextEncoder().encode('not PDF'),'application/pdf'));
});
test('server spreadsheet exports neutralize formulas and add identity, timestamp and trace',()=>{
 const xlsx=require('xlsx'),service=load('supabase/functions/_shared/spreadsheet-export.ts');const bytes=service.createStampedSpreadsheet({headers:['Name','Amount'],rows:[['=HYPERLINK("evil")',25]]},'staff@bib.test','2026-10-29','trace-123');const book=xlsx.read(bytes,{type:'array'});
 assert.equal(book.Sheets['Données'].A2.v,'\'=HYPERLINK("evil")');assert.equal(book.Sheets['Données'].A2.f,undefined);assert.equal(book.Sheets['Traçabilité BIB'].B2.v,'staff@bib.test');assert.equal(book.Sheets['Traçabilité BIB'].B4.v,'trace-123');
 assert.throws(()=>service.createStampedSpreadsheet({headers:['x'],rows:[['x','y']]},'staff','date','trace'));
});
const ethics=load('supabase/functions/_shared/ethics-crypto.ts');
test('anonymous reports discard account contact fields before encryption',()=>{
 const report=ethics.normalizedEthicsReport({mode:'anonymous',category:'fraud',severity:'high',facts:'Observed facts',consent:true,name:'Private name',email:'private@bib.test',phone:'123'});assert.equal('name'in report,false);assert.equal('email'in report,false);assert.equal('phone'in report,false);
 assert.throws(()=>ethics.normalizedEthicsReport(null));assert.throws(()=>ethics.normalizedEthicsReport({facts:'x',category:'fraud',severity:'high',consent:false}));
});
test('ethics encryption round trips and rejects altered ciphertext or a different key',async()=>{
 const key=btoa('k'.repeat(32)),value={facts:'Confidential facts'};const envelope=await ethics.encryptEthics(value,key);assert.ok(!envelope.includes(value.facts));assert.equal((await ethics.decryptEthics(envelope,key)).facts,value.facts);
 const tampered=JSON.parse(envelope);tampered.data=(tampered.data[0]==='A'?'B':'A')+tampered.data.slice(1);await assert.rejects(ethics.decryptEthics(JSON.stringify(tampered),key));await assert.rejects(ethics.decryptEthics(envelope,btoa('x'.repeat(32))));
});
test('uncertain export retries reuse the original PDF bytes and operation key',async()=>{
 const calls=[];let fail=true;const exports=load('src/lib/exportUtils.ts',{'@/lib/driveDocuments':{currentDocumentPage:()=> 'finance.transactions',exportDocumentToDrive:async(...args)=>{calls.push(args);if(fail)throw new Error('timeout');return {id:'confirmed'}}}});
 const input={filename:'ledger',columns:[{header:'Title',accessor:'title'}],data:[{title:'Item'}]};await assert.rejects(exports.exportToPDF(input));fail=false;await exports.exportToPDF(input);assert.equal(calls[0][3],calls[1][3]);assert.deepEqual(calls[0][2],calls[1][2]);await exports.exportToPDF(input);assert.notEqual(calls[1][3],calls[2][3]);
});
