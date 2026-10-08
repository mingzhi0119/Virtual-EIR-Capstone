param([ValidateSet('goat','eir','all')][string]$Service='all')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonExe = Join-Path $projectRoot 'apps\goat\.venv\Scripts\python.exe'
foreach ($entry in @(@{name='eir';port=62607;app='eir.app:create_app'}, @{name='goat';port=62606;app='server:create_app'})) {
    if ($Service -ne 'all' -and $Service -ne $entry.name) { continue }
    $listener = Get-NetTCPConnection -LocalPort $entry.port -State Listen -ErrorAction SilentlyContinue
    if (-not $listener) { Write-Host "$($entry.name) is not running."; continue }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener[0].OwningProcess)"
    if ($process.CommandLine -notlike "*`"$pythonExe`"*" -or $process.CommandLine -notlike "*$($entry.app)*" -or $process.CommandLine -notlike '*--host 127.0.0.1*') {
        throw "Refusing to stop an unrelated process on port $($entry.port)."
    }
    Stop-Process -Id $process.ProcessId
    Write-Host "Stopped only this project's $($entry.name) service (PID $($process.ProcessId)); data retained."
}
