import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const vault = read('supabase/migrations/20261121180000_rh_private_vault_quarantine.sql');
const departure = read('supabase/migrations/20261121181000_rh_departure_vault_and_documentary_preflight.sql');
const grants = read('supabase/migrations/20261121182000_rh_departure_revoke_bib_review_shares.sql');
const edge = read('supabase/functions/rh-private-vault/index.ts');
const ui = read('src/components/hr/RhPrivateVault.tsx');
const employeeFiles = read('src/pages/modules/rh/EmployeeFiles.tsx');
const panel = read('src/components/hr/DepartureCasesPanel.tsx');

test('vault is a separate private bucket, no browser object policies and disabled until approval', () => {
 assert.match(vault, /'rh-personnel-vault','rh-personnel-vault',FALSE,5242880/);
 assert.match(vault, /ARRAY\['application\/pdf','image\/png','image\/jpeg'\]/);
 assert.match(vault, /CREATE TABLE IF NOT EXISTS public\.rh_private_vault_settings/);
 assert.match(vault, /upload_enabled boolean NOT NULL DEFAULT FALSE/);
 assert.match(vault, /read_enabled boolean NOT NULL DEFAULT FALSE/);
 assert.match(vault, /rh_vault_storage_policy_must_be_reviewed_before_release/);
 assert.match(vault, /CREATE TABLE IF NOT EXISTS public\.rh_private_vault_retention_rules/);
 assert.match(vault, /purpose_code text/);
 assert.match(vault, /legal_reviewed_at timestamptz/);
 assert.match(vault, /CREATE TABLE IF NOT EXISTS public\.rh_private_vault_documents/);
 assert.match(vault, /state text NOT NULL DEFAULT 'reserved'/);
 assert.match(vault, /CREATE TABLE IF NOT EXISTS public\.rh_private_vault_events/);
 assert.match(vault, /REVOKE ALL ON public\.rh_private_vault_documents FROM PUBLIC,anon,authenticated/);
 assert.match(vault, /rh_vault_not_approved_for_upload/);
 assert.match(vault, /rh_vault_document_policy_invalid/);
});

test('Edge vault gateway validates JWT, actual file signature, size and hash and has NO reading endpoint', () => {
 assert.match(edge, /await caller\.auth\.getUser/);
 assert.match(edge, /!policy\?\.upload_enabled/);
 assert.match(edge, /request\.formData\(\)/);
 assert.match(edge, /file\.size > MAX_BYTES/);
 assert.match(edge, /detectedMime\(bytes\)/);
 assert.match(edge, /file\.type !== mime/);
 assert.match(edge, /crypto\.subtle\.digest\('SHA-256'/);
 assert.match(edge, /'rh_reserve_private_vault_document'/);
 assert.match(edge, /storage\.from\(BUCKET\)\.upload/);
 assert.match(edge, /state: 'quarantined'/);
 assert.match(edge, /event_type: 'quarantined'/);
 assert.doesNotMatch(edge, /\.createSignedUrl\(/);
 assert.doesNotMatch(edge, /\.getPublicUrl\(/);
 assert.doesNotMatch(edge, /storage\.from\(BUCKET\)\.download/);
 assert.doesNotMatch(edge, /state: 'clean'/);
});

test('approved effective departure denies leaver access with old JWT without deleting retained files', () => {
 assert.match(departure, /CREATE OR REPLACE FUNCTION public\.rh_departure_access_blocked/);
 assert.match(departure, /c\.status='approved'/);
 assert.match(departure, /c\.planned_at<=current_date/);
 assert.match(departure, /rh_departure_access_blocked_current/);
 assert.match(departure, /GRANT EXECUTE ON FUNCTION public\.rh_departure_access_blocked_current/);
 assert.match(departure, /trg_rh_private_vault_departure_guard/);
 assert.match(departure, /rh_vault_departure_restriction/);
 assert.match(departure, /AS RESTRICTIVE/);
 assert.match(departure, /FOR SELECT TO authenticated/);
 assert.match(departure, /FOR INSERT TO authenticated/);
 assert.match(departure, /FOR UPDATE TO authenticated/);
 assert.match(departure, /FOR DELETE TO authenticated/);
 assert.match(grants, /NOT public\.rh_departure_access_blocked\(p_reviewer\)/);
 assert.match(grants, /NOT public\.rh_departure_access_blocked\(\(SELECT auth\.uid\(\)\)\)/);
 assert.match(grants, /rh_departure_revoke_bib_review_shares/);
 assert.match(grants, /rh_leadership_document_review_events/);
 assert.match(grants, /revoked_at=now\(\)/);
 assert.doesNotMatch(departure, /DELETE FROM public\.rh_private_vault_documents/);
});

test('departure audit counts vault and RH archives but always blocks final closure', () => {
 assert.match(departure, /rh_departure_documentary_preflight/);
 assert.match(departure, /private_vault_under_retention/);
 assert.match(departure, /unapproved_retention_categories/);
 assert.match(departure, /active_leadership_document_shares/);
 assert.match(departure, /'documents_deleted',false/);
 assert.match(departure, /'sessions_revoked',false/);
 assert.match(departure, /'safe_to_close',false/);
 assert.match(panel, /rh_departure_documentary_preflight/);
 assert.match(panel, /rh_departure_revoke_bib_review_shares/);
 assert.match(panel, /shareRevokeConfirmation !== 'REVOQUER'/);
 assert.match(panel, /Inventaire des archives et droits documentaires/);
 assert.match(panel, /Aucune archive ne doit être supprimée automatiquement au départ/);
});

test('RH sensitive file UI is owner-only and remains disabled until approval', () => {
 assert.match(ui, /user\.id === subjectId/);
 assert.match(ui, /profile\?\.test_account !== true/);
 assert.match(ui, /!uploadEnabled/);
 assert.match(ui, /disabled=\{!uploadEnabled \|\| !file/);
 assert.match(ui, /'rh-private-vault'/);
 assert.match(ui, /new FormData\(\)/);
 assert.match(ui, /Déposer dans mon coffre RH/);
 assert.match(ui, /supabase\.functions\.invoke\('rh-private-vault'/);
 assert.match(employeeFiles, /selectedEmployee\.id === user\?\.id/);
 assert.match(employeeFiles, /<RhPrivateVault subjectId=\{selectedEmployee\.id\}/);
});
