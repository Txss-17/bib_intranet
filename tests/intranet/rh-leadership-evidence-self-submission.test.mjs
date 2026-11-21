import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../../supabase/migrations/20261121133500_rh_personnel_document_access_guard.sql', import.meta.url),
  'utf8',
);
const component = readFileSync(
  new URL('../../src/components/hr/LeadershipEvidenceUploader.tsx', import.meta.url),
  'utf8',
);
const leadership = readFileSync(
  new URL('../../src/components/hr/ExistingLeadershipOnboarding.tsx', import.meta.url),
  'utf8',
);

test('RH personnel documents do not inherit blanket access for other poles', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rh_can_access_employee_document/);
  assert.match(sql, /actor\.app_origin='connect'/);
  assert.match(sql, /actor\.hr_status='active'/);
  assert.match(sql, /actor\.test_account IS FALSE/);
  assert.match(sql, /employee\.id=p_employee_id/);
  assert.match(sql, /employee\.test_account IS FALSE/);
  assert.match(sql, /p_employee_id=\(SELECT auth\.uid\(\)\)/);
  assert.match(sql, /is_canonical_bib_ceo/);
  assert.match(sql, /portfolio\.owner_id=\(SELECT auth\.uid\(\)\)/);
  assert.match(sql, /member\.entity_id=p_employee_id/);
  assert.match(sql, /member\.ended_at IS NULL/);
  assert.match(sql, /'rh'=ANY\(manager\.poles::text\[\]\)/);
  assert.doesNotMatch(sql, /OR NOT public\.has_pole/);
  assert.match(sql, /p\.permissive='RESTRICTIVE'/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.rh_can_access_employee_document/);
  assert.match(sql, /TO authenticated, service_role/);
});

test('existing CEO/RH can register their own managed Drive evidence, not validate it', () => {
  assert.match(leadership, /<LeadershipEvidenceUploader subjectId=\{subject\.id\} \/>/);
  assert.match(leadership, /subject\.id===user\?\.id/);
  assert.match(component, /user\.id !== subjectId/);
  assert.match(component, /profile\?\.test_account === true/);
  assert.match(component, /FileUploadZone bucket="managed-drive"/);
  assert.match(component, /parsed\.origin !== window\.location\.origin/);
  assert.match(component, /parsed\.pathname !== '\/documents'/);
  assert.match(component, /uuidPattern\.test/);
  assert.match(component, /\.from\('rh_employee_documents'\)/);
  assert.match(component, /\.eq\('employee_id', user\.id\)/);
  assert.match(component, /employee_id: user\.id/);
  assert.match(component, /document_url: url/);
  assert.match(component, /document_type: type/);
  assert.match(component, /created_by: user\.id/);
  assert.match(component, /data\?\.document_reference/);
  assert.match(component, /En attente de vérification indépendante/);
  assert.doesNotMatch(component, /review_existing_leadership_onboarding_step/);
});
