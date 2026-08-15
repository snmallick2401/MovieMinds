# PowerShell script to start MovieMinds AI Recommendation Engine and Scraper
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting MovieMinds AI Recommendation Engine" -ForegroundColor Cyan
Write-Host "Port: 8001" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Start the Python Scraper Scheduler in a new background window
Start-Process -FilePath "python" -ArgumentList "scraper/scheduler.py" -WindowStyle Normal -PassThru

# Start the FastAPI server in the current window
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
