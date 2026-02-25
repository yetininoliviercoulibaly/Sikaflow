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

# Setup ZeroClaw config (idempotent)
if [ -d ~/zeroclaw-upload ]; then
    echo "📦 Installing ZeroClaw config..."
    rm -rf ~/sikaflow/zeroclaw
    mv ~/zeroclaw-upload ~/sikaflow/zeroclaw
fi

# Setup Cloudflare config (idempotent)
if [ -f ~/cloudflare-config.yml ]; then
    echo "🌐 Installing Cloudflare config..."
    mkdir -p ~/sikaflow/cloudflare
    mv ~/cloudflare-config.yml ~/sikaflow/cloudflare/config.${TARGET_ENV}.yml
fi

# Mise à jour du .env avec le repo owner
if ! grep -q "GITHUB_REPOSITORY_OWNER=" .env; then
    echo "GITHUB_REPOSITORY_OWNER=$REPO_OWNER" >> .env
fi

echo "📥 Pulling images..."
if [ "$TARGET_ENV" = "staging" ]; then
    $DOCKER_CMD compose -f docker-compose.staging.yml pull
    echo "🔄 Restarting staging..."
    $DOCKER_CMD compose -f docker-compose.staging.yml up -d --remove-orphans
else
    echo "Checking for prod file..."
    ls -l docker-compose.prod.yml
    $DOCKER_CMD compose -f docker-compose.prod.yml pull
    echo "🔄 Restarting production..."
    $DOCKER_CMD compose -f docker-compose.prod.yml up -d --remove-orphans
fi

echo "🧹 Nettoyage..."
$DOCKER_CMD image prune -f

echo "✅ Déploiement terminé !"
