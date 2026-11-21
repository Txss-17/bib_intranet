import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const guard = read('supabase/migrations/20261121130000_rh_leadership_proof_integrity.sql');
const options = read('supabase/migrations/20261121130100_rh_leadership_evidence_options.sql');
const ui = read('src/components/hr/ExistingLeadershipOnboarding.tsx');

test('leadership evidence is subject-bound to a real onboarding, active RBAC or managed BIB file', () => {
  assert.match(guard, /CREATE OR REPLACE FUNCTION public\.rh_leadership_evidence_verifiable/);
  assert.match(guard, /r\.created_user_id=p_subject/);
  assert.match(guard, /a\.employee_id=p_subject AND a\.status='active'/);
  assert.match(guard, /d\.employee_id=p_subject/);
  assert.match(guard, /d\.document_reference=v_reference/);
  assert.match(guard, /JOIN public\.intranet_drive_documents file/);
  assert.match(guard, /file\.test_account IS FALSE AND file\.size_bytes>0/);
  assert.match(guard, /nullif\(btrim\(file\.file_id\),''\) IS NOT NULL/);
  assert.match(guard, /lower\(v_reference\) IN \('aucun'/);
  assert.match(guard, /REVOKE ALL ON FUNCTION public\.rh_leadership_evidence_verifiable/);
});

test('historical unsupported approvals are reopened with system corrections, not attributed to a user', () => {
  assert.match(guard, /CREATE TABLE IF NOT EXISTS public\.hr_existing_onboarding_evidence_reconciliation/);
  assert.match(guard, /CREATE TEMP TABLE _rh_invalid_leadership_approvals/);
  assert.match(guard, /UPDATE public\.hr_existing_account_onboarding_steps s/);
  assert.match(guard, /SET status='pending',evidence_ref=NULL,reviewer_id=NULL,reviewed_at=NULL/);
  assert.match(guard, /'migration_reconciliation'/);
  assert.doesNotMatch(guard, /DELETE FROM public\.hr_existing_account_onboarding_events/);
});

test('server and direct table writes reject fake proof and preserve independence', () => {
  assert.match(guard, /CREATE OR REPLACE FUNCTION public\.rh_guard_leadership_step_proof/);
  assert.match(guard, /CREATE TRIGGER trg_rh_guard_leadership_step_proof/);
  assert.match(guard, /validated_leadership_evidence_not_placeholder/);
  assert.match(guard, /leadership_evidence_not_verifiable/);
  assert.match(guard, /leadership_review_note_required/);
  assert.match(guard, /actor=p_subject/);
  assert.match(guard, /p_step='independent_review'/);
  assert.match(guard, /s\.reviewer_id=actor/);
  assert.match(guard, /public\.rh_leadership_evidence_verifiable\(s\.subject_id,s\.step_key,s\.evidence_ref\)/);
  assert.match(guard, /FOR UPDATE/);
});

test('available proof choices are backed by the same server verifier and restricted to RH readers', () => {
  assert.match(options, /CREATE OR REPLACE FUNCTION public\.rh_leadership_evidence_options/);
  assert.match(options, /public\.get_hr_onboarding_permissions\(\)/);
  assert.match(options, /public\.rh_leadership_evidence_verifiable/);
  assert.match(options, /'ACCESS:'\|\|a\.id::text/);
  assert.match(options, /REVOKE ALL ON FUNCTION public\.rh_leadership_evidence_options/);
  assert.match(options, /TO authenticated/);
});

test('RH reviewer receives registered references, cannot validate Aucun and sees reopening reason', () => {
  assert.match(ui, /rh_leadership_evidence_options/);
  assert.match(ui, /registeredEvidenceOptions\.filter/);
  assert.match(ui, /Aucune référence justificative disponible/);
  assert.match(ui, /hasPossibleReferenceFormat/);
  assert.match(ui, /Contrôle rouvert/);
  assert.match(ui, /independentReviewerConflict/);
  assert.match(ui, /Valider avec preuve vérifiable/);
  assert.match(ui, /!referenceReady\|\|!noteReady/);
});
