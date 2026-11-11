#requires -Version 5.1
<#
.SYNOPSIS
  Offline inspection of a sensitive PostgreSQL custom backup. No database connection.
.EXAMPLE
  pwsh -File ./scripts/migration/inspect-backup.ps1 -Archive "C:\BIB\bib-intranet_261111.backup"
#>
param([Parameter(Mandatory=$true)][string]$Archive, [string]$OutputDirectory = './backup-check-report')
$ErrorActionPreference = 'Stop'
$expectedSha = '445786e70edc5fa6bab0228dea5071238da180d7cb10275a6de0d9a811c781a5'
$expectedRef = 'hjquaokkcpnwnvpdfmyj'
if (-not (Test-Path -LiteralPath $Archive -PathType Leaf)) { throw 'Archive not found' }
$resolved = (Resolve-Path -LiteralPath $Archive).Path
$stream = [System.IO.File]::OpenRead($resolved)
try { $signature = New-Object byte[] 5; $read = $stream.Read($signature,0,5) } finally { $stream.Dispose() }
if ($read -ne 5 -or [Text.Encoding]::ASCII.GetString($signature) -ne 'PGDMP') { throw 'Invalid PostgreSQL custom archive signature' }
$sha = (Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash.ToLowerInvariant()
if ($sha -ne $expectedSha) { throw "Backup hash mismatch: $sha" }
$command = Get-Command pg_restore -ErrorAction SilentlyContinue
if (-not $command) { throw 'pg_restore unavailable: install PostgreSQL client and add its bin directory to PATH' }
$version = (& pg_restore --version 2>&1 | Out-String).Trim()
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$output = (Resolve-Path $OutputDirectory).Path
$toc = Join-Path $output 'archive-toc.txt'
$stderr = Join-Path $output 'pg-restore-error.txt'
$p = Start-Process -FilePath $command.Source -ArgumentList @('--list', ('"'+$resolved+'"')) -NoNewWindow -Wait -PassThru -RedirectStandardOutput $toc -RedirectStandardError $stderr
if ($p.ExitCode -ne 0) { throw "pg_restore --list failed, see $stderr" }
$tocText = Get-Content -LiteralPath $toc
$objLines = @($tocText | Where-Object { $_ -match '^\d+;' })
$schemas = @('public','auth','storage','cron','pgmq')
$rows = foreach($schema in $schemas) {
  [pscustomobject]@{ schema=$schema; entries=@($objLines | Where-Object { $_ -match ('\s'+[regex]::Escape($schema)+'\s') }).Count }
}
$summary = [ordered]@{ check='offline_only'; archive=(Split-Path $resolved -Leaf); sha256=$sha; bytes=(Get-Item -LiteralPath $resolved).Length; pg_restore=$version; expectedSupabaseStagingRef=$expectedRef; tocEntries=$objLines.Count; schemaEntryCounts=$rows; generatedUtc=[datetime]::UtcNow.ToString('o'); restoreExecuted=$false }
$json = Join-Path $output 'summary.json'
$summary | ConvertTo-Json -Depth 6 | Set-Content -Path $json -Encoding UTF8
Write-Host "ARCHIVE VALIDATED: $(Split-Path $resolved -Leaf)"
Write-Host "Report: $json"
Write-Host 'NO RESTORE WAS EXECUTED. Archive TOC might reveal schema names; do not publish it to a public repository.'
