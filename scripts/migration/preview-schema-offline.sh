#!/usr/bin/env bash
# Offline PostgreSQL PGDMP schema preview, staging-only migration readiness.
# This script deliberately never connects to a database and never restores data.
set -euo pipefail
if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: bash $0 /secure/path/bib-intranet_261111.backup.bin [private-output-dir]" >&2; exit 2
fi
ARCHIVE="$1"
OUT="${2:-./private-schema-preview}"
EXPECTED_SHA="445786e70edc5fa6bab0228dea5071238da180d7cb10275a6de0d9a811c781a5"
EXPECTED_STAGING_REF="hjquaokkcpnwnvpdfmyj"
for cmd in pg_restore sha256sum awk grep mktemp; do
  command -v "$cmd" >/dev/null || { echo "Missing dependency: $cmd" >&2; exit 2; }
done
[[ -f "$ARCHIVE" ]] || { echo "Archive not found" >&2; exit 2; }
sig="$(LC_ALL=C dd if="$ARCHIVE" bs=5 count=1 status=none)"
[[ "$sig" == "PGDMP" ]] || { echo "Invalid PGDMP signature" >&2; exit 2; }
read -r observed_sha _ < <(sha256sum "$ARCHIVE")
[[ "$observed_sha" == "$EXPECTED_SHA" ]] || { echo "SHA256 mismatch: refusing to continue" >&2; exit 3; }
umask 077
mkdir -p "$OUT"
chmod 700 "$OUT"
pg_restore --list "$ARCHIVE" > "$OUT/toc.txt"
# Export ONLY definitions, not COPY data. The SQL may still contain sensitive
# identifiers or function literals. Keep output in the private directory.
pg_restore --schema-only --schema=public --no-owner --no-privileges \
  --file="$OUT/public-schema-preview.sql" "$ARCHIVE"
# Use catalog TOC as the source of truth (text scanning of binary dump is insufficient).
awk '$0 !~ /^;/ && $0 ~ / TABLE public / {n++} END {print "public table TOC entries:",n+0}' "$OUT/toc.txt"
awk '$0 !~ /^;/ && $0 ~ / FUNCTION public / {n++} END {print "public function TOC entries:",n+0}' "$OUT/toc.txt"
awk '$0 !~ /^;/ && $0 ~ / POLICY public / {n++} END {print "public policy TOC entries:",n+0}' "$OUT/toc.txt"
printf 'Archive verified: %s\nStaging project ref: %s\n' "$observed_sha" "$EXPECTED_STAGING_REF"
printf 'SQL preview: %s\n' "$OUT/public-schema-preview.sql"
printf 'NO restore executed. DO NOT commit, share or publish the reports.\n'
# Manual review before any authorized import: managed schemas auth/storage,
# extension versions, search_path, SECURITY DEFINER, triggers, RLS and FKs.
