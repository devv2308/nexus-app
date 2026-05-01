#!/bin/bash
# ── Nexus Backend — one-click start script (macOS/Linux) ──────────────────────
set -e

# 1. Create virtualenv if missing
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

# 2. Activate
source venv/bin/activate

# 3. Install / upgrade dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# 4. Create .env if missing
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ".env created from .env.example — edit it before running in production!"
fi

# 5. Run seed (idempotent — safe to run every time)
python scripts/seed.py

# 6. Start server (accessible on LAN for mobile)
echo ""
echo "Starting Nexus API on http://0.0.0.0:8000"
echo "Docs: http://localhost:8000/docs"
echo ""
uvicorn main:app --reload --host 0.0.0.0 --port 8000
