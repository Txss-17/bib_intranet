import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');

test('CEO permanent: require canonical active role and employee identity', () => {
  const sql = read('drizzle/migrations/0071_canonical_ceo_global_actions.sql');
  assert.match(sql, /profile\.position='ceo'/);
  assert.match(sql, /profile\.test_account IS FALSE/);
  assert.match(sql, /ar\.role_key='ceo' AND ar\.status='active'/);
  assert.match(sql, /aa\.status='active'/);
  assert.match(sql, /aa\.starts_at IS NULL/);
  assert.match(sql, /aa\.ends_at IS NULL/);
  assert.match(sql, /public\.is_intranet_staff\(actor\)/);
});

test('Marketplace merchant allocation uses atomic authorization and preserves history', () => {
  const sql = read('drizzle/migrations/0069_marketplace_portfolio_management.sql');
  const hook = read('src/hooks/useMarketplace.tsx');
  const page = read('src/components/marketplace/MarketplacePortfolioManager.tsx');
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.marketplace_assign_merchant/);
  assert.match(sql, /can_intranet_action\('marketplace\.merchants', 'update'\)/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /ended_at = now\(\)/);
  assert.match(sql, /marketplace_change_portfolio_owner/);
  assert.match(sql, /merchant_portfolio_owner_events/);
  assert.match(hook, /rpc\('marketplace_assign_merchant'/);
  assert.doesNotMatch(hook, /\.from\('merchant_portfolio_assignments'\)\s*\.update\(/);
  assert.match(page, /marketplace_create_portfolio/);
});

test('portfolio records are scoped to their pole and owner, not published globally', () => {
  const sql = read('drizzle/migrations/0070_cross_pole_case_portfolios.sql');
  const manager = read('src/components/operations/CasePortfolioManager.tsx');
  assert.match(sql, /ALTER TABLE public\.bib_case_portfolios ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /public\.bib_portfolio_permission\(pole,'update'\)/);
  assert.match(sql, /owner_id=auth\.uid\(\)/);
  assert.match(sql, /p_kind='customer'/);
  assert.match(sql, /p_kind='logistics_partner'/);
  assert.match(sql, /p_kind='employee'/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS bib_case_portfolio_members_one_active/);
  assert.match(sql, /bib_case_portfolio_owner_events/);
  assert.match(manager, /bib_assign_case_entity/);
  assert.match(manager, /bib_change_case_portfolio_owner/);
});

test('the existing supplier portfolios permit management without active staff', () => {
  const page = read('src/pages/modules/supplier/SupplierPortfolios.tsx');
  assert.match(page, /profile\.position === 'ceo'/);
  assert.match(page, /responsible\?\.id \?\? null/);
  assert.doesNotMatch(page, /Responsable obligatoire/);
});
