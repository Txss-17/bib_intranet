import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync(new URL('../../src/pages/modules/rh/Onboarding.tsx',import.meta.url),'utf8');
const types=readFileSync(new URL('../../src/hooks/useHrOnboarding.ts',import.meta.url),'utf8');

test('account settings render in request detail sheet, not only new-employee dialog',()=>{
 const details=page.slice(page.indexOf('function RequestSheet({'),page.indexOf('export default function Onboarding()'));
 assert.match(details,/Paramètres du compte/);
 assert.match(details,/request\.work_mode/);
 assert.match(details,/request\.subsidiary/);
 assert.match(details,/request\.primary_pole/);
 assert.match(details,/request\.requested_role/);
 assert.match(details,/request\.attached_documents/);
 assert.match(details,/aria-label="Paramètres du compte du dossier"/);
});

test('document links open safely and missing values do not crash rejected dossiers',()=>{
 assert.match(page,/Array\.isArray\(request\.attached_documents\)/);
 assert.match(page,/request\.subsidiary\?\.trim\(\) \|\| 'Non renseignée'/);
 assert.match(page,/rel="noopener noreferrer"/);
 assert.match(page,/\^https:/);
 assert.match(types,/attached_documents\?:/);
});
