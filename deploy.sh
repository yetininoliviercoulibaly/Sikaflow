#!/bin/bash

# Nettoyage des arguments (suppression des espaces/retours à la ligne résiduels)
TARGET_ENV=$(echo "$1" | tr -d '[:space:]')
REPO_OWNER="softilab"

echo "🚀 Début du déploiement pour: [$TARGET_ENV]"

# Vérification des permissions Docker
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  L'utilisateur actuel n'a pas les permissions Docker."
    echo "tentative avec sudo..."
    DOCKER_CMD="sudo docker"
else
    DOCKER_CMD="docker"
fi

cd ~/sikaflow || exit

# Mise à jour du .env avec le repo owner
if ! grep -q "GITHUB_REPOSITORY_OWNER=" .env; then
    echo "GITHUB_REPOSITORY_OWNER=$REPO_OWNER" >> .env
fi

# Sécurité: s'assurer que le répertoire cloudflare existe
mkdir -p cloudflare

# Injection des variables d'environnement dans les outils ZeroClaw
if [ -d "zeroclaw/tools" ] && [ -f ".env" ]; then
    echo "🔧 Setup vars for ZeroClaw configs..."
    # Chargement des variables
    export $(grep -v '^#' .env | xargs)

    # Injection des variables dans config.toml
    if [ -f "zeroclaw/config.toml" ]; then
        echo "🔧 Injection des secrets dans config.toml..."
        DB_URL="postgres://${DB_USER}:${DB_PASSWORD}@db:5432/zeroclaw_prod"
        if [ "$TARGET_ENV" = "staging" ]; then
            DB_URL="postgres://${DB_USER}:${DB_PASSWORD}@db:5432/zeroclaw_poc"
        fi
        sed -i "s|{{ZEROCLAW_DB_URL}}|$DB_URL|g" "zeroclaw/config.toml"
        sed -i "s|{{TELEGRAM_BOT_TOKEN}}|$TELEGRAM_BOT_TOKEN|g" "zeroclaw/config.toml"
        sed -i "s|{{WHATSAPP_PHONE_NUMBER_ID}}|$WHATSAPP_PHONE_NUMBER_ID|g" "zeroclaw/config.toml"
        sed -i "s|{{WHATSAPP_ACCESS_TOKEN}}|$WHATSAPP_ACCESS_TOKEN|g" "zeroclaw/config.toml"
        sed -i "s|{{WHATSAPP_VERIFY_TOKEN}}|$WHATSAPP_VERIFY_TOKEN|g" "zeroclaw/config.toml"
        sed -i "s|{{WHATSAPP_APP_SECRET}}|$WHATSAPP_APP_SECRET|g" "zeroclaw/config.toml"
        sed -i "s|{{GEMINI_MODEL_NAME}}|$GEMINI_MODEL_NAME|g" "zeroclaw/config.toml"
    fi

    # Security: Ensure ZeroClaw container (running as non-root) can read the tools and config
    echo "🔒 Application des permissions de lecture pour le conteneur ZeroClaw..."
    chmod -R +r zeroclaw/
    find zeroclaw/ -type d -exec chmod +x {} +
fi

echo "📥 Pulling images..."
if [ "$TARGET_ENV" = "staging" ]; then
    $DOCKER_CMD compose -f docker-compose.staging.yml pull
    echo "🔄 Restarting staging..."
    $DOCKER_CMD compose -f docker-compose.staging.yml up -d --build --remove-orphans
else
    echo "Checking for prod file..."
    ls -l docker-compose.prod.yml
    $DOCKER_CMD compose -f docker-compose.prod.yml pull
    echo "🔄 Restarting production..."
    $DOCKER_CMD compose -f docker-compose.prod.yml up -d --build --remove-orphans
fi

echo "🧹 Nettoyage..."
$DOCKER_CMD image prune -f

echo "✅ Déploiement terminé !"
