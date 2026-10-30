import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('environnements : historique réel et statuts inconnus explicités', () => {
  const source = read('src/pages/modules/security/SecurityEnvironments.tsx');
  const hook = read('src/hooks/useSecurityOperations.ts');
  assert.match(hook, /\.from\('deployments'\)/);
  assert.match(hook, /\.from\('platform_sync_runs'\)/);
  assert.match(source, /useSecurityDeployments/);
  assert.match(source, /useSecurityBridgeRuns/);
  assert.match(source, /Disponibilité actuelle/);
  assert.match(source, /Non mesurée/);
  assert.match(source, /ne déploie aucun changement/);
  assert.match(source, /ModuleWorkspace pageId="security\.environments"/);
});

test('infrastructure : aucune disponibilité ou sauvegarde inventée', () => {
  const source = read('src/pages/modules/security/SecurityInfrastructure.tsx');
  assert.match(source, /useSecurityFunctionObservations/);
  assert.match(source, /useSecurityBridgeRuns/);
  assert.match(source, /useIntranetRecords\('security\.infrastructure'/);
  assert.match(source, /Disponibilité et sauvegarde/);
  assert.match(source, /Non vérifiées/);
  assert.match(source, /isFunctionFailure/);
});

test('VPN : terminaux existants distingués des demandes documentaires', () => {
  const source = read('src/pages/modules/security/SecurityVPN.tsx');
  assert.match(source, /useSecurityVpnAccess/);
  assert.match(source, /Accès connus/);
  assert.match(source, /Demandes & révocations/);
  assert.match(source, /ModuleWorkspace pageId="security\.vpn"/);
  assert.match(source, /la confirmation d'accès effectif|confirmation d'accès effectif/i);
});

test('supervision : les alertes et événements manquants ne deviennent pas des zéros', () => {
  const source = read('src/pages/modules/security/SecuritySupervision.tsx');
  assert.match(source, /functions\.isError \|\| functions\.isLoading/);
  assert.match(source, /alerts\.isError \|\| alerts\.isLoading/);
  assert.match(source, /useSecurityFunctionObservations/);
  assert.match(source, /200 derniers événements/);
});

test('flux de données : schéma cible séparé des événements de synchronisation', () => {
  const source = read('src/pages/modules/security/SecurityDataFlow.tsx');
  assert.match(source, /Architecture cible, non certification de déploiement/);
  assert.match(source, /useSecurityBridgeRuns/);
  assert.match(source, /canViewPage\('security\.dataflow'\)/);
});
