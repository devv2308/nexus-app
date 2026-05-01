#!/usr/bin/env bash
# ── Nexus Backend Starter (macOS / Linux) ─────────────────────────────────────
set -e
cd "$(dirname "$0")/backend"

# Create & activate venv if needed
if [ ! -d "venv" ]; then
  echo "→ Creating Python virtual environment…"
  python3 -m venv venv
fi
source venv/bin/activate

echo "→ Installing/updating dependencies…"
pip install -r requirements.txt -q

# Copy .env if it doesn't exist
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "⚠  Created backend/.env from .env.example — edit it before running in production!"
fi

# Seed communities if MongoDB is fresh
echo "→ Seeding communities (safe to re-run)…"
python scripts/seed.py 2>/dev/null || echo "  Seed skipped (MongoDB may not be running yet)"

echo ""
echo "✅  Starting Nexus backend on http://0.0.0.0:8000"
echo "   Docs: http://localhost:8000/docs"
echo "   Press Ctrl+C to stop"
echo ""
uvicorn main:app --reload --host 0.0.0.0 --port 8000
