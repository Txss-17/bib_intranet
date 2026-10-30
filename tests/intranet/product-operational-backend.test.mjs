import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url),'utf8');

test('Product-only API is used by product screens without enabling generic intranet records globally',()=>{
 const hooks=read('src/hooks/useIntranetRecords.ts');
 for(const rpc of [
  'product_people','product_list_records','product_record_events','product_save_record',
  'product_transition_record','product_comment_record','product_get_record',
 ]) assert.ok(hooks.includes(rpc),rpc);
 assert.match(hooks,/productRoute\(page\)/);
 const work=read('src/components/operations/ModuleWorkspace.tsx');
 assert.match(work,/useIntranetPeople\(d\.scope\)/);
 assert.match(work,/useIntranetRecord\(selectedId,d\.scope\)/);
 assert.match(work,/useIntranetRecordEvents\(selected\?\.id,d\.scope\)/);
 const overview=read('src/components/operations/OperationsOverview.tsx');
 assert.match(overview,/product_module_summary/);
});

test('Product DB protects records, revision transitions, and independent review',()=>{
 const sql=read('drizzle/migrations/0066_product_workflow_records.sql');
 for(const check of [
  'ENABLE ROW LEVEL SECURITY','product_record_visible','product_work_member',
  'Revision changed','Independent reviewer required','ON CONFLICT(created_by,client_key)',
  'Record locked','Product writer role required','test_account IS FALSE'
 ]) assert.ok(sql.includes(check),check);
 assert.match(sql,/GRANT SELECT ON public\.product_work_records/);
 assert.match(sql,/REVOKE ALL ON public\.product_work_records/);
 assert.doesNotMatch(sql,/GRANT INSERT ON public\.product_work_records TO authenticated/);
 assert.doesNotMatch(sql,/CREATE OR REPLACE FUNCTION public\.save_intranet_record/);
});

test('Release workflow is evidence-backed but never claims to execute CI or deployment',()=>{
 const sql=read('drizzle/migrations/0065_product_release_tracking.sql');
 const page=read('src/pages/modules/product/ProductReleases.tsx');
 const app=read('src/App.tsx');
 const nav=read('src/data/moduleNavigations.ts');
 assert.match(sql,/product_release_approved_evidence/);
 assert.match(sql,/Approved release required before recording deployment/);
 assert.match(sql,/Security review required for production/);
 assert.match(sql,/status NOT IN \('approved','released','rolled_back'\)/);
 assert.match(page,/ne déclenche aucun build ou déploiement/);
 assert.match(page,/save_product_release_tracking/);
 assert.match(app,/path="\/pole\/product\/releases"/);
 assert.match(nav,/Livraisons & recettes/);
});
