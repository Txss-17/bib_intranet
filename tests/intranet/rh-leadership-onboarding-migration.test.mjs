import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../../supabase/migrations/20261110221500_existing_ceo_rh_onboarding_steps.sql', import.meta.url),
  'utf8',
);
const component = readFileSync(
  new URL('../../src/components/hr/ExistingLeadershipOnboarding.tsx', import.meta.url),
  'utf8',
);

test('leadership onboarding migration compiles with PostgreSQL reserved position name quoted', () => {
  assert.match(sql, /display_name text, "position" text, step_key text/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.list_existing_leadership_onboarding\(/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.review_existing_leadership_onboarding_step\(/);
});

test('seven evidence-driven steps are separate from identity and roles', () => {
  for (const key of ['identity','assignment','documents','hr_review','independent_review','access_security','integration']) {
    assert.ok(sql.includes(`'${key}'`));
  }
  assert.match(sql, /validated_step_has_proof/);
  assert.match(sql, /v_actor=p_subject/);
  assert.match(sql, /Previous onboarding steps are not validated/);
  assert.match(sql, /Independent visa requires a different reviewer/);
  assert.match(sql, /hr_existing_account_onboarding_events/);
  assert.match(component, /user\?\.id!==subject\.id/);
  assert.match(component, /Valider avec preuve/);
});
