$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$toolPath = Join-Path $env:LOCALAPPDATA 'Lumiq\postgresql17\bin'
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

if (-not (Test-Path -LiteralPath (Join-Path $toolPath 'pg_dump.exe')) -or
    -not (Test-Path -LiteralPath (Join-Path $toolPath 'pg_restore.exe'))) {
  throw 'PostgreSQL client tools are missing. Follow the owner verification guide first.'
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
