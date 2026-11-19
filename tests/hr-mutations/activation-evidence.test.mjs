import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../'+path, import.meta.url), 'utf8');
const sql=read('drizzle/migrations/0107_hr_activation_evidence_readonly.sql');
const ui=read('src/pages/modules/rh/Onboarding.tsx');
const hook=read('src/hooks/useHrOnboarding.ts');

test('read-only activation evidence requires authenticated, authorized RH role',()=>{
  assert.match(sql,/auth\.uid\(\) IS NULL OR NOT public\.can_hr_employee_mutation_action\('read'\)/);
  assert.match(sql,/SECURITY DEFINER/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.hr_onboarding_activation_evidence\(uuid\) FROM PUBLIC, anon/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.hr_onboarding_activation_evidence\(uuid\) TO authenticated/);
  assert.match(sql,/LEFT JOIN auth\.users u ON u\.id=r\.created_user_id/);
  assert.match(sql,/ar\.role_key=r\.requested_role/);
  assert.doesNotMatch(sql,/UPDATE public\.|INSERT INTO public\.|DELETE FROM public\./i);
  assert.doesNotMatch(sql,/RETURNS SETOF auth\.users/i);
});

test('the UI renders evidence conservatively and never silently completes onboarding',()=>{
  assert.match(hook,/useHrActivationEvidence/);
  assert.match(hook,/hr_onboarding_activation_evidence/);
  assert.match(ui,/Première connexion enregistrée/);
  assert.match(ui,/Affectation du rôle active/);
  assert.match(ui,/Non confirmé/);
  assert.match(ui,/recette connectée/);
  assert.match(ui,/activation\.isError/);
});
