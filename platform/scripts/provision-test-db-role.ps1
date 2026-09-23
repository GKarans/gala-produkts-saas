$ErrorActionPreference = 'Stop'
$adminSecure = $null
$runtimeSecure = $null
$adminPointer = [IntPtr]::Zero
$runtimePointer = [IntPtr]::Zero
$adminUrl = $null
$runtimePassword = $null
$exitCode = 1

try {
  $adminSecure = Read-Host 'New test project postgres admin URL (input hidden)' -AsSecureString
  $adminPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminSecure)
  $adminUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($adminPointer)
  $uri = [Uri]::new($adminUrl)
  $projectRef = $null
  if ($uri.Host -match '^db\.([a-z0-9]+)\.supabase\.co$') {
    $projectRef = $Matches[1]
  } else {
    $username = [Uri]::UnescapeDataString(($uri.UserInfo -split ':', 2)[0])
    if ($username -match '^postgres\.([a-z0-9]+)$') {
      $projectRef = $Matches[1]
    }
  }
  if (-not $projectRef) {
    throw 'Could not identify a Supabase project from this Direct or Session pooler URL.'
  }
  Write-Host "Connection targets Supabase project: $projectRef"
  $confirmation = Read-Host 'Type that exact project reference to confirm this test project'
  if ($confirmation -cne $projectRef) {
    throw 'Project reference did not match. No role was created.'
  }

  $runtimeSecure = Read-Host 'Random URL-safe runtime DB password, 32+ characters (input hidden)' -AsSecureString
  $runtimePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($runtimeSecure)
  $runtimePassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($runtimePointer)
  if ($runtimePassword -notmatch '^[A-Za-z0-9_-]{32,}$') {
    throw 'Use a random URL-safe password with at least 32 characters.'
  }

  $env:PLATFORM_MODE = 'staging'
  $env:PLATFORM_PROVISION_TEST_ROLE = '1'
  $env:PLATFORM_TARGET_PROJECT_REF = $projectRef
  $env:PLATFORM_DATABASE_URL = $adminUrl
  $env:PLATFORM_RUNTIME_PASSWORD = $runtimePassword
  & node platform/scripts/provision-test-db-role.mjs
  $exitCode = $LASTEXITCODE
} finally {
  Remove-Item Env:PLATFORM_MODE, Env:PLATFORM_PROVISION_TEST_ROLE, Env:PLATFORM_TARGET_PROJECT_REF, Env:PLATFORM_DATABASE_URL, Env:PLATFORM_RUNTIME_PASSWORD -ErrorAction SilentlyContinue
  if ($adminPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($adminPointer)
  }
  if ($runtimePointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($runtimePointer)
  }
  if ($adminSecure) {
    $adminSecure.Dispose()
  }
  if ($runtimeSecure) {
    $runtimeSecure.Dispose()
  }
  $adminUrl = $null
  $runtimePassword = $null
}

exit $exitCode
