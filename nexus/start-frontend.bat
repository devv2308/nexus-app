@echo off
REM ── Nexus Frontend Starter (Windows) ────────────────────────────────────────
cd /d "%~dp0frontend"

if not exist node_modules (
    echo Installing npm packages...
    npm install
)

if not exist .env (
    copy .env.example .env
    echo Created frontend\.env
)

echo.
echo Starting Nexus frontend...
echo Local:   http://localhost:3000
echo Network: see output below for LAN IP (open on mobile)
echo.
npm run dev
