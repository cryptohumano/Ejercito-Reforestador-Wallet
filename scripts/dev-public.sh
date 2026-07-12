#!/usr/bin/env bash
# Publica MST-Wallet en un hostname fijo vía el túnel Cloudflare ya instalado en el VPS.
#
# Hostname por defecto: mst-wallet.peranto.app → http://127.0.0.1:5173
#
# El conector systemd (cloudflared.service) ya corre 24/7 con túnel
# f798e8e2-48f9-4425-b99f-261fc5c1fe5b. Solo hay que añadir el Public Hostname
# una vez (API o Zero Trust). Luego `yarn dev:public` / `npm run dev:public`
# arranca Vite y comprueba el hostname.
#
# Setup (una vez):
#   export CF_API_TOKEN='…'   # Token con permisos Account → Cloudflare Tunnel:Edit + Zone:DNS:Edit
#   bash scripts/setup-fixed-hostname.sh
#
# Uso diario:
#   npm run dev:public

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOSTNAME="${MST_WALLET_HOSTNAME:-mst-wallet.peranto.app}"
PORT="${MST_WALLET_PORT:-5173}"
ORIGIN="http://127.0.0.1:${PORT}"

# Account / tunnel del conector existente en este VPS (dev.peranto.app)
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-2bb43f5295134f7be98147fd2db911fa}"
CF_TUNNEL_ID="${CF_TUNNEL_ID:-f798e8e2-48f9-4425-b99f-261fc5c1fe5b}"

echo "══════════════════════════════════════════════"
echo " MST-Wallet · hostname fijo"
echo " https://${HOSTNAME}  →  ${ORIGIN}"
echo "══════════════════════════════════════════════"
echo ""

if [[ -z "${CF_API_TOKEN:-}" ]]; then
  echo "ℹ️  CF_API_TOKEN no está definido."
  echo "   Si el Public Hostname ya existe en Zero Trust, basta con Vite."
  echo "   Si aún no: export CF_API_TOKEN=… && bash scripts/setup-fixed-hostname.sh"
  echo ""
fi

# Arrancar Vite si no responde
CODE="$(curl -s -o /dev/null -w '%{http_code}' "${ORIGIN}" 2>/dev/null || echo 000)"
if [[ "${CODE}" == "000" ]]; then
  echo "▶️  Arrancando Vite en :${PORT}…"
  if command -v yarn >/dev/null 2>&1; then
    yarn dev &
  else
    npm run dev &
  fi
  VITE_PID=$!
  echo "   PID Vite: ${VITE_PID}"

  for i in $(seq 1 60); do
    CODE="$(curl -s -o /dev/null -w '%{http_code}' "${ORIGIN}" 2>/dev/null || echo 000)"
    if [[ "${CODE}" != "000" ]]; then
      echo "✅ Vite listo (HTTP ${CODE})"
      break
    fi
    sleep 0.5
  done
  if [[ "${CODE}" == "000" ]]; then
    echo "❌ Vite no respondió a tiempo en ${ORIGIN}"
    exit 1
  fi
else
  echo "✅ Vite ya estaba activo (HTTP ${CODE})"
fi

echo ""
echo "🌍 Probando https://${HOSTNAME} …"
PUBLIC_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://${HOSTNAME}/" 2>/dev/null || echo 000)"

if [[ "${PUBLIC_CODE}" =~ ^[23] ]]; then
  echo "✅ Público OK → https://${HOSTNAME}/  (HTTP ${PUBLIC_CODE})"
else
  echo "⚠️  https://${HOSTNAME}/ respondió HTTP ${PUBLIC_CODE}"
  echo ""
  echo "   El túnel del VPS sigue activo, pero falta el Public Hostname."
  echo "   Opción A — API (recomendado):"
  echo "     export CF_API_TOKEN='tu_token'"
  echo "     bash scripts/setup-fixed-hostname.sh"
  echo ""
  echo "   Opción B — Zero Trust (dashboard):"
  echo "     1. https://one.dash.cloudflare.com → Networks → Tunnels"
  echo "     2. Túnel id ${CF_TUNNEL_ID}"
  echo "     3. Add public hostname:"
  echo "        Subdomain: mst-wallet"
  echo "        Domain:    peranto.app"
  echo "        Service:   HTTP → 127.0.0.1:${PORT}"
  echo ""
  echo "   Mientras tanto puedes usar el quick tunnel: npm run tunnel:cf"
fi

echo ""
echo "Dev local:  ${ORIGIN}"
echo "Dev fijo:   https://${HOSTNAME}"
echo "Ctrl+C no detiene Vite si ya corría en background; usa el PID o pkill -f vite."

# Mantener el script vivo si nosotros arrancamos Vite
if [[ -n "${VITE_PID:-}" ]]; then
  wait "${VITE_PID}"
fi
