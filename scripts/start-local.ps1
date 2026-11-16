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
& node (Join-Path $PSScriptRoot 'build-eir-ui.mjs')
if ($LASTEXITCODE -ne 0) { throw 'EIR appearance build failed. Run -Install to restore GOAT frontend dependencies.' }
$tags = Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
$installedModels = @($tags.models | ForEach-Object { $_.name } | Where-Object { $_ })
if (-not $installedModels.Count) { throw 'Ollama has no installed models. Install a suitable model separately before starting the demo.' }
# Scope all overrides to child services, including when startup fails. A previous
# isolated/OpenAI rehearsal must not change this local launcher's provider or port.
$launchEnvironment = @{
    GOAT_DEPLOY_MODE = '0'
    GOAT_USE_CHAT_API = 'true'
    GOAT_SYSTEM_PROMPT_FILE = ''
    GOAT_SYSTEM_PROMPT = Get-Content -LiteralPath (Join-Path $projectRoot 'eir\prompts\goat-english.txt') -Raw -Encoding UTF8
    GOAT_RUNTIME_ROOT = Join-Path $runtimeRoot 'goat'
    GOAT_LOG_PATH = Join-Path $runtimeRoot 'goat\chat_logs.db'
    GOAT_DATA_DIR = Join-Path $runtimeRoot 'goat\data'
    GOAT_LOG_DIR = Join-Path $runtimeRoot 'goat\logs'
    GOAT_OBJECT_STORE_BACKEND = 'local'
    GOAT_RUNTIME_METADATA_BACKEND = 'sqlite'
    GOAT_OBJECT_STORE_ROOT = Join-Path $runtimeRoot 'goat\data'
    OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
    GOAT_WORKBENCH_WEB_PROVIDER = 'disabled'
    GOAT_FEATURE_CODE_SANDBOX = '0'
    GOAT_FEATURE_AGENT_WORKBENCH = '0'
    GOAT_OLLAMA_MAX_CONCURRENT_REQUESTS = '1'
    EIR_DB_PATH = Join-Path $runtimeRoot 'eir\ventures.sqlite3'
    EIR_GOAT_BASE_URL = 'http://127.0.0.1:62606'
    EIR_HTTP_PORT = '62607'
    EIR_MODEL_PROVIDER = 'goat'
    EIR_CONFIG_FILE = $null
}
$previousEnvironment = @{}
foreach ($key in $launchEnvironment.Keys) { $previousEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
try {
    foreach ($key in $launchEnvironment.Keys) { [Environment]::SetEnvironmentVariable($key, $launchEnvironment[$key], 'Process') }
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
                $headers = if ($service.name -eq 'eir') { @{ Origin = 'http://127.0.0.1:62607' } } else { @{} }
                $health = Invoke-RestMethod "http://127.0.0.1:$($service.port)/api/health" -Headers $headers -TimeoutSec 2
                if ($health.status -eq 'ok') { $ready = $true; break }
            } catch { Start-Sleep -Milliseconds 500 }
        }
        if (-not $ready) { throw "$($service.name) failed health/browser-origin check; inspect var logs and restart this checkout's services." }
    }
    $readiness = Invoke-RestMethod 'http://127.0.0.1:62606/api/ready' -TimeoutSec 10
    if (-not $readiness.ready) { throw 'GOAT dependency readiness failed.' }
    $models = Invoke-RestMethod 'http://127.0.0.1:62607/api/models' -Headers @{ Origin = 'http://127.0.0.1:62607' } -TimeoutSec 20
    if (-not @($models.models).Count -or @($models.models | Where-Object { $_ -notin $installedModels }).Count) {
        throw 'EIR is not serving the installed local models. Stop this checkout''s services, then restart the local launcher.'
    }
    $readiness | ConvertTo-Json -Depth 4
    Write-Host 'Virtual EIR: http://127.0.0.1:62607'
    Write-Host 'GOAT AI:    http://127.0.0.1:62606'
    Write-Host "Local models: $($models.models -join ', '). Send one fictional message to verify generation before presenting."
} finally {
    foreach ($key in $launchEnvironment.Keys) { [Environment]::SetEnvironmentVariable($key, $previousEnvironment[$key], 'Process') }
}
