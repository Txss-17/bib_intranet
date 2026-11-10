import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../../drizzle/migrations/0090_partner_postapplication_workflows.sql', import.meta.url), 'utf8');
const component = readFileSync(new URL('../../src/components/operations/PartnerPostApplicationWorkflow.tsx', import.meta.url), 'utf8');
const suppliers = readFileSync(new URL('../../src/pages/modules/supplier/SupplierApplicationDetail.tsx', import.meta.url), 'utf8');
const logistics = readFileSync(new URL('../../src/pages/modules/ops/Partners.tsx', import.meta.url), 'utf8');

test('supplier precontract eligibility precedes contract and portal handoff', () => {
 for (const step of ['precontract_catalog_received','precontract_screened','contract_signed',
  'portal_access_recorded','catalog_received','catalog_reviewed','products_selected']) {
  assert.ok(sql.includes(step),step);
 }
 const segment = sql.slice(sql.indexOf("WHEN 'supplier' THEN CASE v_case.stage"));
 assert.ok(segment.indexOf("'precontract_screened'") < segment.indexOf("'contract_signed'"));
 assert.ok(segment.indexOf("'contract_signed'") < segment.indexOf("'portal_access_recorded'"));
 assert.match(sql,/invalid_partner_onboarding_transition/);
 assert.match(sql,/onboarding_stage_conflict/);
});

test('logistics contact and service needs acceptance precede signed contract', () => {
 const segment = sql.slice(sql.indexOf("WHEN 'application_received' THEN 'contact_completed'"));
 assert.ok(segment.indexOf("'requirements_sent'") < segment.indexOf("'requirements_accepted'"));
 assert.ok(segment.indexOf("'requirements_accepted'") < segment.indexOf("'contract_signed'"));
 assert.ok(segment.indexOf("'contract_signed'") < segment.indexOf("'portal_access_recorded'"));
 assert.match(sql,/platform_logistics_mapping_conflict/);
});

test('catalog documentary/certification evidence is product specific and controlled', () => {
 assert.match(sql,/UNIQUE\(case_id,sku\)/);
 assert.match(sql,/documentary_evidence jsonb/);
 assert.match(sql,/certification_evidence jsonb/);
 assert.match(sql,/audit_reuse_reference text/);
 assert.match(sql,/catalog_documentary_review_required/);
 assert.match(sql,/eligible_product_evidence_missing/);
 assert.match(sql,/jsonb_array_length\(p_documentary\)=0/);
 assert.doesNotMatch(sql,/INSERT INTO public.products/);
});

test('governed RPCs and RLS keep invitations and publication outside the workflow', () => {
 assert.match(sql,/REVOKE ALL ON public.bib_partner_onboarding_cases/);
 assert.match(sql,/can_intranet_action\('ops.partners'/);
 assert.match(sql,/can_intranet_action\('supplier.applications'/);
 assert.match(sql,/test_account=public.intranet_is_test_mode\(\)/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public.bib_advance_partner_onboarding/);
 assert.match(component,/La signature du contrat ne transmet pas automatiquement/);
 assert.doesNotMatch(component,/send-transactional-email|createUser|generateLink|access_token:/);
 assert.match(suppliers,/PartnerPostApplicationWorkflow kind="supplier"/);
 assert.match(logistics,/PartnerPostApplicationWorkflow key=\{selectedOnboarding\} kind="logistics"/);
});

const migration93 = readFileSync(new URL('../../drizzle/migrations/0093_logistics_provider_contract_review.sql', import.meta.url), 'utf8');
test('provider contract is received and independently reviewed before signed access', () => {
 const received = migration93.indexOf("WHEN 'requirements_accepted' THEN 'provider_contract_received'");
 const reviewed = migration93.indexOf("WHEN 'provider_contract_received' THEN 'provider_contract_reviewed'");
 const signed = migration93.indexOf("WHEN 'provider_contract_reviewed' THEN 'contract_signed'");
 assert.ok(received >= 0 && received < reviewed && reviewed < signed);
 assert.match(migration93,/can_intranet_action\('compliance.contracts','update'\)/);
 assert.match(migration93,/independent_legal_review_required/);
 assert.match(migration93,/logistics_legal_review_required/);
 assert.match(migration93,/provider_contract_review_missing/);
 assert.match(migration93,/signed_contract_and_gateway_permission_required/);
 assert.match(component,/Contrat du logisticien et annexes reçus/);
 assert.match(component,/Contrat examiné et validé par le pôle Juridique/);
});
