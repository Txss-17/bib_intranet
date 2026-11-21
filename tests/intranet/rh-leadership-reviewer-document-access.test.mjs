import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const permissions = read('supabase/migrations/20261121140000_rh_leadership_evidence_review_grants.sql');
const proof = read('supabase/migrations/20261121140500_rh_leadership_proof_view_audit.sql');
const handler = read('supabase/functions/intranet-drive/index.ts');
const control = read('src/components/hr/LeadershipEvidenceReviewAccess.tsx');
const leadership = read('src/components/hr/ExistingLeadershipOnboarding.tsx');

test('CEO/RH evidence grants are explicit, time bounded, revocable and audited', () => {
  assert.match(permissions, /CREATE TABLE IF NOT EXISTS public\.hr_leadership_document_review_grants/);
  assert.match(permissions, /ALTER TABLE public\.hr_leadership_document_review_grants ENABLE ROW LEVEL SECURITY/);
  assert.match(permissions, /REVOKE ALL ON public\.hr_leadership_document_review_grants FROM PUBLIC,anon,authenticated/);
  assert.match(permissions, /expires_at<=granted_at\+interval '14 days'/);
  assert.match(permissions, /subject_id<>reviewer_id/);
  assert.match(permissions, /public\.rh_leadership_evidence_reviewer_allowed\(actor\)/);
  assert.match(permissions, /public\.rh_leadership_evidence_reviewer_allowed\(p_reviewer_id\)/);
  assert.match(permissions, /f\.owner_id=actor/);
  assert.match(permissions, /d\.employee_id=actor/);
  assert.match(permissions, /grant_\.document_id=b\.document_id/);
  assert.match(permissions, /grant_\.subject_id=b\.employee_id/);
  assert.match(permissions, /grant_\.reviewer_id=\(SELECT auth\.uid\(\)\)/);
  assert.match(permissions, /grant_\.revoked_at IS NULL AND grant_\.expires_at>now\(\)/);
  assert.match(permissions, /public\.rh_leadership_evidence_reviewer_allowed\(grant_\.subject_id\)/);
  assert.match(permissions, /public\.rh_revoke_leadership_evidence_review/);
  assert.match(permissions, /public\.hr_leadership_document_review_events/);
  assert.match(permissions, /'granted'/);
  assert.match(permissions, /'revoked'/);
});

test('a recorded metadata lookup cannot substitute for prepared PDF and reviewer remains authorized at signature', () => {
  assert.match(proof, /WHEN 'identity' THEN d\.document_type IN \('identity','administrative'\)/);
  assert.match(proof, /WHEN 'documents' THEN d\.document_type IN \('charter','policy','contract','regulatory'\)/);
  assert.match(proof, /WHEN 'integration' THEN d\.document_type IN \('training','administrative'\)/);
  assert.match(proof, /event\.action='pdf_prepared'/);
  assert.match(proof, /event\.actor_id=NEW\.reviewer_id/);
  assert.match(proof, /event\.created_at>=v_document_created_at/);
  assert.match(proof, /event\.created_at>=now\(\)-interval '30 days'/);
  assert.match(proof, /public\.can_read_intranet_drive_document\(v_file\)/);
  assert.match(proof, /leadership_evidence_review_access_required/);
  assert.match(proof, /leadership_evidence_not_opened_by_reviewer/);
  assert.match(handler, /await drive\.bytes\(config\.custodian, file\)/);
  assert.match(handler, /await watermarkDocument\(pdf, email/);
  assert.match(handler, /action: 'pdf_prepared'/);
  assert.ok(handler.indexOf('await watermarkDocument(pdf, email') < handler.indexOf("action: 'pdf_prepared'"));
  assert.match(handler, /createClient\(url, auditKey/);
  assert.match(handler, /previewAuditError/);
});

test('subject nominates reviewer, reviews grants, can revoke, while reviewer opens controlled document', () => {
  assert.match(control, /rh_my_leadership_evidence_reviewers/);
  assert.match(control, /rh_my_leadership_evidence_files/);
  assert.match(control, /rh_my_leadership_evidence_review_grants/);
  assert.match(control, /rh_grant_leadership_evidence_review/);
  assert.match(control, /rh_revoke_leadership_evidence_review/);
  assert.match(control, /user\.id === subjectId/);
  assert.match(control, /profile\?\.test_account !== true/);
  assert.match(control, /Autoriser la consultation de cette pièce/);
  assert.match(leadership, /rh_open_leadership_evidence/);
  assert.match(leadership, /Ouvrir la pièce dans Documents BIB/);
  assert.match(leadership, /LeadershipEvidenceReviewAccess subjectId=\{subject\.id\}/);
  assert.match(leadership, /leadership_evidence_not_opened_by_reviewer/);
  assert.doesNotMatch(control, /review_existing_leadership_onboarding_step/);
});
