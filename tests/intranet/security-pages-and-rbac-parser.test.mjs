import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('RBAC: permission save emits matrix change event outside toast object', () => {
  const s = read('src/pages/admin/RolesPermissions.tsx');
  assert.doesNotMatch(s, /toast\(\{\s*window\.dispatchEvent/);
  assert.match(s, /window\.dispatchEvent\(new Event\(MATRIX_EVENT\)\);\s*toast\(\{\s*title: 'Permissions enregistrées'/);
});

test('Security: Infrastructure, Environments and VPN have dedicated real-data modules', () => {
  const infrastructure = read('src/pages/modules/security/SecurityInfrastructure.tsx');
  const environments = read('src/pages/modules/security/SecurityEnvironments.tsx');
  const vpn = read('src/pages/modules/security/SecurityVPN.tsx');
  assert.match(infrastructure, /useSecurityFunctionObservations/);
  assert.match(infrastructure, /useSecurityBridgeRuns/);
  assert.match(infrastructure, /ModuleWorkspace pageId="security\.infrastructure"/);
  assert.match(environments, /useSecurityDeployments/);
  assert.match(environments, /useSecurityBridgeRuns/);
  assert.match(environments, /ModuleWorkspace pageId="security\.environments"/);
  assert.match(vpn, /useSecurityVpnAccess/);
  assert.match(vpn, /ModuleWorkspace pageId="security\.vpn"/);
  for (const page of [infrastructure, environments, vpn]) {
    assert.doesNotMatch(page, /SecurityControlWorkspace/);
    assert.match(page, /isError/);
  }
});

test('Security: Code, Console and Documentation retain their differentiated reviews', () => {
  const page = read('src/components/security/SecurityControlWorkspace.tsx');
  for (const name of ['CodeView', 'ConsoleView', 'DocumentationView']) {
    assert.match(page, new RegExp('function ' + name + '\\('));
    assert.match(page, new RegExp('<' + name + ' rows=\\{rows\\}'));
  }
  assert.match(page, /canViewPage\(d\.page\)/);
});
