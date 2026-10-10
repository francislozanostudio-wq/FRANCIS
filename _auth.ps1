$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH

Write-Output "--- credential helpers ---"
Write-Output ("global: " + (git config --global credential.helper))
Write-Output ("system: " + (git config --system credential.helper))
Write-Output ("local:  " + (git -C 'C:\Users\user\Desktop\project\francis-final-main' config --local credential.helper))
Write-Output ""
Write-Output "--- gh accounts ---"
gh auth status 2>&1 | Out-String
Write-Output "--- gh as credential helper for github.com? ---"
gh auth setup-git --help 2>&1 | Select-Object -First 3 | Out-String
