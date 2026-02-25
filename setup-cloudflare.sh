#!/bin/bash
# =============================================================================
# SikaFlow — Script de setup Cloudflare Tunnel (one-time)
# =============================================================================
# Usage:
#   ./setup-cloudflare.sh staging   # Pour staging
#   ./setup-cloudflare.sh production # Pour production
#
# Pré-requis:
#   - cloudflared installé (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
#   - Authentifié : cloudflared login
#   - CLOUDFLARE_ZONE_ID défini (trouvé dans le dashboard Cloudflare > Overview)
#   - CLOUDFLARE_API_TOKEN défini (Dashboard > My Profile > API Tokens > Create Token > Edit zone DNS)
# =============================================================================

set -e

TARGET_ENV="${1:-staging}"
DOMAIN="sika-flow.com"

if [ "$TARGET_ENV" = "staging" ]; then
    TUNNEL_NAME="sikaflow-staging"
    SUBDOMAINS=("api-staging" "agent-staging" "app-staging" "scanner-staging")
elif [ "$TARGET_ENV" = "production" ]; then
    TUNNEL_NAME="sikaflow-production"
    SUBDOMAINS=("api" "agent" "app" "scanner")
else
    echo "❌ Usage: $0 [staging|production]"
    exit 1
fi

# Vérifie les pré-requis
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared n'est pas installé."
    echo "   Installe-le : https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    exit 1
fi

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo "❌ CLOUDFLARE_ZONE_ID non défini."
    echo "   Trouve-le dans : Cloudflare Dashboard → ton domaine → Overview → Zone ID"
    echo "   export CLOUDFLARE_ZONE_ID=<ton-zone-id>"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN non défini."
    echo "   Crée-le dans : Cloudflare Dashboard → My Profile → API Tokens → Edit zone DNS"
    echo "   export CLOUDFLARE_API_TOKEN=<ton-api-token>"
    exit 1
fi

echo "🚀 Setup Cloudflare Tunnel pour $TARGET_ENV"
echo "   Tunnel : $TUNNEL_NAME"
echo "   Domaine : $DOMAIN"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 1. Créer le tunnel
# ─────────────────────────────────────────────────────────────────────────────
echo "1️⃣  Création du tunnel '$TUNNEL_NAME'..."

# Vérifier si le tunnel existe déjà
EXISTING_TUNNEL=$(cloudflared tunnel list --output json 2>/dev/null | grep -o "\"id\":\"[^\"]*\"" | head -1 | cut -d'"' -f4 || true)

if cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
    TUNNEL_ID=$(cloudflared tunnel list --output json 2>/dev/null | python3 -c "
import sys, json
tunnels = json.load(sys.stdin)
for t in tunnels:
    if t['name'] == '$TUNNEL_NAME':
        print(t['id'])
        break
" 2>/dev/null || echo "")
    
    if [ -n "$TUNNEL_ID" ]; then
        echo "   ✅ Tunnel '$TUNNEL_NAME' existe déjà : $TUNNEL_ID"
    fi
else
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_ID=$(cloudflared tunnel list --output json 2>/dev/null | python3 -c "
import sys, json
tunnels = json.load(sys.stdin)
for t in tunnels:
    if t['name'] == '$TUNNEL_NAME':
        print(t['id'])
        break
" 2>/dev/null || echo "")
    echo "   ✅ Tunnel créé : $TUNNEL_ID"
fi

if [ -z "$TUNNEL_ID" ]; then
    echo "❌ Impossible de récupérer le Tunnel ID."
    echo "   Vérifie avec : cloudflared tunnel list"
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# 2. Copier le credentials.json
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "2️⃣  Copie du fichier credentials..."

CREDS_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"
DEST_DIR="cloudflare"

mkdir -p "$DEST_DIR"

if [ -f "$CREDS_FILE" ]; then
    cp "$CREDS_FILE" "$DEST_DIR/credentials.json"
    echo "   ✅ Credentials copiés vers $DEST_DIR/credentials.json"
else
    echo "   ⚠️  Fichier credentials non trouvé : $CREDS_FILE"
    echo "   Cherche dans ~/.cloudflared/ et copie manuellement vers $DEST_DIR/credentials.json"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3. Créer les CNAME DNS
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "3️⃣  Création des enregistrements DNS CNAME..."

TUNNEL_CNAME="${TUNNEL_ID}.cfargotunnel.com"

for SUB in "${SUBDOMAINS[@]}"; do
    FULL_HOST="${SUB}.${DOMAIN}"
    
    # Vérifier si le CNAME existe déjà
    EXISTING=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${FULL_HOST}" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('result', [])))
" 2>/dev/null || echo "0")

    if [ "$EXISTING" != "0" ]; then
        echo "   ✅ $FULL_HOST → existe déjà"
    else
        RESULT=$(curl -s -X POST \
            "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records" \
            -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
            -H "Content-Type: application/json" \
            --data "{
                \"type\": \"CNAME\",
                \"name\": \"${SUB}\",
                \"content\": \"${TUNNEL_CNAME}\",
                \"ttl\": 1,
                \"proxied\": true
            }")
        
        SUCCESS=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")
        
        if [ "$SUCCESS" = "True" ]; then
            echo "   ✅ $FULL_HOST → $TUNNEL_CNAME"
        else
            echo "   ❌ Échec pour $FULL_HOST"
            echo "      $(echo "$RESULT" | python3 -c "import sys, json; [print(e['message']) for e in json.load(sys.stdin).get('errors', [])]" 2>/dev/null || echo "$RESULT")"
        fi
    fi
done

# ─────────────────────────────────────────────────────────────────────────────
# 4. Résumé
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Setup terminé !"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Tunnel ID : $TUNNEL_ID"
echo "Credentials : $DEST_DIR/credentials.json"
echo ""
echo "📋 Ajoute cette variable au .env du VPS :"
echo "   CLOUDFLARE_TUNNEL_ID=$TUNNEL_ID"
echo ""
echo "📦 Copie les credentials vers le VPS :"
echo "   scp $DEST_DIR/credentials.json user@vps:~/sikaflow/cloudflare/"
echo ""
echo "🚀 Puis déploie :"
echo "   .\\deploy.ps1 -TargetEnv $TARGET_ENV"
echo ""
