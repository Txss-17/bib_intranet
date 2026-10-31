import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');

test('RBAC permission edits use one audited server transaction, not batched direct upserts', () => {
  const page = read('src/pages/admin/RolesPermissions.tsx');
  const save = page.slice(page.indexOf('const savePermissions = async'), page.indexOf('const synchronizeCatalog = async'));
  assert.match(save, /rpc\('replace_access_permission_changes'/);
  assert.match(save, /expected: previous \? previous.allowed : null/);
  assert.doesNotMatch(save, /\.from\('access_permissions'\)\s*\.upsert/);
  assert.doesNotMatch(save, /\.from\('access_change_history'\)\s*\.insert/);
});

test('RBAC RPC validates administrator, expected values and logs atomically', () => {
  const migration = read('drizzle/migrations/0065_atomic_permission_matrix_editor.sql');
  assert.match(migration, /public\.has_role\(v_actor,'admin'/);
  assert.match(migration, /ap\.allowed IS DISTINCT FROM c\.expected/);
  assert.match(migration, /ON CONFLICT \(role_id,interface_id,action_id\)/);
  assert.match(migration, /INSERT INTO public\.access_change_history/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.replace_access_permission_changes/);
});
