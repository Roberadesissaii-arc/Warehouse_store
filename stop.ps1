# Stop Warehouse Store UI (5001) and API (5004). Does not stop WarehouseDB (8000).
$ErrorActionPreference = "SilentlyContinue"

function Stop-PortListener {
  param([int]$Port)
  $conns = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
  foreach ($c in $conns) {
    $procId = $c.OwningProcess
    if (-not $procId) { continue }
    $win = Get-CimInstance Win32_Process -Filter "ProcessId=$procId" -ErrorAction SilentlyContinue
    Write-Host "Stopping port $Port (PID $procId): $($win.CommandLine)"
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    taskkill /F /PID $procId 2>$null | Out-Null
  }
}

# Also stop stray python windows started from this project's backend folder
Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -eq '"C:\Users\rober\Python314\python.exe" run.py' } |
  ForEach-Object {
    # Only kill if health on 5004 points at Warehouse_store (best-effort)
    try {
      $h = Invoke-RestMethod -Uri "http://127.0.0.1:5004/api/health" -TimeoutSec 1
      if ($h.database -like "*Warehouse_store*") {
        Write-Host "Stopping Store API python PID $($_.ProcessId)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      }
    } catch { }
  }

Write-Host "==> Stopping Warehouse Store..."
Stop-PortListener 5001
Stop-PortListener 5004
Start-Sleep -Seconds 1

$left = @(
  (Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue),
  (Get-NetTCPConnection -LocalPort 5004 -State Listen -ErrorAction SilentlyContinue)
) | Where-Object { $_ }

if ($left) {
  Write-Host "!! Some listeners still up - close any PowerShell windows titled 'Warehouse Store API'"
} else {
  Write-Host "==> Store stopped. Start again with: .\dev.ps1"
}
