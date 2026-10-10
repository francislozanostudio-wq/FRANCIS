$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH
$ErrorActionPreference = 'Continue'
$p = 'C:\Users\user\Desktop\project\francis-final-main'

Write-Output "=== 1. Active gh account ==="
gh auth status 2>&1 | Out-String

Write-Output "=== 2. Point ONLY this repo at gh credentials ==="
git -C $p config --local credential.helper ""
git -C $p config --local "credential.https://github.com.helper" "!gh auth git-credential"
Write-Output ("local helper: " + (git -C $p config --local credential.helper))
Write-Output ("local gh helper: " + (git -C $p config --local "credential.https://github.com.helper"))

Write-Output ""
Write-Output "=== 3. Commit identity ==="
$name  = git config --global user.name
$email = git config --global user.email
if (-not $name)  { git -C $p config --local user.name "francislozanostudio-wq";  $name = "francislozanostudio-wq" }
if (-not $email) { git -C $p config --local user.email "francislozanostudio-wq@users.noreply.github.com"; $email = "francislozanostudio-wq@users.noreply.github.com" }
Write-Output ("author: {0} <{1}>" -f $name, $email)

Write-Output ""
Write-Output "=== 4. Oversized file check (>40MB) ==="
$big = Get-ChildItem -Recurse -File -Force $p |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.git\\|\\dist\\' -and $_.Length -gt 40MB }
if ($big) { $big | ForEach-Object { Write-Output ("  {0} MB  {1}" -f [math]::Round($_.Length/1MB,1), $_.Name) } } else { Write-Output "  none" }

Write-Output ""
Write-Output "=== 5. Stage everything ==="
git -C $p add -A 2>&1 | Out-String
$staged = git -C $p diff --cached --name-only
Write-Output ("staged files: {0}" -f @($staged).Count)
Write-Output ("-- confirm .env is NOT staged --")
$envStaged = @($staged | Where-Object { $_ -match '(^|/)\.env' })
if ($envStaged) { Write-Output "  WARNING: $($envStaged -join ', ')" } else { Write-Output "  OK - no .env staged" }
