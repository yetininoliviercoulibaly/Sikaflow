# 🚀 Guide de Déploiement SikaFlow

## Prérequis

### 1. Configuration du VPS

Voir le guide complet : [vps_setup.md](file:///c:/Users/yetin/.gemini/antigravity/brain/dae0b9b3-ef60-4777-8653-0a04f4bb37e1/vps_setup.md)

Sur votre VPS, créez le fichier `.env` avec vos secrets :

```bash
cd ~/sikaflow
nano .env
```

Ajoutez :

```bash
GITHUB_REPOSITORY_OWNER=votre-username-github
DB_USER=sikaflow
DB_PASSWORD=votre-mot-de-passe
DB_NAME=sikaflow_staging
APP_URL=https://staging.sikaflow.com
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_VERIFY_TOKEN=xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
WAVE_API_KEY=xxx
CLOUDFLARE_TUNNEL_TOKEN=eyJh...
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_WEBHOOK_SECRET=xxx
TELEGRAM_BOT_USERNAME=xxx
BYPASS_SUBSCRIPTION_CHECK=true # Mettre à false en production
```

### 2. Connexion SSH configurée

Assurez-vous de pouvoir vous connecter sans mot de passe :

```bash
ssh user@vps-ip
```

## Workflow de Déploiement

### Étape 1 : Push du Code

```bash
git push origin develop   # Pour staging
git push origin main      # Pour production
```

GitHub Actions va automatiquement :

- ✅ Builder les images Docker (backend, frontend, scanner)
- ✅ Préparer le code source ZeroClaw (zeroclaw-engine) pour le build distant

### Étape 2 : Déploiement Manuel

**Pour Staging :**

```powershell
.\deploy.ps1 -TargetEnv staging
```

**Pour Production :**

```powershell
.\deploy.ps1 -TargetEnv production
```

Le script va :

1. Copier les fichiers docker-compose vers le VPS
2. Copier le code source de l'agent (**zeroclaw-engine**) vers le VPS
3. Se connecter au VPS via SSH
4. Télécharger les dernières images depuis GHCR
5. Recompiler l'image ZeroClaw personnalisée (**sikaflow/zeroclaw:custom**) via `docker compose up --build`
6. Redémarrer les conteneurs

## Vérification

```bash
# Sur le VPS
docker ps                                           # Voir les conteneurs actifs
docker compose -f docker-compose.staging.yml logs -f zeroclaw # Voir les logs de l'agent
```

## Maintenance de l'Agent (ZeroClaw)

L'agent IA est implémenté en Rust dans le dossier `zeroclaw-engine`.
Contrairement aux versions précédentes, les outils sont **compilés nativement** dans le binaire.

Pour ajouter un outil :

1. Créez un fichier `.rs` dans `zeroclaw-engine/src/tools/sikaflow/`.
2. Enregistrez-le dans `mod.rs`.
3. Poussez votre code. Le déploiement se chargera de la compilation sur le serveur.

## Rollback

En cas de problème, revenez à une version précédente :

```bash
# Sur le VPS
docker compose -f docker-compose.staging.yml down
docker pull ghcr.io/username/sikaflow-backend:sha-xxx  # Version précédente
docker compose -f docker-compose.staging.yml up -d
```

## Notes

- Les images sont taguées par branche (`develop`, `main`) et par commit SHA
- Le fichier `.env` sur le VPS contient tous les secrets (ne jamais le commiter)
- Cloudflare Tunnel gère l'exposition HTTPS automatiquement
