$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Integration Testing: Startup Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start the Scraper Daemon as a background job
Write-Host "Starting Scraper Daemon..."
$scraperJob = Start-Job -ScriptBlock {
    Set-Location -Path "C:\Dev\Projects\NextJS\MovieMinds\ai-engine"
    $env:TESTING = "1"
    python scraper/scheduler.py
}

# 2. Start FastAPI server as a background job
Write-Host "Starting FastAPI AI Engine..."
$apiJob = Start-Job -ScriptBlock {
    Set-Location -Path "C:\Dev\Projects\NextJS\MovieMinds\ai-engine"
    $env:TESTING = "1"
    python -m uvicorn main:app --host 127.0.0.1 --port 8002
}

# Wait for startup
Start-Sleep -Seconds 5

# 3. Verify Scraper is running
if ($scraperJob.State -eq "Running") {
    Write-Host "✅ Scraper Daemon is running in the background." -ForegroundColor Green
} else {
    Write-Host "❌ Scraper Daemon failed to start." -ForegroundColor Red
    Receive-Job -Job $scraperJob
    exit 1
}

# 4. Verify FastAPI Health Endpoint
Write-Host "Polling FastAPI Health Endpoint..."
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8002/health" -Method Get
    if ($response.status -eq "ok") {
        Write-Host "✅ FastAPI is healthy." -ForegroundColor Green
    } else {
        Write-Host "❌ FastAPI health check returned invalid payload." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FastAPI health check failed: $_" -ForegroundColor Red
    Receive-Job -Job $apiJob
    exit 1
}

# 5. Capture Scraper logs to verify heartbeat
Write-Host "Checking Scraper Daemon Output..."
Start-Sleep -Seconds 3 # Let it log initial startup sequences
$scraperLogs = Receive-Job -Job $scraperJob -Keep
if ($scraperLogs -match "All jobs scheduled successfully") {
    Write-Host "✅ Scraper Daemon reported successful job scheduling." -ForegroundColor Green
} else {
    Write-Host "⚠️ Scraper Daemon did not output expected startup log. Output was:" -ForegroundColor Yellow
    $scraperLogs | Out-String | Write-Host
}

# 6. Graceful Termination
Write-Host "Testing Graceful Termination..."
Stop-Job -Job $scraperJob
Stop-Job -Job $apiJob
Remove-Job -Job $scraperJob -Force
Remove-Job -Job $apiJob -Force

Write-Host "✅ All processes terminated successfully." -ForegroundColor Green
Write-Host "Startup integration test complete." -ForegroundColor Cyan
