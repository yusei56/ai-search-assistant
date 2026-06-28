#!/usr/bin/env bash
# One-command production deploy. Run on a Docker host whose DNS points here.
set -euo pipefail
cd "$(dirname "$0")"

# --- preflight ---
[ -f .env ] || { echo "✗ Create deploy/.env from .env.example (set PUBLIC_DOMAIN, PUBLIC_URL)"; exit 1; }
[ -f ../backend/.env ] || { echo "✗ Create backend/.env from backend/.env.example (set LLM_API_KEY, CORS_ORIGINS)"; exit 1; }

# --- build the embeddable widget bundle (served by Caddy) ---
echo "▶ Building widget bundle…"
( cd ../widget && npm install --no-audit --no-fund && npm run build )

# --- bring up the stack (Caddy provisions TLS automatically) ---
echo "▶ Building & starting containers…"
docker compose --env-file .env -f docker-compose.prod.yml up -d --build

DOMAIN="$(grep -E '^PUBLIC_DOMAIN=' .env | cut -d= -f2)"
echo
echo "✓ Deployed. In ~30s (first TLS issuance):"
echo "    Demo    : https://${DOMAIN}"
echo "    API     : https://${DOMAIN}/api/health"
echo "    Widget  : https://${DOMAIN}/ai-search-widget.js"
echo "    Bridge  : https://${DOMAIN}/ai-search-bridge.js"
echo "    Inline  : https://${DOMAIN}/ai-search-inline.js"
echo
echo "First boot builds the search index (crawls the WP site + downloads the"
echo "embedding model once). Follow it with:  docker compose -f docker-compose.prod.yml logs -f backend"
