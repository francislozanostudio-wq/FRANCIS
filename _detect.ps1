$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH

$local = 'C:\Users\user\Desktop\project\francis-final-main'
$localNames = @(Get-ChildItem -Force $local | Where-Object { $_.Name -notin @('.env','node_modules','dist','.git') } | Select-Object -ExpandProperty Name)
Write-Output ("LOCAL top-level entries: " + $localNames.Count)
Write-Output ""

$candidates = @(
  'FRANCIS-mainfff','FRANCIS-mainjj','aymanefrancis','francisv7','francisv6','francisv5',
  'francisv4','francisv3','francisv2ff','francisv2','francis-nail-artistry-30','francisnailsv6',
  'nailssssa','-_.Name-','pixel-perfect-pixels','zu-hair-glow-main','rosev2ff','rosev2'
)

$results = @()
foreach ($r in $candidates) {
  $raw = (gh api "repos/aymaneids/$r/contents" 2>$null | Out-String).Trim()
  if (-not $raw) { Write-Output "$r -> (no access / empty)"; continue }
  try { $items = $raw | ConvertFrom-Json } catch { Write-Output "$r -> (parse fail)"; continue }
  $names = @($items | Select-Object -ExpandProperty name)
  $overlap = @($names | Where-Object { $localNames -contains $_ })
  $score = [math]::Round(100.0 * $overlap.Count / [math]::Max(1,$localNames.Count), 0)
  $results += [pscustomobject]@{ Repo=$r; RemoteFiles=$names.Count; Matching=$overlap.Count; ScorePct=$score; Missing=($localNames.Count-$overlap.Count) }
}
$results | Sort-Object ScorePct -Descending | Format-Table -AutoSize | Out-String -Width 200
