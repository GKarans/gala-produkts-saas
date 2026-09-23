$ErrorActionPreference = 'Stop'
$secure = $null
$pointer = [IntPtr]::Zero
$connectionString = $null
$exitCode = 1

try {
  $env:PLATFORM_MODE = 'staging'
  $env:PLATFORM_MIGRATE = '1'
  $secure = Read-Host 'New closed-test Supabase PostgreSQL URL (input hidden)' -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $connectionString = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)

  if ([string]::IsNullOrWhiteSpace($connectionString) -or $connectionString -notmatch '^postgres(?:ql)?://') {
    throw 'Paste the full PostgreSQL URI from Supabase Connect. Do not leave this prompt blank or enter only the project URL.'
  }
  try {
    $uri = [Uri]::new($connectionString)
  } catch {
    throw 'That is not a valid PostgreSQL URI. Copy the full URI from Supabase Connect and try again.'
  }
  if (-not $uri.IsAbsoluteUri -or -not $uri.Host) {
    throw 'That is not a valid PostgreSQL URI. Copy the full URI from Supabase Connect and try again.'
  }

  $projectRef = $null
  $isDirect = $uri.Host -match '^db\.([a-z0-9]+)\.supabase\.co$'
  if ($isDirect) {
    if ($uri.Port -ne 5432) {
      throw 'Use PostgreSQL port 5432. Do not use a transaction pooler port.'
    }
    $projectRef = $Matches[1]
  } else {
    $username = [Uri]::UnescapeDataString(($uri.UserInfo -split ':', 2)[0])
    if ($username -match '^postgres\.([a-z0-9]+)$' -and $uri.Host -like '*.pooler.supabase.com' -and $uri.Port -eq 5432) {
      $projectRef = $Matches[1]
    }
  }
  if (-not $projectRef) {
    throw 'Use a Supabase Direct URI, or the Session pooler URI on port 5432. Do not use the project API URL or Transaction pooler (port 6543).'
  }
  Write-Host "Connection targets Supabase project: $projectRef"
  $confirmation = Read-Host "Type ONLY '$projectRef' to confirm (not 'postgres.$projectRef' or the database host)"
  if ($confirmation -cne $projectRef) {
    throw "Project reference did not match. At this prompt enter only '$projectRef'. No migration was run."
  }

  $dnsCheck = "require('node:dns').promises.lookup(process.argv[1], {all:true}).then(() => process.exit(0), () => process.exit(1))"
  & node -e $dnsCheck $uri.Host
  if ($LASTEXITCODE -ne 0) {
    if ($uri.Host -match '^db\.[a-z0-9]+\.supabase\.co$') {
      throw 'This direct Supabase endpoint cannot be resolved by Node on this computer. In Supabase Connect, copy the Session pooler URL on port 5432 and rerun this script. Do not use Transaction pooler (port 6543). No migration was run.'
    }
    throw 'The database hostname cannot be resolved by Node on this computer. No migration was run.'
  }

  $env:PLATFORM_DATABASE_URL = $connectionString

  & node platform/scripts/migrate.mjs
  $exitCode = $LASTEXITCODE
} finally {
  Remove-Item Env:PLATFORM_MODE, Env:PLATFORM_MIGRATE, Env:PLATFORM_DATABASE_URL -ErrorAction SilentlyContinue
  if ($pointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
  if ($secure) {
    $secure.Dispose()
  }
  $connectionString = $null
}

exit $exitCode
