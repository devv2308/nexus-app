@echo off
REM ── Nexus Backend — one-click start script (Windows) ─────────────────────

IF NOT EXIST venv (
  echo Creating virtual environment...
  python -m venv venv
)

call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -q -r requirements.txt

IF NOT EXIST .env (
  copy .env.example .env
  echo .env created — edit it if needed.
)

python scripts/seed.py

echo.
echo Starting Nexus API on http://0.0.0.0:8000
echo Docs: http://localhost:8000/docs
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
