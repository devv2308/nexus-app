#!/usr/bin/env bash
# ── Nexus Frontend Starter (macOS / Linux) ────────────────────────────────────
set -e
cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "→ Installing npm packages…"
  npm install
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "⚠  Created frontend/.env from .env.example"
fi

echo ""
echo "✅  Starting Nexus frontend"
echo "   Local:   http://localhost:3000"
echo "   Network: check output below for your LAN IP (open on mobile)"
echo ""
npm run dev
