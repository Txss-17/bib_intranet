# BIB Intranet — migration hors Lovable — readiness checklist

Status: **PREPARATION ONLY / NO PRODUCTION CHANGE**
Reference document (Drive BIB): https://docs.google.com/document/d/18lpUzk5j6jTKMw9m_s2XAPsALxdeP4OVkkqpbr-iv9M/edit
Tracking issue: https://github.com/Txss-17/bib_intranet/issues/89

## Live source inventory (read-only PostgreSQL metadata, 2026-11-11)
207 public tables; 23 Supabase migrations; 1,046 public RLS policies; 7 Storage policies; 236 SECURITY DEFINER functions; 116 email identities; 6 Storage objects / 26,348,513 metadata bytes.
Storage: database_export_19_07_26 (private, contents unverified); governance-documents (private, 20 MiB); product-assets (public, 10 MiB).
All Auth identities observed are email provider identities; no identity credentials were exported.

## Special risks
P0: confirm protected HR and CEO/Manager RH onboarding identities, role RLS, documents and cross-project bridges. Existing bucket named database_export_19_07_26 cannot be treated as verified backup. Extensions pg_cron, pg_net, pgmq and supabase_vault must be explicitly validated.

## Gate 0 — source and export rights
- [ ] Verify owner, production source project, database export/download method approved by Lovable; SELECT metadata access is **not** pg_dump permission.
- [ ] Capture safe aggregate counts, migration history versions, schema fingerprints and existing deployments.
- [ ] Secure encrypted storage outside the web root for DB dumps, object binary backups and Auth material. Never commit secrets, Auth hashes, personal data, payment records or dumps.
- [ ] Confirm database and Auth recovery path; if passwords cannot migrate safely, define reset/migration campaign.

## Gate 1 — destination
- [ ] Provision separate BIB-controlled Supabase dev/staging; then design prod independently. Record project ref in secured inventory, not credentials.
- [ ] Reconcile extensions, schema, RLS, roles/grants, SECURITY DEFINER search_path, functions/triggers, foreign keys, sequences and migration journal.
- [ ] Migrate Auth users, Storage objects and permissions separately. Check checksums and counts. Recreate secrets/Edge Functions, schedulers, outbound integrations, callback URLs and rate limits.
- [ ] Test signed-in and unauthenticated roles, negative RLS cases, login/recovery/MFA and PWA.

## Gate 2 — app-independent hosting
- [ ] Deploy frontend from GitHub on independent staging host with VITE_SUPABASE_URL and publishable key only; keep service-role and webhook secrets server-side.
- [ ] Verify CORS, redirects, cookies/session and CSP; smoke-test browser/mobile.
- [ ] Verify every critical flow before updating DNS. Avoid modifying 185.158.133.1 records until Go/No-Go.

## Gate 3 — cutover
- [ ] Run test restore from encrypted backup; validate consistency of writes/deltas and rollback after first new write.
- [ ] Confirm Stripe/email/notify integrations, logs and observability are **not** routed via Lovable.
- [ ] Obtain written Go/No-Go; cut over during controlled window; verify DNS/HTTPS/email and business workflows.
- [ ] Retire Lovable only after sustained validation, no active dependencies, and verified final backups.

## Relevant infrastructure facts
Domain hosts presently routed via Lovable A record 185.158.133.1 (TTL 300): apex, audit-set, carrieres, logistics, pack-legal, shop, store, suppliers, tarifs, workspace. Email MX smtp.google.com; notify.brand-in-a-box.space delegates to ns3/ns4.lovable.cloud. Preserve email/notify continuity.

All boxes start unchecked deliberately; do not mark complete without evidence (PR, deployment/test log, restore report).
