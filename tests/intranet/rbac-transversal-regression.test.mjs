import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('le journal métier n’est plus injecté globalement sur les pages', () => {
  const layout = read('src/components/layout/MainLayout.tsx');
  assert.doesNotMatch(layout, /<BusinessHistoryPanel\b/);
  assert.match(layout, /<RouteAccessGate><Outlet\s*\/><\/RouteAccessGate>/);
});

test('l’éditeur des périmètres des rôles existants est présent', () => {
  const page = read('src/pages/admin/RolesPermissions.tsx');
  assert.match(page, /Configurer les périmètres/);
  assert.match(page, /replace_access_role_scopes/);
  assert.match(page, /p_expected:\s*expected/);
  assert.match(page, /p_reason:\s*scopeReason\.trim\(\)/);
});

test('la modification des périmètres exige un administrateur et journalise atomiquement', () => {
  const sql = read('drizzle/migrations/0055_existing_role_scope_editor.sql');
  assert.match(sql, /has_role\(v_actor, 'admin'/);
  assert.match(sql, /v_actual IS DISTINCT FROM v_expected/);
  assert.match(sql, /INSERT INTO public\.access_change_history/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.replace_access_role_scopes/);
});

test('les modifications de permissions n’écrasent pas toute la matrice', () => {
  const page = read('src/pages/admin/RolesPermissions.tsx');
  assert.match(page, /if \(allowed === previous\) return \[\]/);
  assert.match(page, /replace_access_permission_changes/);
  assert.match(page, /p_changes:\\s*changes/);
  assert.match(page, /expected:\\s*previous \\? previous\\.allowed : null/);
  assert.match(page, /window\.dispatchEvent\(new Event\(MATRIX_EVENT\)\)/);
});

test('les tableaux fournisseurs n’inventent pas de scores ni de statut actif', () => {
  const hook = read('src/hooks/useRDData.ts');
  assert.doesNotMatch(hook, /supplier\.quality_score \?\? 50/);
  assert.doesNotMatch(hook, /supplier\.risk_score \?\? 50/);
  assert.doesNotMatch(hook, /supplier\.status \?\? 'active'/);
});

test('le panneau Accès ne présente pas de groupes Workspace présumés', () => {
  const page = read('src/components/settings/AccessTab.tsx');
  assert.doesNotMatch(page, /WORKSPACE_GROUPS/);
  assert.match(page, /isSuperAdmin/);
});
