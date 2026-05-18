param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$remoteName = "user_card"
$remoteBranch = "main"

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

Write-Step "Checking repository"
$insideRepo = & git rev-parse --is-inside-work-tree
if ($LASTEXITCODE -ne 0) {
  throw "This script must be run inside a Git repository."
}
if ($insideRepo -ne "true") {
  throw "This script must be run inside a Git repository."
}

$remoteUrl = & git remote get-url $remoteName 2>$null
if (-not $remoteUrl) {
  throw "Remote '$remoteName' is missing. Expected: https://github.com/hajimi0220-design/user_card.git"
}

Write-Host "Repo:   $repoRoot"
Write-Host "Remote: $remoteName -> $remoteUrl"
Write-Host "Target: $remoteName/$remoteBranch"

$changes = & git status --porcelain
if ($LASTEXITCODE -ne 0) {
  throw "Failed to read Git status."
}
if (-not $changes) {
  Write-Host ""
  Write-Host "No local changes to upload."
  exit 0
}

if (-not $Message) {
  $Message = "upload project files $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Step "Staging all changes"
Invoke-Git add -A

Write-Step "Creating commit"
Invoke-Git commit -m $Message

Write-Step "Syncing with remote"
Invoke-Git fetch $remoteName $remoteBranch
Invoke-Git rebase "$remoteName/$remoteBranch"

Write-Step "Pushing to GitHub"
Invoke-Git push -u $remoteName HEAD:$remoteBranch

Write-Host ""
Write-Host "Upload complete."
