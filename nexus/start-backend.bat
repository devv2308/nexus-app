@echo off
REM ── Nexus Backend Starter (Windows) ─────────────────────────────────────────
cd /d "%~dp0backend"

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Installing/updating dependencies...
pip install -r requirements.txt -q

if not exist .env (
    copy .env.example .env
    echo Created backend\.env — edit it before production use!
)

echo Seeding communities...
python scripts\seed.py 2>nul || echo Seed skipped

echo.
echo Starting Nexus backend on http://0.0.0.0:8000
echo Docs: http://localhost:8000/docs
echo Press Ctrl+C to stop
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
