# Start Warehouse Store for local development (Windows).
# Opens the API in a new window, then starts the Next.js UI in this window.
$ErrorActionPreference = "Stop"
$StoreRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $StoreRoot

function Stop-PortListener {
  param([int]$Port)
  $conns = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
  foreach ($c in $conns) {
    $procId = $c.OwningProcess
    if (-not $procId) { continue }
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    Write-Host "==> Stopping port $Port (PID $procId, $($proc.ProcessName))"
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
}

if (-not (Test-Path "$StoreRoot\node_modules\next\dist\bin\next")) {
  Write-Host "==> Installing dependencies..."
  if (Test-Path "$StoreRoot\node_modules") {
    Remove-Item -Recurse -Force "$StoreRoot\node_modules"
  }
  pnpm install
}

Stop-PortListener 5001
Stop-PortListener 5004
Start-Sleep -Seconds 1

Write-Host "==> Starting Store API on http://127.0.0.1:5004 (new window)"
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "`$host.UI.RawUI.WindowTitle = 'Warehouse Store API :5004'; Set-Location '$StoreRoot\backend'; Write-Host 'Warehouse Store API - port 5004'; Write-Host 'Folder: $StoreRoot\backend'; python run.py"
)

Write-Host "==> Starting Store UI on http://127.0.0.1:5001"
Write-Host "    LAN: http://$((Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1).IPAddress):5001"
Write-Host "    Warehouse board should be running at http://127.0.0.1:8000"
Write-Host "    Tip: use .\dev.ps1 (not pnpm dev alone) - starts UI + API together."
Write-Host ""
pnpm dev
