import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('HR document guard restricts RH access to own portfolio, preserving CEO and self', () => {
 const sql=read('ops/release/rh-personal-document-rls-20261120.sql');
 assert.ok(sql.includes('rh_can_access_employee_document'));
 assert.ok(sql.includes('p.owner_id=(SELECT auth.uid())'));
 assert.ok(sql.includes('p_employee_id=(SELECT auth.uid())'));
 assert.ok(sql.includes('public.is_canonical_bib_ceo'));
 for (const action of ['SELECT','UPDATE','INSERT','DELETE']) assert.ok(sql.includes('FOR '+action+' TO authenticated'));
 assert.ok(sql.includes('AS RESTRICTIVE'));
 assert.ok(!sql.includes('GRANT ALL'));
});

test('candidate accepted by the RH owner can be bound once to onboarding by UUID', () => {
 const sql=read('ops/release/rh-candidate-onboarding-traceability-20261120.sql');
 assert.ok(sql.includes('ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES public.hr_candidates(id)'));
 assert.ok(sql.includes('hr_employee_requests_one_onboarding_per_candidate'));
 assert.ok(sql.includes("c.status<>'accepted'"));
 assert.ok(sql.includes('rh_candidate_link_immutable'));
 assert.ok(sql.includes('rh_candidate_referent_mismatch'));
 assert.ok(sql.includes('rh_candidate_not_owned_by_actor'));
 assert.ok(!sql.includes('ILIKE'));
});

test('onboarding UI preserves chosen candidate reference and RH referent', () => {
 const page=read('src/pages/modules/rh/Onboarding.tsx');
 const candidates=read('src/hooks/useMyAcceptedRhCandidates.ts');
 assert.ok(page.includes('useMyAcceptedRhCandidates(!mutation)'));
 assert.ok(page.includes('candidate_id: candidateId || null'));
 assert.ok(page.includes('manager_id: candidate.owner_id'));
 assert.ok(page.includes('disabled={referentsLoading || !!candidateId}'));
 assert.ok(page.includes("setCandidateId('')"));
 assert.ok(candidates.includes(".eq('owner_id', user!.id).eq('status','accepted')"));
});
