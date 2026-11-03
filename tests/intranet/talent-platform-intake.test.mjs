import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');

test('RH recruitment points to Platform Talent, not legacy Google Forms', () => {
  const page = read('src/pages/modules/rh/Recruitment.tsx');
  assert.match(page, /TalentPlatformInbox/);
  assert.match(page, /source officielle Platform/);
  assert.doesNotMatch(page, /docs\.google\.com\/forms/);
  assert.doesNotMatch(page, /docs\.google\.com\/spreadsheets/);
});

test('Talent intake requires RH authorization and dedicated server secret', () => {
  const fn = read('supabase/functions/pull-talent-applications/index.ts');
  const sql = read('supabase/migrations/20261103123000_hr_talent_platform_intake.sql');
  assert.match(fn, /can_access_rh_profiles/);
  assert.match(fn, /BIB_TALENT_BRIDGE_SECRET/);
  assert.match(fn, /intranet-talent-export/);
  assert.match(fn, /if \(!complete\)/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /platform_application_id uuid PRIMARY KEY/);
  assert.match(sql, /can_access_rh_profiles\(auth\.uid\(\)\)/);
});
