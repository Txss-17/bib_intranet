#!/usr/bin/env bash
# Inspect a Lovable Cloud PostgreSQL export without restoring or extracting data.
# Usage: bash scripts/migration/verify-backup.sh /secure/path/project.backup
set -Eeuo pipefail
umask 077

if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "Usage: $0 /secure/path/project.backup[.gz]" >&2
  exit 2
fi
command -v pg_restore >/dev/null || { echo "ERROR: PostgreSQL client pg_restore is required." >&2; exit 2; }
command -v od >/dev/null || { echo "ERROR: od is required." >&2; exit 2; }

archive="$1"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT
work_archive="$archive"

# If the export is a gzip-wrapped custom archive, unpack privately.
magic="$(od -An -tx1 -N2 "$archive" | tr -d '[:space:]')"
if [[ "$magic" == "1f8b" ]]; then
  command -v gzip >/dev/null || { echo "ERROR: gzip is required." >&2; exit 2; }
  gzip -t "$archive"
  gzip -cd "$archive" > "$workdir/uncompressed.backup"
  work_archive="$workdir/uncompressed.backup"
fi

# Listing a custom-format backup is read-only. Do not run pg_restore -d here.
if ! pg_restore --list "$work_archive" > "$workdir/toc.txt" 2> "$workdir/pg-error.txt"; then
  echo "ERROR: archive cannot be listed with pg_restore." >&2
  echo "It may be a plain SQL dump or a damaged/incompatible backup. Stop: do not restore." >&2
  exit 1
fi
if command -v sha256sum >/dev/null; then
  hash="$(sha256sum "$archive" | cut -d ' ' -f1)"
elif command -v shasum >/dev/null; then
  hash="$(shasum -a 256 "$archive" | cut -d ' ' -f1)"
else
  echo "ERROR: sha256sum or shasum is required." >&2; exit 2
fi

# Aggregate only: never emit SQL statements, row data, personal identifiers or secret values.
count_type() {
  local type="$1"
  awk -v t="$type" '$0 !~ /^;/ && index($0, " " t " ") > 0 { n++ } END { print n + 0 }' "$workdir/toc.txt"
}
size_bytes="$(wc -c < "$archive" | tr -d '[:space:]')"
printf 'backup_status=LISTABLE\narchive_bytes=%s\narchive_sha256=%s\n' "$size_bytes" "$hash"
printf 'toc_tables=%s\n' "$(count_type TABLE)"
printf 'toc_table_data=%s\n' "$(count_type 'TABLE DATA')"
printf 'toc_functions=%s\n' "$(count_type FUNCTION)"
printf 'toc_policies=%s\n' "$(count_type POLICY)"
printf 'toc_triggers=%s\n' "$(count_type TRIGGER)"
printf 'toc_schemas=%s\n' "$(count_type SCHEMA)"
printf 'toc_extensions=%s\n' "$(count_type EXTENSION)"
printf 'restore_tested=NO\n'
echo "NEXT: compare this evidence against source inventory, then restore ONLY in an isolated staging Supabase project following a reviewed runbook." >&2
