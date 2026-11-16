# Exercise startup boundaries without starting services, calling AI, or using saved data.
$ErrorActionPreference = 'Stop'
$fixtureRoot = Join-Path ([IO.Path]::GetTempPath()) ('eir-launcher-' + [guid]::NewGuid().ToString('N'))
$hadProofState = Test-Path variable:global:EirLauncherProof
$previousProofState = $global:EirLauncherProof
$global:EirLauncherProof = @{ fixtureRoot = $fixtureRoot; scenario = ''; starts = 0 }
$keys = @('EIR_MODEL_PROVIDER','EIR_HTTP_PORT','EIR_CONFIG_FILE','EIR_DB_PATH','EIR_GOAT_BASE_URL','GOAT_DEPLOY_MODE')
$original = @{}
foreach ($key in $keys) { $original[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }

function Assert-Launcher($condition, [string]$message) {
    if (-not $condition) { throw $message }
}
function node { $global:LASTEXITCODE = 0 }
function Get-NetTCPConnection {
    if ($global:EirLauncherProof.scenario -eq 'unrelated-port') { return @{ OwningProcess = 123456 } }
}
function Get-CimInstance { return @{ CommandLine = 'unrelated application' } }
function Start-Process {
    param($FilePath, $ArgumentList, $WorkingDirectory, $WindowStyle, $RedirectStandardOutput, $RedirectStandardError, [switch]$PassThru)
    Assert-Launcher ($FilePath -eq (Join-Path $global:EirLauncherProof.fixtureRoot 'apps\goat\.venv\Scripts\python.exe')) 'Unexpected executable.'
    Assert-Launcher ($WindowStyle -eq 'Hidden') 'Background services must stay hidden.'
    Assert-Launcher ($ArgumentList -like '*--host 127.0.0.1*') 'Services must bind only to loopback.'
    Assert-Launcher ($env:EIR_MODEL_PROVIDER -eq 'goat') 'Inherited cloud provider reached a child.'
    Assert-Launcher ($env:EIR_HTTP_PORT -eq '62607') 'Inherited proof port reached a child.'
    Assert-Launcher (-not $env:EIR_CONFIG_FILE) 'Inherited private config reached a child.'
    Assert-Launcher ($env:EIR_DB_PATH -eq (Join-Path $global:EirLauncherProof.fixtureRoot 'var\eir\ventures.sqlite3')) 'Inherited proof database reached a child.'
    Assert-Launcher ($env:EIR_GOAT_BASE_URL -eq 'http://127.0.0.1:62606') 'Inherited remote backend reached a child.'
    $global:EirLauncherProof.starts++
    return @{ Id = 100000 + $global:EirLauncherProof.starts }
}
function Invoke-RestMethod {
    param($Uri, $TimeoutSec, $Headers)
    switch -Wildcard ($Uri) {
        '*/api/tags' {
            if ($global:EirLauncherProof.scenario -eq 'empty-models') { return @{ models = @() } }
            return @{ models = @(@{ name = 'gemma4:26b' }) }
        }
        '*:62607/api/health' {
            Assert-Launcher ($Headers.Origin -eq 'http://127.0.0.1:62607') 'Browser origin was not checked.'
            return @{ status = 'ok' }
        }
        '*/api/health' { return @{ status = 'ok' } }
        '*/api/ready' { return @{ ready = ($global:EirLauncherProof.scenario -ne 'readiness-failure') } }
        '*/api/models' {
            Assert-Launcher ($Headers.Origin -eq 'http://127.0.0.1:62607') 'Model discovery did not check browser origin.'
            if ($global:EirLauncherProof.scenario -eq 'provider-mismatch') { return @{ models = @('cloud-model') } }
            return @{ models = @('gemma4:26b') }
        }
        default { throw 'Unexpected network request.' }
    }
}

try {
    foreach ($relative in @('scripts', 'apps\goat\.venv\Scripts', 'apps\goat\frontend\dist', 'eir\prompts')) {
        New-Item -ItemType Directory -Path (Join-Path $fixtureRoot $relative) -Force | Out-Null
    }
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'start-local.ps1') -Destination (Join-Path $fixtureRoot 'scripts\start-local.ps1')
    foreach ($relative in @('apps\goat\.venv\Scripts\python.exe', 'apps\goat\frontend\dist\index.html', 'eir\prompts\goat-english.txt')) {
        Set-Content -LiteralPath (Join-Path $fixtureRoot $relative) -Value 'launcher test fixture'
    }
    $expectedErrors = @{
        'empty-models' = 'Ollama has no installed models'
        'unrelated-port' = 'in use by another process'
        'readiness-failure' = 'GOAT dependency readiness failed'
        'provider-mismatch' = 'not serving the installed local models'
    }
    foreach ($case in @('success','empty-models','unrelated-port','readiness-failure','provider-mismatch')) {
        $global:EirLauncherProof.scenario = $case
        $global:EirLauncherProof.starts = 0
        $incoming = @{
            EIR_MODEL_PROVIDER = 'openai'; EIR_HTTP_PORT = '62618'
            EIR_CONFIG_FILE = 'private-rehearsal-config'; EIR_DB_PATH = 'isolated-proof.sqlite3'
            EIR_GOAT_BASE_URL = 'http://127.0.0.1:12345'; GOAT_DEPLOY_MODE = 'inherited-mode'
        }
        foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $incoming[$key], 'Process') }
        $failure = $null
        try { $null = & (Join-Path $fixtureRoot 'scripts\start-local.ps1') } catch { $failure = $_.Exception.Message }
        if ($case -eq 'success') {
            Assert-Launcher (-not $failure) "Expected startup success: $failure"
            Assert-Launcher ($global:EirLauncherProof.starts -eq 2) 'Both services were not started.'
        } else {
            Assert-Launcher ($failure -and $failure.Contains($expectedErrors[$case])) "Wrong startup failure for ${case}: $failure"
            if ($case -in @('empty-models','unrelated-port')) { Assert-Launcher ($global:EirLauncherProof.starts -eq 0) 'A failed preflight started a service.' }
        }
        foreach ($key in $keys) {
            Assert-Launcher ([Environment]::GetEnvironmentVariable($key, 'Process') -eq $incoming[$key]) "Caller environment was not restored: $key"
        }
        Write-Host "PASS: $case; caller settings retained."
    }
} finally {
    if ($hadProofState) { $global:EirLauncherProof = $previousProofState } else { Remove-Variable -Name EirLauncherProof -Scope Global -ErrorAction SilentlyContinue }
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $original[$key], 'Process') }
    $resolvedFixture = [IO.Path]::GetFullPath($fixtureRoot)
    $resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if ($resolvedFixture.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path -Leaf $resolvedFixture) -like 'eir-launcher-*') {
        Remove-Item -LiteralPath $resolvedFixture -Recurse -Force
    }
}
