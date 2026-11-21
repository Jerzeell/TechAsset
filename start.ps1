$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$apiDirectory = Join-Path $root 'src/backend/Api'
$frontendDirectory = Join-Path $root 'src/frontend'
$logsDirectory = Join-Path $root '.run'
New-Item -ItemType Directory -Path $logsDirectory -Force | Out-Null
foreach ($port in @(3000,5001)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        throw "El puerto $port está ocupado. Cierre la instancia anterior de TechAsset antes de iniciar."
    }
}
dotnet build (Join-Path $root 'src/TechAsset.sln')
if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar la API.' }
Push-Location $frontendDirectory
try {
    npm.cmd ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias del frontend.' }
} finally { Pop-Location }
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = 'http://127.0.0.1:5001'
$api = Start-Process -FilePath 'dotnet' -ArgumentList ('"' + (Join-Path $apiDirectory 'bin/Debug/net10.0/TechAsset.Api.dll') + '"') -WorkingDirectory $apiDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logsDirectory 'api.log') -RedirectStandardError (Join-Path $logsDirectory 'api-error.log') -PassThru
$api.Id | Set-Content (Join-Path $logsDirectory 'api.pid')
$ready = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if ($api.HasExited) { throw "La API no inició. Revise $logsDirectory/api-error.log" }
    try { $response = Invoke-WebRequest 'http://127.0.0.1:5001/api/health' -TimeoutSec 2; if ($response.StatusCode -eq 200) { $ready = $true; break } } catch { Start-Sleep -Milliseconds 500 }
}
if (-not $ready) { throw "La API no responde. Revise $logsDirectory/api.log" }
$frontend = Start-Process -FilePath 'node' -ArgumentList ('"' + (Join-Path $frontendDirectory 'node_modules/vite/bin/vite.js') + '"') -WorkingDirectory $frontendDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logsDirectory 'frontend.log') -RedirectStandardError (Join-Path $logsDirectory 'frontend-error.log') -PassThru
$frontend.Id | Set-Content (Join-Path $logsDirectory 'frontend.pid')
Write-Host 'TechAsset: http://127.0.0.1:3000'
Write-Host 'Swagger: http://127.0.0.1:5001/swagger'
Write-Host 'Las cuentas existentes conservan su acceso y deben cambiar su contraseña al primer ingreso tras la actualización.'
Write-Host 'En una base nueva, configure Seed__AdminPassword, Seed__TechPassword y Seed__ColabPassword antes de iniciar.'
Start-Process 'http://127.0.0.1:3000'
