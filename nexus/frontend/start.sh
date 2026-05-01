#!/bin/bash
# ── Nexus Frontend — one-click start script (macOS/Linux) ─────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ".env created from .env.example"
fi
npm install
echo ""
echo "Starting Nexus frontend on http://localhost:3000"
echo "Also accessible on your LAN — check the 'Network' URL printed below."
echo ""
npm run dev
