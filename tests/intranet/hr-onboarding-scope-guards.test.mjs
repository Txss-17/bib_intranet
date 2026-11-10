import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hr=readFileSync(new URL('../../src/pages/modules/rh/Onboarding.tsx',import.meta.url),'utf8');
const partner=readFileSync(new URL('../../src/components/operations/PartnerPostApplicationWorkflow.tsx',import.meta.url),'utf8');

test('new HR onboarding does not preselect Ops as an implicit role scope',()=>{
 assert.match(hr,/const \[primaryPole, setPrimaryPole\] = useState\(''\)/);
 assert.match(hr,/const \[poles, setPoles\] = useState<string\[\]>\(\[\]\)/);
 assert.match(hr,/Boolean\(primaryPole\)/);
 assert.match(hr,/poles\.includes\(primaryPole\)/);
});

test('HR entity label is not portrayed as verified legal entity or fiscal grant',()=>{
 assert.match(hr,/Entité de rattachement déclarée \(à vérifier\)/);
 assert.match(hr,/ne donne pas, à elle seule, accès au pilotage fiscal/);
 assert.match(hr,/pas une activation d'entité fiscale/);
});

test('partner workflows distinguish contract visa and Gateway proof',()=>{
 assert.match(partner,/pendingLegalContractReview/);
 assert.match(partner,/pendingAccessProof/);
 assert.match(partner,/transition\.isPending\|\|pendingLegalContractReview\|\|pendingAccessProof/);
});
