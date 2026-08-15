@echo off
echo =========================================
echo Starting MovieMinds AI Recommendation Engine
echo Port: 8001
echo =========================================
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
