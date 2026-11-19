import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const sql=read('drizzle/migrations/0108_hr_controlled_completion.sql');
const ui=read('src/pages/modules/rh/Onboarding.tsx');
const hook=read('src/hooks/useHrOnboarding.ts');

test('only an authorized second HR reviewer can close an activated account',()=>{
  assert.match(sql,/can_hr_employee_mutation_action\('validate'\)/);
  assert.match(sql,/actor = req\.account_created_by/);
  assert.match(sql,/actor = req\.hr_validated_by/);
  assert.match(sql,/candidate\.email_confirmed_at IS NULL/);
  assert.match(sql,/candidate\.last_sign_in_at IS NULL/);
  assert.match(sql,/aa\.status='active'/);
  assert.match(sql,/ar\.role_key=req\.requested_role/);
  assert.match(sql,/char_length\(v_note\)<30/);
  assert.match(sql,/hr_completion_independent_review_required/);
});

test('completion proof is written transactionally and direct status bypass is blocked',()=>{
  assert.match(sql,/INSERT INTO public\.hr_onboarding_completions/);
  assert.match(sql,/TRIGGER trg_hr_guard_onboarding_completion/);
  assert.match(sql,/BEFORE UPDATE OF status/);
  assert.match(sql,/NOT EXISTS \(/);
  assert.match(sql,/completed_by = auth\.uid\(\)/);
  assert.match(sql,/REVOKE ALL ON public\.hr_onboarding_completions FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.complete_hr_employee_onboarding\(uuid,text\) TO authenticated/);
});

test('UI has explicit confirmation, note and server mutation; no implicit complete step',()=>{
  assert.match(ui,/Je confirme avoir vérifié la connexion/);
  assert.match(ui,/completionNote\.trim\(\)\.length < 30/);
  assert.match(ui,/Valider la clôture RH/);
  assert.match(ui,/completeOnboarding\.mutate/);
  assert.match(hook,/complete_hr_employee_onboarding/);
  assert.match(hook,/if \(data !== true\)/);
});
