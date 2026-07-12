#!/usr/bin/env bash
# Expone Vite (HTTP local) a Internet vía Cloudflare Quick Tunnel (HTTPS público).
# Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/
#
# Uso:
#   1. En otra terminal: yarn dev   (o yarn tunnel:cf arranca Vite si no hay nada en :5173)
#   2. yarn tunnel:cf [puerto]
#
# Requiere: cloudflared en PATH (~/.local/bin o /usr/bin)

set -euo pipefail

PORT="${1:-5173}"
TARGET="http://127.0.0.1:${PORT}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "❌ cloudflared no está en PATH"
  echo "   Instálalo o añade ~/.local/bin al PATH"
  exit 1
fi

echo "🌐 Cloudflare Quick Tunnel → ${TARGET}"
echo "   Versión: $(cloudflared --version 2>&1 | head -1)"
echo ""

# Si Vite no responde, avisar (no arrancar Vite aquí para no mezclar logs)
CODE="$(curl -s -o /dev/null -w '%{http_code}' "${TARGET}" 2>/dev/null || echo 000)"
if [[ "${CODE}" == "000" ]]; then
  echo "⚠️  Nada responde en ${TARGET}"
  echo "   Arranca el dev server en otra terminal:"
  echo "     cd /home/edgar/MST-Wallet && yarn dev"
  echo "   o: npm run dev"
  echo ""
  echo "   Continuaré igual; el túnel quedará listo cuando Vite arranque."
  echo ""
else
  echo "✅ Origen local responde (HTTP ${CODE})"
  echo ""
fi

echo "⏳ Creando túnel… la URL pública aparece abajo (https://….trycloudflare.com)"
echo "   Ctrl+C para cerrar el túnel."
echo ""

exec cloudflared tunnel --url "${TARGET}"
