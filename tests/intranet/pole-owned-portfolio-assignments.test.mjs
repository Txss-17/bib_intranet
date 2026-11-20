import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

const read = (p) => readFileSync(new URL("../../" + p, import.meta.url), "utf8");

test("RH does not assign portfolios belonging to other poles", () => {
  const rh = read("src/pages/modules/rh/RHAccess.tsx");
  const view = read("src/pages/modules/rh/RHPortfolio.tsx");
  assert.doesNotMatch(rh, /Affecter un portefeuille/);
  assert.doesNotMatch(rh, /onClick=\{\(\) =>\s*openPortfolioDialog/);
  assert.match(rh, /portfolio\.portfolio_type\?\.business_pole === 'rh'/);
  assert.match(view, /type\?\.business_pole === 'rh'/);
  assert.match(view, /holder\?\.poles\?\.includes\('rh'\)/);
});

test("Business portfolio assignments are owned by active pole managers, not HR", () => {
  const sql = read("ops/release/pole-owned-portfolio-assignments-20261120.sql");
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.bib_can_manage_access_portfolio/);
  assert.match(sql, /ar\.seniority='lead'/);
  assert.match(sql, /ar\.business_pole=apt\.business_pole/);
  assert.match(sql, /ar\.role_key='responsable_marketplace'/);
  assert.match(sql, /ar\.role_key='responsable_logistique'/);
  assert.match(sql, /public\.bib_can_manage_access_portfolio\(portfolio_id\)/);
  assert.match(sql, /assigned_by=\(SELECT auth\.uid\(\)\)/);
  assert.match(sql, /TG_OP='INSERT'/);
  assert.match(sql, /portfolio_assignment_author_immutable/);
  assert.doesNotMatch(sql, /has_pole\(auth\.uid\(\),\s*'rh'/);
});
