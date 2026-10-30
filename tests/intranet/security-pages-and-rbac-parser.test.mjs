import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('RBAC: permission save emits matrix change event outside toast object', () => {
  const s = read('src/pages/admin/RolesPermissions.tsx');
  assert.doesNotMatch(s, /toast\(\{\s*window\.dispatchEvent/);
  assert.match(s, /window\.dispatchEvent\(new Event\(MATRIX_EVENT\)\);\s*toast\(\{\s*title: 'Permissions enregistrées'/);
});

test('Security: six modules display different business layouts instead of identical cards', () => {
  const s = read('src/components/security/SecurityControlWorkspace.tsx');
  for (const name of ['InfrastructureView', 'EnvironmentView', 'VpnView', 'CodeView', 'ConsoleView', 'DocumentationView']) {
    assert.match(s, new RegExp('function ' + name + '\\('));
    assert.match(s, new RegExp('<' + name + ' rows=\\{rows\\}'));
  }
  assert.match(s, /<Table>/);
  assert.match(s, /Circuit d’autorisation d’intervention/);
  assert.match(s, /Accès VPN & réseau/);
  assert.match(s, /Bibliothèque de runbooks/);
  assert.match(s, /ModuleWorkspace pageId=\{d\.page\}/);
});
