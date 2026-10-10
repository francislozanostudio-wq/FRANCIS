$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH
$ErrorActionPreference = 'Continue'
$p = 'C:\Users\user\Desktop\project\francis-final-main'

Write-Output "=== 1. Restore parent repo remote ==="
git -C 'C:\Users\user\Desktop\project' remote set-url origin https://github.com/aymaneids/-_.Name-.git
git -C 'C:\Users\user\Desktop\project' remote -v
Write-Output ""

Write-Output "=== 2. Init repo inside francis-final-main ==="
git -C $p init 2>&1 | Out-String
git -C $p branch -M main
git -C $p remote add origin https://github.com/francislozanostudio-wq/FRANCIS.git 2>&1 | Out-String
git -C $p remote -v
Write-Output ""

Write-Output "=== 3. Fetch existing history (read-only, public repo) ==="
git -C $p fetch origin 2>&1 | Out-String
git -C $p log --oneline origin/main -5
Write-Output ""

Write-Output "=== 4. Anchor index to the remote commit (working files untouched) ==="
git -C $p reset origin/main 2>&1 | Out-String
Write-Output ""

Write-Output "=== 5. What changed vs GitHub ==="
$st = git -C $p status --porcelain
$added    = @($st | Where-Object { $_ -match '^\?\?' })
$modified = @($st | Where-Object { $_ -match '^ M|^M ' })
$deleted  = @($st | Where-Object { $_ -match '^ D|^D ' })
Write-Output ("new files:      {0}" -f $added.Count)
Write-Output ("modified files: {0}" -f $modified.Count)
Write-Output ("deleted files:  {0}" -f $deleted.Count)
Write-Output ""
Write-Output "--- safety check: is .env ignored? ---"
git -C $p check-ignore -v .env 2>&1 | Out-String
Write-Output "--- safety check: is node_modules ignored? ---"
git -C $p check-ignore -v node_modules 2>&1 | Out-String
