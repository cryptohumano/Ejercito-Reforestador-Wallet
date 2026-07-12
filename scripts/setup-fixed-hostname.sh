#!/usr/bin/env bash
# Añade (o actualiza) el Public Hostname fijo del túnel Cloudflare existente:
#   mst-wallet.peranto.app → http://127.0.0.1:5173
#
# Requiere:
#   export CF_API_TOKEN='…'
# Permisos del token (Account API Token):
#   - Account · Cloudflare Tunnel · Edit
#   - Zone · DNS · Edit  (zona peranto.app)
#
# Docs API:
#   https://developers.cloudflare.com/api/resources/zero_trust/subresources/tunnels/subresources/cloudflared/subresources/configurations/

set -euo pipefail

HOSTNAME="${MST_WALLET_HOSTNAME:-mst-wallet.peranto.app}"
PORT="${MST_WALLET_PORT:-5173}"
SERVICE="http://127.0.0.1:${PORT}"
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-2bb43f5295134f7be98147fd2db911fa}"
CF_TUNNEL_ID="${CF_TUNNEL_ID:-f798e8e2-48f9-4425-b99f-261fc5c1fe5b}"
ZONE_NAME="${CF_ZONE_NAME:-peranto.app}"

if [[ -z "${CF_API_TOKEN:-}" ]]; then
  echo "❌ Define CF_API_TOKEN con permisos Tunnel:Edit + DNS:Edit"
  echo "   https://dash.cloudflare.com/profile/api-tokens"
  exit 1
fi

API="https://api.cloudflare.com/client/v4"
AUTH=(-H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json")

echo "🔐 Verificando token…"
WHO="$(curl -sS "${API}/user/tokens/verify" "${AUTH[@]}")"
echo "${WHO}" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('success'), d; print('   OK:', d['result']['status'])"

echo "📥 Leyendo config actual del túnel ${CF_TUNNEL_ID}…"
CURRENT="$(curl -sS "${API}/accounts/${CF_ACCOUNT_ID}/cfd_tunnel/${CF_TUNNEL_ID}/configurations" "${AUTH[@]}")"
echo "${CURRENT}" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('success'), d; print('   ingress rules:', len(d.get('result',{}).get('config',{}).get('ingress',[])))"

echo "🧩 Fusionando hostname ${HOSTNAME} → ${SERVICE} (sin tocar SSH)…"
NEW_CONFIG="$(python3 - <<'PY' "${CURRENT}" "${HOSTNAME}" "${SERVICE}"
import json, sys
payload = json.loads(sys.argv[1])
hostname = sys.argv[2]
service = sys.argv[3]
if not payload.get("success"):
    raise SystemExit(json.dumps(payload, indent=2))
config = (payload.get("result") or {}).get("config") or {}
ingress = list(config.get("ingress") or [])

# Quitar catch-all temporalmente
catch_all = None
rules = []
for rule in ingress:
    if "hostname" not in rule and rule.get("service", "").startswith("http_status"):
        catch_all = rule
    elif rule.get("hostname") == hostname:
        continue  # reemplazar
    else:
        rules.append(rule)

rules.append({"hostname": hostname, "service": service})
if catch_all is None:
    catch_all = {"service": "http_status:404"}
rules.append(catch_all)

config["ingress"] = rules
print(json.dumps({"config": config}))
PY
)"

echo "⬆️  Publicando configuración del túnel…"
PUT="$(curl -sS -X PUT "${API}/accounts/${CF_ACCOUNT_ID}/cfd_tunnel/${CF_TUNNEL_ID}/configurations" \
  "${AUTH[@]}" \
  --data "${NEW_CONFIG}")"
echo "${PUT}" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('success'), d; print('   Túnel actualizado')"

echo "🌐 Asegurando DNS CNAME ${HOSTNAME} → ${CF_TUNNEL_ID}.cfargotunnel.com…"
ZONE_ID="$(curl -sS "${API}/zones?name=${ZONE_NAME}" "${AUTH[@]}" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('success') and d['result'], d; print(d['result'][0]['id'])")"

EXISTING="$(curl -sS "${API}/zones/${ZONE_ID}/dns_records?type=CNAME&name=${HOSTNAME}" "${AUTH[@]}")"
RECORD_ID="$(echo "${EXISTING}" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('result') or []; print(r[0]['id'] if r else '')")"

DNS_BODY="$(python3 - <<PY
import json
print(json.dumps({
  "type": "CNAME",
  "name": "${HOSTNAME}",
  "content": "${CF_TUNNEL_ID}.cfargotunnel.com",
  "proxied": True,
  "ttl": 1,
}))
PY
)"

if [[ -n "${RECORD_ID}" ]]; then
  curl -sS -X PUT "${API}/zones/${ZONE_ID}/dns_records/${RECORD_ID}" "${AUTH[@]}" --data "${DNS_BODY}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('success'), d; print('   DNS actualizado')"
else
  curl -sS -X POST "${API}/zones/${ZONE_ID}/dns_records" "${AUTH[@]}" --data "${DNS_BODY}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('success'), d; print('   DNS creado')"
fi

echo ""
echo "✅ Listo: https://${HOSTNAME} → ${SERVICE}"
echo "   Arranca el entorno con: npm run dev:public"
echo "   (el conector cloudflared.service ya está corriendo en este VPS)"
