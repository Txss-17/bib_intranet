import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const sql=read('drizzle/migrations/0100_fiscal_entity_approval_and_delegations.sql');
const journal=JSON.parse(read('drizzle/migrations/meta/_journal.json'));
const ui=read('src/components/finance/fiscal/FiscalEntityOperations.tsx');
const hub=read('src/components/finance/fiscal/FiscalHub.tsx');
const page=read('src/pages/modules/finance/FiscalGovernance.tsx');

test('migration order 0098 → 0099 → 0100 keeps original fiscal records intact',()=>{
 assert.deepEqual(journal.entries.slice(-3).map(x=>x.idx),[98,99,100]);
 assert.equal(journal.entries.at(-1).tag,'0100_fiscal_entity_approval_and_delegations');
 assert.doesNotMatch(sql,/TRUNCATE|DELETE FROM public\.bib_fiscal_records|UPDATE public\.bib_fiscal_records/);
});
test('legal review must be independent before CEO can activate verified legal entity',()=>{
 assert.match(sql,/compliance\.contracts','validate'/);
 assert.match(sql,/e\.created_by=auth\.uid\(\)/);
 assert.match(sql,/reviewed_by<>created_by/);
 assert.match(sql,/status='reviewed'/);
 assert.match(sql,/status='active'/);
 assert.match(sql,/independent_legal_verification_required/);
 assert.match(sql,/registration_identifier/);
 assert.match(ui,/Juridique · Vérification indépendante des entités/);
 assert.match(ui,/Direction · Activation et suspension des entités/);
});
test('fiscal access grants are per user and entity, expire and can be revoked',()=>{
 assert.match(sql,/g\.expires_at IS NULL OR g\.expires_at>now\(\)/);
 assert.match(sql,/p_expires_at>now\(\)\+interval '365 days'/);
 assert.match(sql,/p\.app_origin='connect'/);
 assert.match(sql,/p\.test_account IS FALSE/);
 assert.match(sql,/bib_revoke_fiscal_entity_access/);
 assert.match(sql,/e\.status='active'/);
 assert.match(ui,/Aucun accès automatique par pôle/);
 assert.match(ui,/Révoquer/);
});
test('CEO saved views are presentation only and server result provides canonical entity id',()=>{
 assert.match(sql,/CREATE TABLE public\.bib_fiscal_saved_views/);
 assert.match(sql,/owner_id=auth\.uid\(\)/);
 assert.match(sql,/public\.bib_fiscal_record_allowed\(x\.value->>'id'/);
 assert.match(sql,/jsonb_build_object\('legalEntityId',l\.entity_id\)/);
 assert.match(hub,/r\.legalEntityId!==filters\.entityId/);
 assert.match(hub,/r\.status!==filters\.status/);
 assert.match(ui,/vue n'élargit jamais les droits/);
 assert.match(page,/<FiscalEntityOperations\/>/);
});
