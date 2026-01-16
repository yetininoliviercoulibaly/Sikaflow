# ====================================================================
# SikaFlow - Script de déploiement manuel
# Usage: .\deploy.ps1 -env staging  OU  .\deploy.ps1 -env production
# ====================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$env
)

# Configuration
$VPS_USER = Read-Host "Nom d'utilisateur VPS (ex: ubuntu)"
$VPS_IP = Read-Host "Adresse IP du VPS"

Write-Host "`n🚀 Déploiement de SikaFlow en environnement: $env" -ForegroundColor Cyan

# Étape 1 : Copier les fichiers docker-compose vers le VPS
Write-Host "`n📦 Copie des fichiers docker-compose..." -ForegroundColor Yellow
if ($env -eq "staging") {
    scp docker-compose.staging.yml "${VPS_USER}@${VPS_IP}:~/sikaflow/"
} else {
    scp docker-compose.prod.yml "${VPS_USER}@${VPS_IP}:~/sikaflow/"
}

# Étape 2 : Connexion SSH et déploiement
Write-Host "`n🔄 Connexion au VPS et déploiement..." -ForegroundColor Yellow

$deployScript = @"
cd ~/sikaflow
echo "GITHUB_REPOSITORY_OWNER=$env:GITHUB_REPOSITORY_OWNER" > .env.deploy
cat .env >> .env.deploy
mv .env.deploy .env

# Login to GHCR
echo 'Connexion à GitHub Container Registry...'
docker login ghcr.io

# Pull et démarrage des conteneurs
if [ "$env" = "staging" ]; then
    echo '📥 Téléchargement des images staging...'
    docker compose -f docker-compose.staging.yml pull
    echo '🚀 Démarrage des conteneurs staging...'
    docker compose -f docker-compose.staging.yml up -d --remove-orphans
else
    echo '📥 Téléchargement des images production...'
    docker compose -f docker-compose.prod.yml pull
    echo '🚀 Démarrage des conteneurs production...'
    docker compose -f docker-compose.prod.yml up -d --remove-orphans
fi

# Nettoyage
docker image prune -f

echo '✅ Déploiement terminé !'
"@

ssh "${VPS_USER}@${VPS_IP}" $deployScript

Write-Host "`n✅ Déploiement terminé avec succès !" -ForegroundColor Green
Write-Host "🔗 Vérifiez vos services sur votre domaine Cloudflare" -ForegroundColor Cyan
