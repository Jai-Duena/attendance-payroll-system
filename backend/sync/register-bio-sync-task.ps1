# register-bio-sync-task.ps1
# ──────────────────────────────────────────────────────────────────────────────
# Registers a Windows Task Scheduler task that runs bio_sync.py every N minutes.
# Run this script as Administrator once to set up the scheduled task.
# Re-run whenever you change the sync interval in Settings.
#
# The task:
#   Name    : FCH-Bio-Sync
#   Trigger : Every 2 minutes (or whatever INTERVAL_MINUTES is set to below)
#   Action  : python bio_sync.py
#   Account : SYSTEM  (runs even when no user is logged in)
# ──────────────────────────────────────────────────────────────────────────────

# ── Config (edit if needed) ───────────────────────────────────────────────────
$pythonExe   = "C:\Python314\python.exe"                         # full path avoids PATH lookup issues when running as SYSTEM
$scriptPath  = "C:\xampp\htdocs\backend\sync\bio_sync.py"
$taskName    = "FCH-Bio-Sync"
$intervalMin = 2                                                 # sync every N minutes

# ── Build the command ─────────────────────────────────────────────────────────
$taskCmd = "`"$pythonExe`" `"$scriptPath`""

Write-Host ""
Write-Host "=== FCH Biometric Sync Task Registration ===" -ForegroundColor Cyan
Write-Host "Script  : $scriptPath"
Write-Host "Command : $taskCmd"
Write-Host "Interval: every $intervalMin minute(s)"
Write-Host ""

# ── Remove old task if present ────────────────────────────────────────────────
schtasks /Delete /TN $taskName /F 2>$null | Out-Null

# ── Create new task ───────────────────────────────────────────────────────────
# /RU SYSTEM   = runs as Local System (no login required)
# /RL HIGHEST  = highest privileges
# /SC MINUTE /MO N = repeat every N minutes indefinitely
$result = schtasks /Create `
    /TN  $taskName `
    /TR  $taskCmd `
    /SC  MINUTE `
    /MO  $intervalMin `
    /RU  SYSTEM `
    /RL  HIGHEST `
    /F `
    2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Task '$taskName' registered successfully." -ForegroundColor Green
    Write-Host ""

    # Run immediately to verify
    Write-Host "Starting task immediately for an initial sync..." -ForegroundColor Yellow
    schtasks /Run /TN $taskName | Out-Null
    Start-Sleep -Seconds 2

    Write-Host ""
    schtasks /Query /TN $taskName /FO LIST
} else {
    Write-Host "Registration FAILED. Make sure you are running as Administrator." -ForegroundColor Red
    Write-Host $result
}

Write-Host ""
Read-Host "Press Enter to close"
