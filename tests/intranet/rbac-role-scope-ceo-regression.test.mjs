import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('role configuration buttons change the active tab', () => {
  const page = read('src/pages/admin/RolesPermissions.tsx');
  assert.match(page, /<Tabs value=\{activeTab\} onValueChange=\{setActiveTab\}>/);
  assert.match(page, /setSelectedRoleId\(role\.id\); setActiveTab\('permissions'\)/);
  assert.match(page, /setSelectedRoleId\(role\.id\); setActiveTab\('scopes'\)/);
});

test('scope catalogue includes existing assignments and canonical pole options', () => {
  const page = read('src/pages/admin/RolesPermissions.tsx');
  assert.match(page, /Catalogue des types de périmètre/);
  assert.match(page, /Périmètres déjà attribués aux rôles/);
  assert.match(page, /availablePoles\.map\(\(pole\) => <Badge/);
  assert.match(page, /replace_access_role_scopes/);
  assert.match(page, /!isSuperAdmin \|\| !selectedRoleId/);
});

test('HR uses a role-bound scope/value and will not grant unrestricted CEO', () => {
  const page = read('src/pages/modules/rh/RHAccess.tsx');
  assert.match(page, /\.from\('access_role_scopes'\)/);
  assert.match(page, /permittedScopeAssignments\.some/);
  assert.match(page, /scope_value: selectedScopeId === 'none' \? null : assignedScopeValue/);
  assert.match(page, /role\.role_key === 'ceo'/);
  assert.match(page, /selectedRole\.role_key === 'ceo'/);
  assert.match(page, /setSelectedScopeValue\(''\)/);
});

test('CEO migration preserves audit history and fixes its assigned role', () => {
  const migration = read('drizzle/migrations/0056_ceo_canonical_assignment.sql');
  assert.match(migration, /role_key='cei'/);
  assert.match(migration, /role_key='ceo'/);
  assert.match(migration, /ceo_role_canonicalisation/);
  assert.match(read('drizzle/migrations/0057_archive_duplicate_ceo_role.sql'), /legacy_role_deactivation/);
});

test('all 14 poles are available to the canonical CEO, with additive enum migration', () => {
  const schema = read('drizzle/migrations/0058_ceo_canonical_poles.sql');
  const profile = read('drizzle/migrations/0059_ceo_profile_poles.sql');
  const types = read('src/integrations/supabase/types.ts');
  for (const pole of ['marketplace','support','product','data','security']) {
    assert.ok(schema.includes("'" + pole + "'"));
    assert.ok(profile.includes("'" + pole + "'"));
    assert.ok(types.includes('"' + pole + '"'));
  }
  assert.match(profile, /ceo_pole_catalogue_alignment/);
});

test('server-side guard protects CEO and assigned role scope', () => {
  const trigger = read('drizzle/migrations/0060_guard_access_assignment_scopes.sql');
  assert.match(trigger, /Only a technical administrator may modify the CEO assignment/);
  assert.match(trigger, /The requested scope is not configured for this role/);
  assert.match(trigger, /BEFORE INSERT OR UPDATE OR DELETE ON public\.access_assignments/);
});

test('role scopes can be composed from multiple verified BIB perimeters', () => {
  const page = read('src/pages/admin/RolesPermissions.tsx');
  assert.match(page, /Composer les périmètres métier/);
  assert.match(page, /Pôles BIB — sélection multiple/);
  assert.match(page, /Entités et filiales BIB — sélection multiple/);
  assert.match(page, /businessSubsidiaries\.map/);
  assert.match(page, /scopeSelected\('own_records', null\)/);
  assert.match(page, /toggleScopeValue\('pole', pole\.id, event\.target\.checked\)/);
  assert.match(page, /toggleScopeValue\('global', null, event\.target\.checked\)/);
  assert.match(page, /\.eq\('test_account', false\)/);
});

test('catalog refresh cannot silently regrant removed role scope defaults', () => {
  const sync = read('supabase/functions/sync-rbac-catalog/index.ts');
  assert.match(sync, /configuredRoleIds/);
  assert.match(sync, /!configuredRoleIds\.has\(row\.role_id\)/);
  assert.doesNotMatch(sync, /existingScopeKeys/);
});

test('CEO reference catalogue covers all actions while the UI respects server permissions', () => {
  const catalog = read('src/lib/accessPermissionCatalog.ts');
  assert.match(catalog, /role\.id === 'ceo' && !role\.readOnly/);
  assert.match(catalog, /administer: true/);
  const permissions = read('src/hooks/usePermissions.ts');
  assert.doesNotMatch(permissions, /if \(!enforced \|\| isSuperAdmin\) return scopes/);
  assert.match(permissions, /permissions\(p\.id\)\.read/);
});

test('CEO flat scopes and HR assignment require Global', () => {
  const admin = read('src/pages/admin/RolesPermissions.tsx');
  const hr = read('src/pages/modules/rh/RHAccess.tsx');
  assert.match(admin, /selectedRole\?\.role_key === 'ceo'/);
  assert.match(admin, /chosen\[0\]\.scope\?\.scope_key !== 'global'/);
  assert.match(hr, /selectedRole\.role_key === 'ceo'/);
  assert.match(hr, /selectedScope\?\.scope_key !== 'global'/);
});

test('new role scope is selected from BIB verified choices instead of free input', () => {
  const page = read('src/pages/admin/RolesPermissions.tsx');
  assert.match(page, /queryKey: \['access-scope-verified-options'\]/);
  assert.match(page, /access_scope_regions/);
  assert.match(page, /access_scope_portfolios/);
  assert.match(page, /access_business_portfolios/);
  assert.match(page, /businessSubsidiaries\.map\(value => \(\{value,label:value\}\)\)/);
  assert.match(page, /aria-label="Sélection de la valeur du périmètre"/);
  assert.match(page, /selectedScopeChoices\.some\(option => option\.value === roleForm\.scope_value\)/);
  assert.doesNotMatch(page, /Saisir une valeur de périmètre/);
});
