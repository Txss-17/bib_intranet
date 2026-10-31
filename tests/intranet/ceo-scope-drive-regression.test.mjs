import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../'+path, import.meta.url),'utf8');

test('CEO selector remains responsive: query only selected role matrix',()=>{
 const roles = read('src/pages/admin/RolesPermissions.tsx');
 assert.match(roles, /role_key === 'ceo' && role\.status === 'active'/);
 assert.match(roles, /Sélectionner le CEO/);
 assert.match(roles, /\.eq\('role_id', selectedRoleId\)/);
 assert.match(roles, /permissionsRoleId === selectedRoleId/);
 assert.match(roles, /rolePermissionsReady/);
 assert.match(roles, /Matrice non disponible/);
 assert.match(roles, /Le chargement des droits de ce rôle a échoué/);
 assert.doesNotMatch(roles, /for \(let from = 0; ; from \+= PAGE_SIZE\)/);
});

test('CEO does not bypass admin privileges, RLS or independent validation',()=>{
 const roles = read('src/pages/admin/RolesPermissions.tsx');
 const permissions = read('src/hooks/usePermissions.ts');
 const userRole = read('src/hooks/useUserRole.ts');
 assert.match(roles, /if \(!isSuperAdmin\)/);
 assert.match(roles, /Désactivez le mode/);
 assert.match(roles, /règles RLS et aux approbations indépendantes/);
 assert.match(permissions, /isAdmin && !simulatedRole/);
 assert.match(userRole, /if \(error\) throw error;/);
 assert.match(userRole, /isError, error, refetch/);
});

test('legal contract import and shared exports use managed BIB Drive',()=>{
 const contract = read('src/components/forms/ContractForm.tsx');
 const exports = read('src/components/ExportButtons.tsx');
 const drive = read('src/lib/driveDocuments.ts');
 assert.match(contract, /FileUploadZone bucket="managed-drive" folder="contracts"/);
 assert.match(contract, /managedDocumentId/);
 assert.doesNotMatch(contract, /type="url" value=\{f\.document_url\}/);
 assert.match(exports, /Exporter → Drive BIB/);
 assert.match(drive, /supabase\.functions\.invoke\('intranet-drive'/);
});

test('sandbox has no local journal download and no production Drive export',()=>{
 const sandbox=read('src/pages/modules/security/SecuritySandbox.tsx');
 assert.doesNotMatch(sandbox, /URL\.createObjectURL/);
 assert.doesNotMatch(sandbox, /anchor\.download/);
 assert.match(sandbox, /Export du journal Sandbox suspendu/);
});
