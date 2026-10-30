import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('hierarchy means intersection of each dimension and contextual global', () => {
  const source = read('src/lib/hierarchicalScope.ts');
  assert.match(source, /if \(!scope\.subsidiaries\.length\) return false/);
  assert.match(source, /scope\.poles\.length &&/);
  assert.match(source, /scope\.regions\.length &&/);
  assert.match(source, /scope\.portfolios\.length &&/);
  assert.match(source, /scope\.ownRecords &&/);
  assert.match(source, /tous les pôles de cette entité/);
});

test('admin hierarchical editor cascades entity to its poles', () => {
  const source = read('src/components/admin/HierarchicalScopeEditor.tsx');
  assert.match(source, /profile\.subsidiary && draft\.subsidiaries\.includes\(profile\.subsidiary\)/);
  assert.match(source, /poles: current\.poles\.filter\(pole => available\.has\(pole\)\)/);
  assert.match(source, /regions: \[\], portfolios: \[\]/);
  assert.match(source, /selectEntity\(entity, e\.target\.checked\)/);
  assert.match(source, /tous les pôles disponibles dans la filiale sélectionnée/);
  assert.match(source, /scope\.ownRecords/);
});

test('hierarchical policy is an audited server-side draft, not an RLS grant', () => {
  const migration = read('drizzle/migrations/0061_hierarchical_scope_policy_drafts.sql');
  assert.match(migration, /status text NOT NULL DEFAULT 'draft'/);
  assert.match(migration, /has_role\(v_actor, 'admin'/);
  assert.match(migration, /hierarchical_scope_draft/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  const restriction = read('drizzle/migrations/0062_lock_unmapped_hierarchical_dimensions.sql');
  assert.match(restriction, /jsonb_array_length\(policy->'regions'\)=0/);
  assert.match(restriction, /jsonb_array_length\(policy->'portfolios'\)=0/);
});

test('hierarchical editor is the principal role-scoping tab', () => {
  const page = read('src/pages/admin/RolesPermissions.tsx');
  assert.match(page, /<TabsTrigger value="scopes">Périmètres hiérarchiques<\/TabsTrigger>/);
  assert.match(page, /<HierarchicalScopeEditor roleId=\{selectedRoleId\} \/>/);
  assert.match(page, /<TabsTrigger value="flat-scopes">Périmètres simples \(historiques\)<\/TabsTrigger>/);
});
