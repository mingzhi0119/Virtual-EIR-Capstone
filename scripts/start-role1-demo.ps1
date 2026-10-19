param(
    [ValidateSet('ready','draft','approved','progress','followup','final','empty')]
    [string]$Scene = 'ready',
    [ValidateRange(1024,65535)][int]$Port = 62609,
    [ValidateSet('goat','openai')][string]$Provider = 'goat',
    [string]$Model = '',
    [switch]$Resume,
    [switch]$Stop
)
$ErrorActionPreference = 'Stop'
if ($Port -in @(62606,62607,62608,11434)) { throw 'Use a separate port for Role 1. Shared/model/proof ports are reserved.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
$demoRoot = Join-Path $projectRoot 'var\role1-demo'
$pythonExe = Join-Path $projectRoot 'apps\goat\.venv\Scripts\python.exe'
New-Item -ItemType Directory -Path $demoRoot -Force | Out-Null
$receiptPath = Join-Path $demoRoot "server-$Port.json"
$resumeReceipt = $null
if ($Resume -and -not $Stop) {
    if (-not (Test-Path -LiteralPath $receiptPath)) { throw 'No recorded take is available to resume.' }
    $resumeReceipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
    if ($resumeReceipt.project -ne $projectRoot -or -not (Test-Path -LiteralPath $resumeReceipt.database)) { throw 'The recorded take does not belong to this checkout or its database is missing.' }
    $resolvedTake = [IO.Path]::GetFullPath($resumeReceipt.take)
    $resolvedDemo = [IO.Path]::GetFullPath($demoRoot).TrimEnd('\') + '\'
    if (-not $resolvedTake.StartsWith($resolvedDemo, [StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFullPath($resumeReceipt.database) -ne (Join-Path $resolvedTake 'demo.sqlite3')) { throw 'The recorded take is outside the demo folder.' }
    $Provider = $resumeReceipt.provider
    $Scene = $resumeReceipt.scene
}
$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    if (-not (Test-Path -LiteralPath $receiptPath)) { throw "Port $Port is occupied without a demo receipt. Nothing was stopped." }
    $receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener[0].OwningProcess)"
    $launchProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($receipt.pid)"
    # Windows venv python may launch a child interpreter which owns the socket.
    $owned = $process.ProcessId -eq $receipt.pid -or ($process.ParentProcessId -eq $receipt.pid -and $launchProcess.CommandLine -like "*`"$pythonExe`"*" -and $launchProcess.CommandLine -like '*eir.app:create_app*')
    if ($receipt.project -ne $projectRoot -or -not $owned -or $process.CommandLine -notlike "*`"$pythonExe`"*" -or $process.CommandLine -notlike '*eir.app:create_app*' -or $process.CommandLine -notlike "*--host 127.0.0.1 --port $Port*") {
        throw "Port $Port does not match this checkout's recorded demo process. Nothing was stopped."
    }
    Stop-Process -Id $process.ProcessId
    if ($process.ProcessId -ne $receipt.pid -and (Get-Process -Id $receipt.pid -ErrorAction SilentlyContinue)) { Stop-Process -Id $receipt.pid -ErrorAction SilentlyContinue }
    for ($attempt=0; $attempt -lt 20; $attempt++) {
        if (-not (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)) { break }
        Start-Sleep -Milliseconds 200
    }
}
if ($Stop) { Write-Host "Role 1 demo on $Port stopped; all take databases retained."; return }
if (-not (Test-Path -LiteralPath $pythonExe)) { throw 'Install the existing project dependencies first. See docs/LOCAL_RUN.md.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'eir\web\generated\appearance.js'))) { throw 'Build the existing EIR appearance assets first with scripts/start-local.ps1.' }
if ($Provider -eq 'goat') {
    $tags = Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
    if ('gemma4:26b' -notin @($tags.models.name)) { throw 'Recorded local model gemma4:26b is not installed.' }
    $ready = Invoke-RestMethod 'http://127.0.0.1:62606/api/ready' -TimeoutSec 10
    if (-not $ready.ready) { throw 'Start the existing local GOAT/Ollama services first.' }
} else {
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot '.env.local'))) { throw 'Create the private .env.local config first. See docs/OPENAI_DEMO.md.' }
}
$snapshotFolder = if ($Provider -eq 'openai') { 'snapshots-openai' } else { 'snapshots' }
$snapshot = Join-Path $demoRoot "$snapshotFolder\$Scene.sqlite3"
if (-not $Resume -and $Scene -ne 'empty' -and -not (Test-Path -LiteralPath $snapshot)) { throw "Scene $Scene has not been prepared. Run the rehearsal against an empty isolated server first." }
$takeId = [guid]::NewGuid().ToString('N').Substring(0,8)
$takeRoot = if ($Resume) { $resumeReceipt.take } else { Join-Path $demoRoot "takes\$(Get-Date -Format 'yyyyMMdd-HHmmss')-$takeId" }
New-Item -ItemType Directory -Path $takeRoot -Force | Out-Null
$takeDb = Join-Path $takeRoot 'demo.sqlite3'
if (-not $Resume -and $Scene -ne 'empty') { Copy-Item -LiteralPath $snapshot -Destination $takeDb }
$demoEnvironmentKeys = @('EIR_DB_PATH','EIR_GOAT_BASE_URL','EIR_HTTP_PORT','EIR_MODEL_PROVIDER','EIR_CONFIG_FILE','EIR_OPENAI_MODEL','EIR_OPENAI_MODELS','OPENAI_API_KEY')
$previous = @{}
foreach ($key in $demoEnvironmentKeys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key,'Process') }
try {
    $env:EIR_DB_PATH = $takeDb
    $env:EIR_GOAT_BASE_URL = 'http://127.0.0.1:62606'
    $env:EIR_HTTP_PORT = [string]$Port
    $env:EIR_MODEL_PROVIDER = $Provider
    $env:EIR_CONFIG_FILE = if ($Provider -eq 'openai') { Join-Path $projectRoot '.env.local' } else { $null }
    # The demo uses the explicit private config, never an unrelated inherited key.
    $env:OPENAI_API_KEY = $null
    $env:EIR_OPENAI_MODEL = $Model
    $env:EIR_OPENAI_MODELS = $null
    $demoProcess = Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn eir.app:create_app --factory --host 127.0.0.1 --port $Port" -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $takeRoot 'stdout.log') -RedirectStandardError (Join-Path $takeRoot 'stderr.log') -PassThru
} finally {
    foreach ($key in $demoEnvironmentKeys) { [Environment]::SetEnvironmentVariable($key,$previous[$key],'Process') }
}
@{ pid=$demoProcess.Id; port=$Port; scene=$Scene; provider=$Provider; database=$takeDb; take=$takeRoot; project=$projectRoot } | ConvertTo-Json | Set-Content -LiteralPath $receiptPath -Encoding utf8
$healthy = $false
for ($attempt=0; $attempt -lt 40; $attempt++) {
    if ($demoProcess.HasExited) { throw "Demo process exited. Read $takeRoot\stderr.log" }
    try {
        $health = Invoke-RestMethod "http://127.0.0.1:$Port/api/health" -TimeoutSec 2
        if ($health.status -eq 'ok') { $healthy=$true; break }
    } catch { Start-Sleep -Milliseconds 250 }
}
if (-not $healthy) { throw "Demo did not become healthy. Read $takeRoot\stderr.log" }
Write-Host "Role 1 demo: http://127.0.0.1:$Port"
$modelCheck = Invoke-RestMethod "http://127.0.0.1:$Port/api/models" -TimeoutSec 30
Write-Host "Provider: $Provider. Model: $($modelCheck.models -join ', ')"
if ($Resume) { Write-Host "Scene: $Scene. Resumed the existing take and retained all saved records." }
else { Write-Host "Scene: $Scene. Started a NEW copy; previous takes and shared ventures remain intact." }
Write-Host "Take: $takeRoot"
Write-Host 'If the browser remembers a different venture, select Campus Dinner Discovery (fictional).'
