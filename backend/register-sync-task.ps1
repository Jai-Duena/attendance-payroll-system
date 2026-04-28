$phpExe  = "C:\xampp\php\php.exe"
$script  = "C:\xampp\htdocs\backend\api\attendance\zkteco-sync.php"
$taskCmd = "`"$phpExe`" `"$script`""

# Delete existing task if present
schtasks /Delete /TN "FCH-ZKTeco-Sync" /F 2>$null

# Create task: runs every 1 minute as SYSTEM — survives reboots and logoffs
# /RU SYSTEM        = run as Local System account (no login required, always active)
# /SC MINUTE /MO 1  = repeat every 1 minute
# /RL HIGHEST       = run with highest privileges
# /F                = force overwrite
# Note: no /DU — omitting it means the repetition never expires
schtasks /Create `
    /TN "FCH-ZKTeco-Sync" `
    /TR $taskCmd `
    /SC MINUTE /MO 1 `
    /RU SYSTEM `
    /RL HIGHEST `
    /F

if ($LASTEXITCODE -eq 0) {
    Write-Host "Task registered successfully." -ForegroundColor Green
    schtasks /Run /TN "FCH-ZKTeco-Sync"
    Write-Host "Task started immediately." -ForegroundColor Green
    Write-Host ""
    schtasks /Query /TN "FCH-ZKTeco-Sync" /FO LIST
} else {
    Write-Host "Registration failed. Try running as Administrator." -ForegroundColor Red
}

Read-Host "Press Enter to close"
