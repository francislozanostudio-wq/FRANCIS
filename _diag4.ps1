$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH
$u = ((gh api users/francislozanostudio-wq | Out-String).Trim() | ConvertFrom-Json)
Write-Output ("login:        {0}" -f $u.login)
Write-Output ("name:         {0}" -f $u.name)
Write-Output ("public_repos: {0}" -f $u.public_repos)
Write-Output ("created_at:   {0}" -f $u.created_at)
Write-Output ""
Write-Output "--- public repos ---"
gh api "users/francislozanostudio-wq/repos?per_page=100&type=public" --paginate | Select-String '"full_name"' | ForEach-Object { $_.Line.Trim() }
