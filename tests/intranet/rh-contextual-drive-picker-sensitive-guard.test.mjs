import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const picker=read('src/components/FileUploadZone.tsx');
const onboarding=read('src/pages/modules/rh/Onboarding.tsx');
const files=read('src/pages/modules/rh/EmployeeFiles.tsx');
const leader=read('src/components/hr/LeadershipEvidenceUploader.tsx');
const server=read('supabase/migrations/20261121151000_rh_sensitive_file_storage_guard.sql');

test('document picker opens the existing authorized BIB Drive import dialog when the field is clicked',()=>{
  assert.match(picker,/triggerMode\?: 'button' \| 'field'/);
  assert.match(picker,/triggerMode === 'field'/);
  assert.match(picker,/aria-label=\{label \|\| 'Choisir un document dans Drive BIB'\}/);
  assert.match(picker,/onClick=\{\(\) => \{ setOpen\(true\); void list\(\); \}\}/);
  assert.match(picker,/action: 'list'/);
  assert.match(picker,/action: 'import'/);
  assert.match(picker,/folder.startsWith\('rh-'\) \|\| folder === 'leadership-evidence'/);
  assert.match(picker,/new URL\(result.url, window.location.origin\)/);
  assert.match(picker,/onFilesChange\(nextFiles\)/);
});
test('RH onboarding and employee records select documents from Drive, not raw URL inputs',()=>{
  assert.match(onboarding,/FileUploadZone bucket="managed-drive" folder="rh-onboarding"/);
  assert.match(onboarding,/triggerMode="field"/);
  assert.match(onboarding,/document_url: files\[0\]\?\.url \|\| ''/);
  assert.doesNotMatch(onboarding,/aria-label="Lien du document" placeholder="Lien \(facultatif\)"/);
  assert.match(files,/FileUploadZone bucket="managed-drive" folder="rh-employee-record"/);
  assert.match(files,/triggerMode="field"/);
  assert.match(files,/source: 'drive'/);
  assert.match(files,/\.select\('document_reference'\)/);
  assert.match(files,/Document \$\{data.document_reference\} enregistré dans le dossier RH/);
  assert.match(files,/document_url: files\[0\]\?\.url \|\| ''/);
  assert.doesNotMatch(files,/placeholder="Lien Google Drive BIB ou référence documentaire"/);
});
test('sensitive RH content is not uploaded or linked through the Drive account',()=>{
  assert.match(files,/new Set\(\['identity', 'medical', 'payroll', 'disciplinary'\]\)/);
  assert.match(files,/restrictedRhDocumentTypes.has\(form.document_type\)/);
  assert.match(files,/coffre RH privé/i);
  assert.match(leader,/type === 'identity'/);
  assert.match(leader,/Copie d’identité : import Drive désactivé/);
  assert.match(server,/CREATE OR REPLACE FUNCTION public.rh_guard_sensitive_document_storage/);
  assert.match(server,/NEW.document_type IN \('identity','medical','payroll','disciplinary'\)/);
  assert.match(server,/rh_sensitive_document_requires_private_vault/);
  assert.match(server,/BEFORE INSERT OR UPDATE OF document_type,document_url/);
  assert.match(server,/REVOKE ALL ON FUNCTION public.rh_guard_sensitive_document_storage/);
});
