# Show what is running for Warehouse Store (and related ports).
$StoreRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Show-PortListener {
  param([int]$Port, [string]$Label, [string]$ExpectedFolder)
  Write-Host ""
  Write-Host "=== $Label (port $Port) ==="
  $conns = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
  if (-not $conns.Count) {
    Write-Host "  (not running)"
    return
  }
  foreach ($procId in ($conns | Select-Object -ExpandProperty OwningProcess -Unique)) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    $win = Get-CimInstance Win32_Process -Filter "ProcessId=$procId" -ErrorAction SilentlyContinue
    $cmd = $win.CommandLine
    $ok = $cmd -and $cmd -like "*$ExpectedFolder*"
    $tag = if ($ok) { "CORRECT APP" } else { "CHECK - may be wrong folder" }
    Write-Host "  PID $procId | $($proc.ProcessName) | $tag"
    Write-Host "  Command: $cmd"
  }
}

Write-Host "Warehouse Store project folder:"
Write-Host "  $StoreRoot"
Write-Host ""
Write-Host "Correct URLs when running from THIS folder:"
Write-Host "  Store UI:  http://127.0.0.1:5001"
Write-Host "  Store API: http://127.0.0.1:5004"
Write-Host "  Needs WarehouseDB on http://127.0.0.1:8000 for products"

Show-PortListener -Port 5001 -Label "Store UI (Next.js)" -ExpectedFolder "Warehouse_store"
Show-PortListener -Port 5004 -Label "Store API (Flask)" -ExpectedFolder "Warehouse_store"

Write-Host ""
Write-Host "=== WarehouseDB (port 8000) - inventory backend ==="
$w = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($w) {
  $id = $w[0].OwningProcess
  $win = Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue
  Write-Host "  PID $id | $($win.CommandLine)"
  if ($win.CommandLine -like "*WarehouseDB*") { Write-Host "  (likely WarehouseDB)" } else { Write-Host "  (run from WarehouseDB folder - python run.py)" }
} else {
  Write-Host "  (not running - store catalog will be empty)"
}

Write-Host ""
Write-Host "=== Quick API check (proves which app this is) ==="
try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:5004/api/health" -TimeoutSec 5
  Write-Host "  Store API health:"
  Write-Host "    app       = $($health.app)"
  Write-Host "    database  = $($health.database)"
  Write-Host "    warehouse = $($health.warehouse)"
  if ($health.database -like "*Warehouse_store*") {
    Write-Host "  => This IS your Warehouse Store API (correct folder)."
  }
  $cat = Invoke-RestMethod -Uri "http://127.0.0.1:5004/api/catalog" -TimeoutSec 5
  $n = @($cat.products).Count
  Write-Host "    catalog   = $n products (warehouse_connected=$($cat.warehouse_connected))"
} catch {
  Write-Host "  Store API not reachable on 5004 - run .\dev.ps1"
}

Write-Host ""
Write-Host "Stop Store only:  .\stop.ps1"
Write-Host "Start Store:      .\dev.ps1"
