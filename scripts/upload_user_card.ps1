param(
  [string]$Message = "",
  [switch]$ForceWithLease
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$remoteName = "user_card"
$remoteBranch = "main"
$expectedRemoteUrl = "https://github.com/hajimi0220-design/user_card.git"

function Write-Step($Text) {
  Write-Host ""
  Write-Host "==> $Text"
}

function Invoke-Git {
  & git @args
  if ($LASTEXITCODE -ne 0) {
    throw "Git command failed: git $($args -join ' ')"
  }
}

function Test-Git {
  & git @args
  return $LASTEXITCODE
}

Write-Step "Checking repository"
$insideRepo = & git rev-parse --is-inside-work-tree
if ($LASTEXITCODE -ne 0 -or $insideRepo -ne "true") {
  throw "This script must be run inside a Git repository."
}

$remoteUrl = & git remote get-url $remoteName 2>$null
if ($LASTEXITCODE -ne 0 -or -not $remoteUrl) {
  throw "Remote '$remoteName' is missing. Expected: $expectedRemoteUrl"
}

if ($remoteUrl -ne $expectedRemoteUrl) {
  Write-Host "Warning: '$remoteName' URL differs from the recorded success case."
}

Write-Host "Repo:   $repoRoot"
Write-Host "Remote: $remoteName -> $remoteUrl"
Write-Host "Target: $remoteName/$remoteBranch"

$changes = & git status --porcelain
if ($LASTEXITCODE -ne 0) {
  throw "Failed to read Git status."
}

if ($changes) {
  if (-not $Message) {
    $Message = "upload project files $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  }

  Write-Step "Staging all changes"
  Invoke-Git add -A

  Write-Step "Creating commit"
  Invoke-Git commit -m $Message
} else {
  Write-Host ""
  Write-Host "No local file changes. Will still check whether local commits need upload."
}

Write-Step "Pushing to GitHub"
if ($ForceWithLease) {
  Invoke-Git push --force-with-lease $remoteName HEAD:$remoteBranch
} else {
  $pushExitCode = Test-Git push -u $remoteName HEAD:$remoteBranch
  if ($pushExitCode -ne 0) {
    Write-Host ""
    Write-Host "Normal push was rejected. If the remote only contains the GitHub Actions '[bot] bundle' commit, rerun:"
    Write-Host ".\scripts\upload_user_card.ps1 -ForceWithLease"
    Write-Host ""
    Write-Host "This keeps the recorded successful upload route explicit and avoids silently overwriting remote work."
    exit $pushExitCode
  }
}

Write-Host ""
Write-Host "Upload complete."
