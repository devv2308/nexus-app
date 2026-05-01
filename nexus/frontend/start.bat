@echo off
REM ── Nexus Frontend — one-click start (Windows) ────────────────────────────
IF NOT EXIST .env (
  copy .env.example .env
  echo .env created.
)
npm install
echo.
echo Starting Nexus frontend on http://localhost:3000
npm run dev
