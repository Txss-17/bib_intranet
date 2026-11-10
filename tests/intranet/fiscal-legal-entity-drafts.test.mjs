import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../../drizzle/migrations/0098_ceo_fiscal_legal_entity_drafts.sql',import.meta.url),'utf8');
const ui=readFileSync(new URL('../../src/components/finance/fiscal/FiscalEntityDrafts.tsx',import.meta.url),'utf8');
const page=readFileSync(new URL('../../src/pages/modules/finance/FiscalGovernance.tsx',import.meta.url),'utf8');
const journal=JSON.parse(readFileSync(new URL('../../drizzle/migrations/meta/_journal.json',import.meta.url),'utf8'));

test('migration is uniquely sequenced and does not rewrite fiscal records',()=>{
 const entry=journal.entries.find(x=>x.tag==='0098_ceo_fiscal_legal_entity_drafts');
 assert.equal(entry?.idx,98);
 assert.equal(journal.entries.filter(x=>x.idx===98).length,1);
 assert.doesNotMatch(sql,/UPDATE public\.bib_fiscal_records|ALTER TABLE public\.bib_fiscal_records/);
 assert.doesNotMatch(sql,/CREATE (OR REPLACE )?FUNCTION public\.list_bib_fiscal_records/);
});

test('entity draft RPCs require actual canonical CEO identity',()=>{
 assert.match(sql,/p\.position='ceo' AND p\.test_account IS FALSE/);
 assert.match(sql,/p\.app_origin='connect' AND p\.hr_status='active'/);
 assert.match(sql,/ar\.role_key='ceo' AND ar\.status='active'/);
 assert.match(sql,/public\.is_intranet_staff\(p\.id\)/);
 assert.match(sql,/fiscal_entity_ceo_only/);
 assert.doesNotMatch(sql,/GRANT (SELECT|INSERT|UPDATE|DELETE) ON public\.bib_fiscal_legal_entities TO authenticated/);
});

test('entity registration cannot activate corporate tax or legal status',()=>{
 assert.match(sql,/status text NOT NULL DEFAULT 'project' CHECK \(status='project'\)/);
 assert.doesNotMatch(sql,/CREATE (OR REPLACE )?FUNCTION public\.activate_/);
 assert.match(ui,/aucune déclaration activée/i);
 assert.match(page,/FiscalEntityDrafts/);
});
