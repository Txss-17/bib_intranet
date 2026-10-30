import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = (p) => readFileSync(new URL('../../'+p, import.meta.url),'utf8');
const edge=source('supabase/functions/provision-employee-account/index.ts');
const reset=source('src/pages/ResetPassword.tsx');
const login=source('src/pages/Login.tsx');
test('Invitation path is a server-owned approved redirect and never relies on arbitrary input',()=>{
 assert.match(edge,/inviteOrigins = new Set/);
 assert.match(edge,/https:\/\/bib-intranet\.lovable\.app/);
 assert.match(edge,/https:\/\/workspace\.brand-in-a-box\.space/);
 assert.match(edge,/inviteOrigins\.has\(inviteOrigin\)/);
 assert.match(edge,/redirectTo:\s*\x60\$\{inviteOrigin\}\/reset-password\x60/);
 assert.match(edge,/reserve_hr_onboarding_invitation/);
 assert.match(edge,/hr_onboarding_attempt_nonce/);
 assert.match(edge,/app_origin: 'connect'/);
});
test('Password creation requires a verified Supabase session rather than trusting URL strings',()=>{
 assert.match(reset,/supabase\.auth\.onAuthStateChange\(\(_event, session\)/);
 assert.match(reset,/setIsRecovery\(Boolean\(session\)\)/);
 assert.doesNotMatch(reset,/hash\.includes\('type=recovery'\)/);
 assert.match(reset,/supabase\.auth\.updateUser\(\{ password \}\)/);
});
test('Talent sign-in preserves real staff profile verification',()=>{
 assert.match(login,/profile\.app_origin !== 'connect'/);
 assert.match(login,/profile\.hr_status !== 'active'/);
 assert.match(login,/profile\.id !== user\.id/);
 assert.match(login,/supabase\.auth\.signOut\(\)/);
 assert.doesNotMatch(login,/endsWith\('@brand-in-a-box.space'\)/);
});
