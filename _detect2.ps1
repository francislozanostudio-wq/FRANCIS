$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH

$local = 'C:\Users\user\Desktop\project\francis-final-main'
$exclude = @('node_modules','dist','.git','.env','.bolt')

$localFiles = @(
  Get-ChildItem -Recurse -File -Force $local |
    Where-Object { $p = $_.FullName.Substring($local.Length+1); -not ($p -split '[\\/]' | Where-Object { $exclude -contains $_ }) } |
    ForEach-Object { $_.FullName.Substring($local.Length+1).Replace('\','/') }
)
Write-Output ("LOCAL tracked-style files: " + $localFiles.Count)
Write-Output ""

foreach ($r in @('FRANCIS-mainfff','aymanefrancis')) {
  $raw = (gh api "repos/aymaneids/$r/git/trees/HEAD?recursive=1" | Out-String).Trim()
  $tree = $raw | ConvertFrom-Json
  $remote = @($tree.tree | Where-Object { $_.type -eq 'blob' } | Select-Object -ExpandProperty path)
  $onlyLocal  = @($localFiles | Where-Object { $remote -notcontains $_ })
  $onlyRemote = @($remote     | Where-Object { $localFiles -notcontains $_ })
  $common     = @($localFiles | Where-Object { $remote -contains $_ })
  $pct = [math]::Round(100.0 * $common.Count / [math]::Max(1,$localFiles.Count), 1)

  Write-Output "===== $r ====="
  Write-Output ("remote files: {0} | common: {1} | coverage of local: {2}%" -f $remote.Count, $common.Count, $pct)
  Write-Output ("-- only LOCAL ({0}), first 15:" -f $onlyLocal.Count)
  $onlyLocal | Select-Object -First 15 | ForEach-Object { Write-Output "   + $_" }
  Write-Output ("-- only REMOTE ({0}), first 15:" -f $onlyRemote.Count)
  $onlyRemote | Select-Object -First 15 | ForEach-Object { Write-Output "   - $_" }
  Write-Output ""
}
