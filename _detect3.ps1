$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH

foreach ($r in @('FRANCIS-mainfff','aymanefrancis')) {
  Write-Output "===== $r ====="
  $raw = (gh api "repos/aymaneids/$r" | Out-String).Trim()
  $info = $raw | ConvertFrom-Json
  Write-Output ("default_branch: {0} | pushed_at: {1} | size: {2} KB | private: {3}" -f $info.default_branch, $info.pushed_at, $info.size, $info.private)
  $craw = (gh api "repos/aymaneids/$r/commits?per_page=8" | Out-String).Trim()
  $commits = $craw | ConvertFrom-Json
  foreach ($c in $commits) {
    $msg = ($c.commit.message -split "`n")[0]
    Write-Output ("   {0}  {1}  {2}" -f $c.sha.Substring(0,7), $c.commit.author.date, $msg)
  }
  Write-Output ""
}
