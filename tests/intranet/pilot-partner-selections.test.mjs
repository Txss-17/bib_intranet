import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../../drizzle/migrations/0089_pilot_partner_wave_selections.sql', import.meta.url), 'utf8');
const view = readFileSync(new URL('../../src/components/operations/PilotPartnerSelection.tsx', import.meta.url), 'utf8');
const supplier = readFileSync(new URL('../../src/pages/modules/supplier/SupplierApplications.tsx', import.meta.url), 'utf8');
const logistics = readFileSync(new URL('../../src/pages/modules/ops/Partners.tsx', import.meta.url), 'utf8');

test('partner recruiting remains unlimited; only pilot operational selection is capped', () => {
 assert.match(sql, /pilot_wave_capacity_exceeded/);
 assert.match(sql, /WHEN 1 THEN 2 WHEN 2 THEN 4 ELSE 8/);
 assert.match(sql, /WHEN 1 THEN 1 WHEN 2 THEN 2 ELSE 3/);
 assert.match(sql, /p_action='approve'/);
 assert.doesNotMatch(sql, /CREATE TRIGGER\s+.*supplier_applications/i);
 assert.match(view, /Portefeuille : sans plafond/);
});

test('approval requires independent actor and evidence, with concurrent locking', () => {
 assert.match(sql, /v_nominator=v_actor/);
 assert.match(sql, /length\(btrim\(coalesce\(p_reference,''\)\)\) NOT BETWEEN 8 AND 500/);
 assert.match(sql, /pg_advisory_xact_lock/);
 assert.match(sql, /bib_pilot_partner_events/);
 assert.match(sql, /SECURITY DEFINER/);
 assert.match(sql, /can_intranet_action\('supplier\.applications','update'\)/);
 assert.match(sql, /can_intranet_action\('ops\.partners','update'\)/);
});

test('sandbox data and partner rights remain separated', () => {
 assert.match(sql, /test_account=public\.intranet_is_test_mode\(\)/);
 assert.match(sql, /REVOKE ALL ON public\.bib_pilot_partner_selections/);
 assert.match(sql, /GRANT SELECT ON public\.bib_pilot_partner_selections TO authenticated/);
 assert.doesNotMatch(sql, /GRANT (INSERT|UPDATE|DELETE) ON public\.bib_pilot_partner_selections TO authenticated/);
});

test('suppliers and logistics can nominate partners without modifying their live operational status', () => {
 assert.match(supplier, /<PilotPartnerSelection kind="supplier"/);
 assert.match(logistics, /<PilotPartnerSelection kind="logistics"/);
 assert.match(view, /bib_set_pilot_partner_selection/);
 assert.doesNotMatch(view, /\.update\(\{.*status/);
});
