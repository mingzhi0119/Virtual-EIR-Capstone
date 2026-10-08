param([switch]$Install)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$goatRoot = Join-Path $projectRoot 'apps\goat'
$pythonExe = Join-Path $goatRoot '.venv\Scripts\python.exe'
$runtimeRoot = Join-Path $projectRoot 'var'
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
if ($Install) {
    if (-not (Test-Path -LiteralPath $pythonExe)) {
        py -3.14 -m venv (Join-Path $goatRoot '.venv')
        if ($LASTEXITCODE -ne 0) { throw 'Python 3.14 virtual environment creation failed.' }
    }
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        uv pip install --python $pythonExe -r (Join-Path $goatRoot 'requirements-ci.txt')
    } else {
        & $pythonExe -m pip install -r (Join-Path $goatRoot 'requirements-ci.txt')
    }
    if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
    Push-Location (Join-Path $goatRoot 'frontend')
    try {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
    } finally { Pop-Location }
}
if (-not (Test-Path -LiteralPath $pythonExe)) { throw 'Run this script with -Install first.' }
if (-not (Test-Path -LiteralPath (Join-Path $goatRoot 'frontend\dist\index.html'))) { throw 'Build the GOAT frontend first (-Install).' }
Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5 | Out-Null
$env:GOAT_DEPLOY_MODE = '0'
$env:GOAT_RUNTIME_ROOT = Join-Path $runtimeRoot 'goat'
$env:GOAT_LOG_PATH = Join-Path $env:GOAT_RUNTIME_ROOT 'chat_logs.db'
$env:GOAT_DATA_DIR = Join-Path $env:GOAT_RUNTIME_ROOT 'data'
$env:GOAT_LOG_DIR = Join-Path $env:GOAT_RUNTIME_ROOT 'logs'
$env:GOAT_OBJECT_STORE_BACKEND = 'local'
$env:GOAT_RUNTIME_METADATA_BACKEND = 'sqlite'
$env:GOAT_OBJECT_STORE_ROOT = $env:GOAT_DATA_DIR
$env:OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
$env:GOAT_WORKBENCH_WEB_PROVIDER = 'disabled'
$env:GOAT_FEATURE_CODE_SANDBOX = '0'
$env:GOAT_FEATURE_AGENT_WORKBENCH = '0'
$env:GOAT_OLLAMA_MAX_CONCURRENT_REQUESTS = '1'
$env:EIR_DB_PATH = Join-Path $runtimeRoot 'eir\ventures.sqlite3'
$env:EIR_GOAT_BASE_URL = 'http://127.0.0.1:62606'
foreach ($service in @(
    @{name='goat'; port=62606; app='server:create_app'; cwd=$goatRoot},
    @{name='eir'; port=62607; app='eir.app:create_app'; cwd=$projectRoot}
)) {
    $listener = Get-NetTCPConnection -LocalPort $service.port -State Listen -ErrorAction SilentlyContinue
    if ($listener) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener[0].OwningProcess)"
        if ($process.CommandLine -notlike "*$($service.app)*" -or $process.CommandLine -notlike '*--host 127.0.0.1*' -or $process.CommandLine -notlike "*`"$pythonExe`"*") {
            throw "Port $($service.port) is in use by another process. Nothing was stopped."
        }
        Write-Host "$($service.name) is already listening on loopback."
    } else {
        $process = Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn $($service.app) --factory --host 127.0.0.1 --port $($service.port)" -WorkingDirectory $service.cwd -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot "$($service.name)-stdout.log") -RedirectStandardError (Join-Path $runtimeRoot "$($service.name)-stderr.log") -PassThru
        $process.Id | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimeRoot "$($service.name).pid")
    }
    $ready = $false
    for ($attempt=0; $attempt -lt 30; $attempt++) {
        try {
            $health = Invoke-RestMethod "http://127.0.0.1:$($service.port)/api/health" -TimeoutSec 2
            if ($health.status -eq 'ok') { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not $ready) { throw "$($service.name) failed health check; inspect var logs." }
}
$readiness = Invoke-RestMethod 'http://127.0.0.1:62606/api/ready' -TimeoutSec 10
if (-not $readiness.ready) { throw 'GOAT dependency readiness failed.' }
$readiness | ConvertTo-Json -Depth 4
Write-Host 'Virtual EIR: http://127.0.0.1:62607'
Write-Host 'GOAT AI:    http://127.0.0.1:62606'
