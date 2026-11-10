import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const sql=read('drizzle/migrations/0101_portfolio_archival_lifecycle.sql');
const journal=JSON.parse(read('drizzle/migrations/meta/_journal.json'));
const caseUi=read('src/components/operations/CasePortfolioManager.tsx');
const merchantUi=read('src/components/marketplace/MarketplacePortfolioManager.tsx');
const supplierUi=read('src/pages/modules/supplier/SupplierPortfolios.tsx');

test('migration 0101 follows 0100 and never hard deletes portfolio history',()=>{
 assert.equal(journal.entries.at(-1).tag,'0101_portfolio_archival_lifecycle');
 assert.equal(journal.entries.at(-1).idx,101);
 assert.doesNotMatch(sql,/DELETE FROM public\.(bib_case_portfolios|merchant_portfolios|bib_case_portfolio_members|merchant_portfolio_assignments)/);
 assert.match(sql,/portfolio_has_active_assignments/);
 assert.match(sql,/status='inactive'/);
 assert.match(sql,/bib_case_portfolio_owner_events/);
 assert.match(sql,/merchant_portfolio_owner_events/);
});
test('archiving requires pole permission, reason and no live assignments',()=>{
 assert.match(sql,/public\.bib_portfolio_permission\(v_pole,'update'\)/);
 assert.match(sql,/public\.can_intranet_action\('marketplace\.merchants','update'\)/);
 assert.match(sql,/length\(btrim\(coalesce\(p_reason,''\)\)\) NOT BETWEEN 8 AND 500/);
 assert.match(sql,/ended_at IS NULL/);
 assert.match(caseUi,/bib_archive_case_portfolio/);
 assert.match(merchantUi,/marketplace_archive_portfolio/);
});
test('old prebuilt lists are removed from the onboarding-facing views but records remain',()=>{
 assert.doesNotMatch(caseUi,/entities\.slice\(0,100\)\.map/);
 assert.doesNotMatch(supplierUi,/portfolioSummaries\.map\(/);
 assert.match(supplierUi,/Aucun dossier ni historique fournisseur n'a été supprimé/);
 assert.match(caseUi,/La liste générale des portefeuilles existants n'est plus affichée/);
 assert.match(merchantUi,/Archiver sans supprimer les affectations historiques/);
});
