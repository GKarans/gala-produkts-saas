$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$toolCandidates = @()
if ($env:LOCALAPPDATA) {
  $toolCandidates += Join-Path $env:LOCALAPPDATA 'Lumiq\postgresql17\bin'
}
if ($env:USERPROFILE) {
  $toolCandidates += Join-Path $env:USERPROFILE 'AppData\Local\Lumiq\postgresql17\bin'
}
if ($env:ProgramFiles) {
  $toolCandidates += Join-Path $env:ProgramFiles 'PostgreSQL\17\bin'
}
$pathDump = Get-Command pg_dump.exe -ErrorAction SilentlyContinue
$pathRestore = Get-Command pg_restore.exe -ErrorAction SilentlyContinue
if ($pathDump -and $pathRestore -and (Split-Path -Parent $pathDump.Source) -eq (Split-Path -Parent $pathRestore.Source)) {
  $toolCandidates += Split-Path -Parent $pathDump.Source
}
$toolPath = $null
foreach ($candidate in $toolCandidates) {
  if ((Test-Path -LiteralPath (Join-Path $candidate 'pg_dump.exe')) -and
      (Test-Path -LiteralPath (Join-Path $candidate 'pg_restore.exe'))) {
    $toolPath = $candidate
    break
  }
}
$backupRoot = Join-Path $env:LOCALAPPDATA 'Lumiq\backups'
$backupPath = Join-Path $backupRoot ('lumiq-restore-drill-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$environmentNames = @(
  'PLATFORM_DATABASE_URL',
  'PLATFORM_R2_BUCKET',
  'PLATFORM_R2_ENDPOINT',
  'PLATFORM_R2_ACCESS_KEY_ID',
  'PLATFORM_R2_SECRET_ACCESS_KEY'
)

function Set-MaskedProcessValue {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Prompt
  )

  $secureValue = Read-Host -Prompt $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  try {
    [Environment]::SetEnvironmentVariable(
      $Name,
      [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer),
      'Process'
    )
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $secureValue.Dispose()
  }
}

if (-not $toolPath) {
  $checked = if ($toolCandidates.Count) { $toolCandidates -join '; ' } else { 'LOCALAPPDATA and USERPROFILE are unset' }
  throw "PostgreSQL 17 client tools were not found. Install only the PostgreSQL 17 Command Line Tools, then rerun. Checked: $checked."
}
$dumpVersion = (& (Join-Path $toolPath 'pg_dump.exe') --version | Out-String).Trim()
$restoreVersion = (& (Join-Path $toolPath 'pg_restore.exe') --version | Out-String).Trim()
if ($dumpVersion -notmatch '^pg_dump \(PostgreSQL\) 17\.' -or $restoreVersion -notmatch '^pg_restore \(PostgreSQL\) 17\.') {
  throw "PostgreSQL 17 client tools are required. Found: '$dumpVersion'; '$restoreVersion'."
}
if (Test-Path -LiteralPath $backupPath) {
  throw 'The generated backup path already exists; do not overwrite a previous drill.'
}

$env:PATH = "$toolPath;$env:PATH"
Push-Location $repoRoot
try {
  Set-MaskedProcessValue 'PLATFORM_DATABASE_URL' 'Supabase Session Pooler URL (5432)'
  Set-MaskedProcessValue 'PLATFORM_R2_BUCKET' 'Source R2 bucket name'
  Set-MaskedProcessValue 'PLATFORM_R2_ENDPOINT' 'Cloudflare R2 S3 endpoint URL'
  Set-MaskedProcessValue 'PLATFORM_R2_ACCESS_KEY_ID' 'Bucket-scoped R2 read-only access key ID'
  Set-MaskedProcessValue 'PLATFORM_R2_SECRET_ACCESS_KEY' 'Bucket-scoped R2 read-only secret key'

  $expectedBucket = 'lumiq-closed-test-photos'
  if ($env:PLATFORM_R2_BUCKET -cne $expectedBucket) {
    throw "This backup helper only permits the approved source bucket '$expectedBucket'."
  }

  & npm.cmd run backup -- $backupPath
  if ($LASTEXITCODE -ne 0) { throw 'Backup command failed; do not restore this output.' }

  & npm.cmd run backup:verify -- $backupPath
  if ($LASTEXITCODE -ne 0) { throw 'Backup verification failed; do not restore this output.' }

  Write-Host "Verified closed-test backup: $backupPath"
} finally {
  foreach ($name in $environmentNames) {
    [Environment]::SetEnvironmentVariable($name, $null, 'Process')
  }
  Pop-Location
}
