import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL('../../'+path, import.meta.url),'utf8');

const registry=read('supabase/migrations/20261121161500_rh_identity_attestation_no_copy.sql');
const integration=read('supabase/migrations/20261121162000_rh_identity_attestation_leadership_integration.sql');
const manage=read('supabase/migrations/20261121162500_rh_identity_attestation_manage.sql');
const cascade=read('supabase/migrations/20261121163000_rh_reopen_after_identity_revocation.sql');
const form=read('src/components/hr/LeadershipIdentityAttestation.tsx');
const leadership=read('src/components/hr/ExistingLeadershipOnboarding.tsx');

test('server creates in-person identity attestation without any copy, ID number or file reference',()=>{
  assert.match(registry,/CREATE TABLE IF NOT EXISTS public\.hr_leadership_identity_attestations/);
  assert.match(registry,/method='in_person_original'/);
  assert.match(registry,/original_inspected boolean NOT NULL DEFAULT true CHECK \(original_inspected\)/);
  assert.match(registry,/subject_matched boolean NOT NULL DEFAULT true CHECK \(subject_matched\)/);
  assert.match(registry,/apparent_validity_checked boolean NOT NULL DEFAULT true CHECK/);
  assert.match(registry,/no_copy_retained boolean NOT NULL DEFAULT true CHECK/);
  assert.match(registry,/identity_attestation_not_self/);
  assert.match(registry,/p_subject=v_actor/);
  assert.match(registry,/rh_leadership_evidence_reviewer_allowed\(v_actor\)/);
  assert.match(registry,/get_hr_onboarding_permissions/);
  assert.match(registry,/test_account IS FALSE/);
  assert.match(registry,/BIB-RH-IDV-/);
  assert.match(registry,/request_key/);
  assert.match(registry,/identity_attestation_checks_incomplete/);
  assert.doesNotMatch(registry,/INSERT INTO public\.intranet_drive_documents/);
  assert.doesNotMatch(registry,/INSERT INTO storage\.objects/);
});

test('HR identity verification is not satisfied by merely creating an account or registering a Drive document',()=>{
  assert.match(integration,/IF p_step='identity' THEN/);
  assert.match(integration,/\^BIB-RH-IDV-/);
  assert.match(integration,/a\.subject_id=p_subject/);
  assert.match(integration,/a\.status='verified'/);
  assert.match(integration,/a\.revoked_at IS NULL/);
  assert.match(integration,/a\.no_copy_retained IS TRUE/);
  assert.match(integration,/IF p_step IN \('documents','hr_review','independent_review','access_security','integration'\)/);
  assert.match(integration,/JOIN public\.hr_leadership_identity_attestations a ON a\.subject_id=p\.id/);
  assert.doesNotMatch(integration,/r\.created_user_id AS id,'identity'/);
});

test('the current attestation is unique, revocable, audited, and not directly readable',()=>{
  assert.match(manage,/uq_rh_leadership_one_current_identity_attestation/);
  assert.match(manage,/WHERE status='verified'/);
  assert.match(registry,/hr_leadership_identity_attestation_events/);
  assert.match(registry,/rh_revoke_leadership_identity_attestation/);
  assert.match(registry,/status='revoked'/);
  assert.match(registry,/revocation_reason/);
  assert.match(registry,/ENABLE ROW LEVEL SECURITY/);
  assert.match(registry,/REVOKE ALL ON public\.hr_leadership_identity_attestations FROM PUBLIC,anon,authenticated/);
  assert.match(manage,/REVOKE ALL ON FUNCTION public\.rh_my_identity_attestations/);
});

test('reviewer must confirm real-world in-person checks, and filing never auto-validates an onboarding stage',()=>{
  assert.match(form,/rh_record_leadership_identity_attestation/);
  assert.match(form,/p_method: 'in_person_original'/);
  assert.match(form,/original: false, match: false, validity: false, noCopy: false/);
  assert.match(form,/checks\.every\(c => confirmed\[c.key\]\)/);
  assert.match(form,/user\.id !== subjectId/);
  assert.match(form,/rh_revoke_leadership_identity_attestation/);
  assert.match(form,/aucune copie|Aucun numéro de pièce/i);
  assert.doesNotMatch(form,/review_existing_leadership_onboarding_step/);
  assert.match(leadership,/LeadershipIdentityAttestation/);
  assert.match(leadership,/subject\.id!==user\?\.id/);
  assert.match(leadership,/const registeredIdentity = \^?\/\^BIB-RH-IDV-/);
  assert.doesNotMatch(leadership,/registeredOnboarding\.test\(ref\)/);
});

test('identity revocation reopens all dependent approvals while preserving their original reviewer trail',()=>{
  assert.match(cascade,/rh_reopen_leadership_after_identity_revocation/);
  assert.match(cascade,/AFTER UPDATE OF status ON public\.hr_leadership_identity_attestations/);
  assert.match(cascade,/OLD\.status='verified' AND NEW\.status='revoked'/);
  assert.match(cascade,/INSERT INTO public\.hr_existing_onboarding_evidence_reconciliation/);
  assert.match(cascade,/previous_evidence_ref/);
  assert.match(cascade,/previous_reviewer_id/);
  assert.match(cascade,/correction_source/);
  assert.match(cascade,/identity_attestation_revoked/);
  assert.match(cascade,/UPDATE public\.hr_existing_account_onboarding_steps s/);
  assert.match(cascade,/SET status='pending',evidence_ref=NULL,reviewer_id=NULL,reviewed_at=NULL/);
  assert.doesNotMatch(cascade,/DELETE FROM public\.hr_existing_account_onboarding_events/);
});
