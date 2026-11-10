import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const sql=read('drizzle/migrations/0099_fiscal_entity_isolation.sql');
const journal=JSON.parse(read('drizzle/migrations/meta/_journal.json'));

test('migration 0099 follows CEO project registry with a unique journal entry',()=>{
 const a=journal.entries.find(x=>x.idx===98),b=journal.entries.find(x=>x.idx===99);
 assert.equal(a?.tag,'0098_ceo_fiscal_legal_entity_drafts');
 assert.equal(b?.tag,'0099_fiscal_entity_isolation');
 assert.equal(journal.entries.filter(x=>x.idx===99).length,1);
});

test('never infer legal entity from free text or autoactivate a project',()=>{
 assert.match(sql,/Do not backfill from the free-text body.entity field/);
 assert.match(sql,/AND e.status='active'/);
 assert.match(sql,/No grant RPC yet/);
 assert.doesNotMatch(sql,/UPDATE public\.bib_fiscal_legal_entities SET status='active'/);
});

test('fiscal entity checks gate direct table reads and all three public RPCs',()=>{
 for(const name of ['bib_fiscal_catalog_read','bib_fiscal_records_read','bib_fiscal_events_read']){
  assert.match(sql,new RegExp('CREATE POLICY '+name));
 }
 assert.match(sql,/bib_fiscal_record_allowed\(record_id,test_account,'read'\)/);
 assert.match(sql,/ALTER FUNCTION public\.list_bib_fiscal_records\(\) RENAME TO bib_fiscal_list_internal_0088/);
 assert.match(sql,/ALTER FUNCTION public\.save_bib_fiscal_record\(jsonb,bigint\) RENAME TO bib_fiscal_save_internal_0088/);
 assert.match(sql,/ALTER FUNCTION public\.list_bib_fiscal_events\(text\) RENAME TO bib_fiscal_events_internal_0088/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.bib_fiscal_list_internal_0088/);
 assert.match(sql,/fiscal_entity_write_forbidden/);
 assert.match(sql,/fiscal_entity_history_forbidden/);
});

test('only CEO may attribute an unlinked dossier, without rewriting history',()=>{
 assert.match(sql,/CREATE FUNCTION public\.bib_assign_fiscal_record_entity/);
 assert.match(sql,/IF NOT public\.bib_fiscal_is_canonical_ceo\(\) OR p_test/);
 assert.match(sql,/fiscal_entity_mapping_already_exists/);
 assert.match(sql,/bib_fiscal_governance_events/);
 assert.doesNotMatch(sql,/UPDATE public\.bib_fiscal_records SET/);
});
