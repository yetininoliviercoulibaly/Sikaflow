# ====================================================================
# SikaFlow - Script de déploiement (Final v3)
# ====================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$TargetEnv
)

$VPS_USER = Read-Host "Nom d'utilisateur VPS (ex: ubuntu)"
$VPS_IP = Read-Host "Adresse IP du VPS"
$UserHost = "${VPS_USER}@${VPS_IP}"

Write-Host "`n🚀 Deploiement sur $TargetEnv ($VPS_IP)" -ForegroundColor Cyan
Write-Host "NOTE: Assurez-vous que le build GitHub Actions est termine !" -ForegroundColor Yellow

if ($TargetEnv -eq "staging") {
    $ComposeFile = "docker-compose.staging.yml"
} else {
    $ComposeFile = "docker-compose.prod.yml"
}

# 1. Copie des fichiers
Write-Host "`n1️⃣  [Mot de passe requis] Copie des fichiers..." -ForegroundColor Cyan
scp deploy.sh $ComposeFile "${UserHost}:~/"
scp -r zeroclaw "${UserHost}:~/zeroclaw-upload"

Write-Host "   Nettoyage d'artefacts Cargo avant upload..." -ForegroundColor DarkGray
Remove-Item -Path "zeroclaw-engine/target" -Recurse -Force -ErrorAction Ignore
scp -r zeroclaw-engine "${UserHost}:~/zeroclaw-engine-upload"

# Cloudflare config (environment-specific)
Write-Host "   Copie config Cloudflare ($TargetEnv)..." -ForegroundColor DarkGray
scp "cloudflare/config.${TargetEnv}.yml" "${UserHost}:~/cloudflare-config.yml"

if ($LASTEXITCODE -ne 0) { Write-Error "Echec copie SCP."; exit 1 }

# 2. Execution (Commande unique sur une seule ligne)
Write-Host "`n2️⃣  [Mot de passe requis] Lancement..." -ForegroundColor Cyan

# Astuce: On chaine tout avec '&&' sur une seule ligne PowerShell pour eviter les problemes CRLF
ssh $UserHost "mkdir -p ~/sikaflow && rm -rf ~/sikaflow/zeroclaw && mv ~/zeroclaw-upload ~/sikaflow/zeroclaw && rm -rf ~/sikaflow/zeroclaw-engine && mv ~/zeroclaw-engine-upload ~/sikaflow/zeroclaw-engine && mv ~/$ComposeFile ~/sikaflow/ && tr -d '\r' < ~/deploy.sh > ~/sikaflow/deploy.sh && rm ~/deploy.sh && chmod +x ~/sikaflow/deploy.sh && ~/sikaflow/deploy.sh $TargetEnv"

if ($LASTEXITCODE -ne 0) { 
    Write-Error "Echec du deploiement distant."
    exit 1 
}

Write-Host "`n✅ SUCCES ! Deploiement termine." -ForegroundColor Green
