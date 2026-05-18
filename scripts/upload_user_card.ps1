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

Write-Step "Checking repository"
$insideRepo = git rev-parse --is-inside-work-tree
if ($insideRepo -ne "true") {
  throw "This script must be run inside a Git repository."
}

$remoteUrl = git remote get-url $remoteName 2>$null
if (-not $remoteUrl) {
  throw "Remote '$remoteName' is missing. Expected: https://github.com/hajimi0220-design/user_card.git"
}

Write-Host "Repo:   $repoRoot"
Write-Host "Remote: $remoteName -> $remoteUrl"
Write-Host "Target: $remoteName/$remoteBranch"

$changes = git status --porcelain
if (-not $changes) {
  Write-Host ""
  Write-Host "No local changes to upload."
  exit 0
}

if (-not $Message) {
  $Message = "upload project files $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Step "Staging all changes"
git add -A

Write-Step "Creating commit"
git commit -m $Message

Write-Step "Pushing to GitHub"
git push -u $remoteName HEAD:$remoteBranch

Write-Host ""
Write-Host "Upload complete."
