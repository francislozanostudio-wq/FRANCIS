$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH

$repo = 'francislozanostudio-wq/FRANCIS'

Write-Output "--- repo info ---"
$info = ((gh api "repos/$repo" | Out-String).Trim() | ConvertFrom-Json)
Write-Output ("default_branch: {0}" -f $info.default_branch)
Write-Output ("pushed_at:      {0}" -f $info.pushed_at)
Write-Output ("private:        {0}" -f $info.private)
Write-Output ("permissions:    push={0} admin={1}" -f $info.permissions.push, $info.permissions.admin)

Write-Output ""
Write-Output "--- local vs remote file trees ---"
$local = 'C:\Users\user\Desktop\project\francis-final-main'
$exclude = @('node_modules','dist','.git','.env','.bolt','.vscode','.idea')
$localFiles = @(
  Get-ChildItem -Recurse -File -Force $local |
    Where-Object { $p = $_.FullName.Substring($local.Length+1); -not ($p -split '[\\/]' | Where-Object { $exclude -contains $_ }) } |
    ForEach-Object { $_.FullName.Substring($local.Length+1).Replace('\','/') }
)
$tree = ((gh api "repos/$repo/git/trees/HEAD?recursive=1" | Out-String).Trim() | ConvertFrom-Json)
$remote = @($tree.tree | Where-Object { $_.type -eq 'blob' } | Select-Object -ExpandProperty path)
$common = @($localFiles | Where-Object { $remote -contains $_ })
$onlyLocal = @($localFiles | Where-Object { $remote -notcontains $_ })
$onlyRemote = @($remote | Where-Object { $localFiles -notcontains $_ })

Write-Output ("local files: {0} | remote files: {1} | common: {2} | match: {3}%" -f $localFiles.Count, $remote.Count, $common.Count, [math]::Round(100.0*$common.Count/[math]::Max(1,$localFiles.Count),1))
Write-Output ("only local ({0}) first 12:" -f $onlyLocal.Count)
$onlyLocal | Select-Object -First 12 | ForEach-Object { Write-Output "   + $_" }
Write-Output ("only remote ({0}) first 12:" -f $onlyRemote.Count)
$onlyRemote | Select-Object -First 12 | ForEach-Object { Write-Output "   - $_" }
