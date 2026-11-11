# Intranet — liaison GitHub → Supabase (préproduction uniquement)

Status: TARGET IDENTIFIED; CI PIPELINE PREPARED; LIVE LINK NOT ENABLED
Repository: Txss-17/bib_intranet
Migration branch: chore/lovable-exit-readiness
Supabase staging project ref: hjquaokkcpnwnvpdfmyj
Supabase staging project URL: https://hjquaokkcpnwnvpdfmyj.supabase.co
Production Lovable project ref: preserved in supabase/config.toml (DO NOT REPLACE before migration cutover).

## Separation of concerns
- This branch defines only staging linkage and validation. It does not update supabase/config.toml, deploy migrations/functions, rotate secrets or modify Lovable production.
- GitHub repository is source of code; Supabase hosts Postgres/Auth/Storage/Functions. Frontend hosting (Cloudflare Pages) is a **separate** GitHub deployment connection.
- Configure protected GitHub Environment named `supabase-staging` and set environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in GitHub repository settings. These are public browser configuration values but should not point to production for staging.
- Do not add `SUPABASE_SERVICE_ROLE_KEY`, a database password or Stripe secret to VITE_* or git history. For future server deployments use Environment secrets and required reviewers; disable automatic production deployment until Go/No-Go.
- A workflow dispatch on the migration branch verifies only the Vite build and target ref. It does **not** send data or deploy.
- Expected staging ref: hjquaokkcpnwnvpdfmyj. Frontend CI must reject a different VITE_SUPABASE_URL.

## Pending independent deployment
- [ ] Repo GitHub Actions Environment variables configured by repo owner.
- [ ] GitHub Environment with protected reviewers and correct scoped permissions.
- [ ] Successful manual workflow dry run on the migration branch.
- [ ] Backup restored and verified in staging (Auth/RLS/Storage).
- [ ] Review safe Supabase CLI CI workflow for Edge Functions after third-party integrations are disabled.
- [ ] Link repo to Cloudflare Pages for independent frontend deployments and register staging domain.
- [ ] Only after all tests, create separate production environment and manual cutover approval.

Drive BIB master document: https://docs.google.com/document/d/18lpUzk5j6jTKMw9m_s2XAPsALxdeP4OVkkqpbr-iv9M/edit

## Verified source-code contract (2026-11-11)
- `src/integrations/supabase/client.ts` reads `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`. This matches the GitHub staging workflow; no client change required to select an alternate Supabase at build time.
- Both the GitHub pipeline and the independent frontend host must receive their own staging configuration. GitHub Actions variables by themselves do NOT configure Cloudflare Pages or any other deployed frontend.
- **Never use these staging variables for Lovable production.** The live `supabase/config.toml` ref must remain unchanged until a separate, reviewed production migration.
- Target Supabase project ID is `hjquaokkcpnwnvpdfmyj`; this identifier is not a database credential. The publishable API key is public client configuration, not a service-role key.
- As the available GitHub connector cannot configure repository Actions Environments, the Environment `supabase-staging` and two variables remain owner-side steps. Do not mark GitHub↔Supabase connected until a verified successful Actions run uses the target ref.
- Do not enable real email, Stripe, cron jobs, Edge Functions with network calls, or privileged backend bridges until staging data and secrets are reviewed.
