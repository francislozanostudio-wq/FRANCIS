$env:PATH = 'C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;' + $env:PATH
$json = (gh repo list aymaneids --limit 100 --json name,visibility,updatedAt,description | Out-String).Trim()
$repos = $json | ConvertFrom-Json
$repos | Select-Object name, visibility, updatedAt, description | Format-Table -AutoSize | Out-String -Width 200
