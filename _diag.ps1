$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH
$p = 'C:\Users\user\Desktop\project\francis-final-main'

Write-Output "--- .git present in project folder? ---"
Write-Output (Test-Path "$p\.git")

Write-Output ""
Write-Output "--- git root seen from project folder ---"
git -C $p rev-parse --show-toplevel

Write-Output ""
Write-Output "--- remote of that root ---"
git -C $p remote -v

Write-Output ""
Write-Output "--- branch / commits ---"
git -C $p branch --show-current
git -C $p log --oneline -3

Write-Output ""
Write-Output "--- parent repo remote (C:\Users\user\Desktop\project) ---"
git -C 'C:\Users\user\Desktop\project' remote -v

Write-Output ""
Write-Output "--- does the target repo exist / can we see it? ---"
gh repo view francislozanostudio-wq/francis-final --json name,owner,visibility 2>&1 | Out-String

Write-Output ""
Write-Output "--- gh auth status ---"
gh auth status 2>&1 | Out-String
