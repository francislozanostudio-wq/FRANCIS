$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH

Write-Output "--- Does the user francislozanostudio-wq exist? ---"
gh api users/francislozanostudio-wq --jq '.login + " | public_repos=" + (.public_repos|tostring) + " | created=" + .created_at' 2>&1 | Out-String

Write-Output "--- Public repos of francislozanostudio-wq ---"
gh api "users/francislozanostudio-wq/repos?per_page=100" --jq '.[].full_name' 2>&1 | Out-String

Write-Output "--- Anonymous HTTP status of candidate repo URLs ---"
foreach ($u in @(
  'https://github.com/francislozanostudio-wq/francis-final',
  'https://github.com/francislozanostudio-wq/francis-final-main',
  'https://github.com/francislozanostudio-wq/francis'
)) {
  try {
    $r = Invoke-WebRequest -Uri $u -Method Head -MaximumRedirection 0 -ErrorAction Stop
    Write-Output ("{0} -> {1}" -f $u, $r.StatusCode)
  } catch {
    Write-Output ("{0} -> {1}" -f $u, $_.Exception.Response.StatusCode.value__)
  }
}
