import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fn = readFileSync(new URL('../../supabase/functions/provision-employee-account/index.ts', import.meta.url),'utf8');
const migration = readFileSync(new URL('../../drizzle/migrations/0106_hr_invitation_rpc_execute.sql', import.meta.url),'utf8');

test('provisioning keeps the RH dossier in account_created until activation is verified',()=>{
  assert.match(fn,/status:\s*'account_created'/);
  assert.doesNotMatch(fn,/status:\s*'completed'/);
  assert.match(fn,/to_status:\s*'account_created'/);
});
test('invitation reservation is only directly executable by authenticated RH subject, with no anonymous privilege',()=>{
  assert.match(migration,/GRANT EXECUTE ON FUNCTION public\.reserve_hr_onboarding_invitation\(uuid,uuid\) TO authenticated/);
  assert.match(migration,/REVOKE ALL ON FUNCTION public\.reserve_hr_onboarding_invitation\(uuid,uuid\) FROM PUBLIC, anon/);
  assert.match(fn,/caller\.rpc\(\s*'reserve_hr_onboarding_invitation'/);
});
