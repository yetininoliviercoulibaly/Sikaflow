# 🚀 Checklist de Déploiement SikaFlow

Suivez cette checklist pour déployer SikaFlow sur votre VPS.

## ✅ Phase 1 : Configuration VPS (À faire une seule fois)

### 1.1 Préparer le VPS

- [ ] VPS Ubuntu créé (minimum 2GB RAM, 1 vCPU)
- [ ] Connexion SSH configurée
- [ ] Docker installé sur le VPS
- [ ] Docker Compose installé

**Commandes pour installer Docker :**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 1.2 Configurer SSH

- [ ] Clé SSH générée localement : `ssh-keygen -t ed25519 -C "deploy" -f sikaflow-deploy-key`
- [ ] Clé publique ajoutée au VPS : `~/.ssh/authorized_keys`
- [ ] Test de connexion sans mot de passe : `ssh user@vps-ip`

### 1.3 Créer le répertoire de déploiement

```bash
mkdir -p ~/sikaflow
```

---

## ✅ Phase 2 : Configuration des Services Externes

### 2.1 GitHub

- [ ] Repository créé et code poussé
- [ ] Branches `main` et `develop` créées

### 2.2 Cloudflare

- [ ] Compte Cloudflare créé
- [ ] Domaine ajouté à Cloudflare
- [ ] Tunnel staging créé : `sikaflow-staging`
- [ ] Token staging copié
- [ ] DNS configuré : `staging.sikaflow.com`

### 2.3 WhatsApp Cloud API

- [ ] Application Meta for Developers créée
- [ ] `WHATSAPP_PHONE_NUMBER_ID` récupéré
- [ ] `WHATSAPP_ACCESS_TOKEN` récupéré
- [ ] `WHATSAPP_VERIFY_TOKEN` défini

### 2.4 Stripe

- [ ] Compte Stripe créé
- [ ] `STRIPE_SECRET_KEY` (test) récupéré
- [ ] Webhook endpoint configuré : `https://staging.sikaflow.com/webhooks/stripe`
- [ ] `STRIPE_WEBHOOK_SECRET` récupéré

### 2.5 Wave (Optionnel)

- [ ] Compte Wave API créé
- [ ] `WAVE_API_KEY` récupéré

---

## ✅ Phase 3 : Configuration du fichier .env sur le VPS

### 3.1 Générer les secrets

```bash
# DB Password
openssl rand -base64 32

# JWT Secret
openssl rand -base64 32

# Admin API Key
openssl rand -hex 32
```

### 3.2 Créer le fichier .env

- [ ] Fichier `~/sikaflow/.env` créé
- [ ] Toutes les variables remplies (voir `.env.vps.template`)
- [ ] Permissions sécurisées : `chmod 600 ~/sikaflow/.env`

**Vérifier la configuration :**

```bash
cd ~/sikaflow
cat .env | grep -v "^#" | grep "="
```

---

## ✅ Phase 4 : Premier Déploiement

### 4.1 Pousser le code

```bash
git push origin develop
```

### 4.2 Vérifier que GitHub Actions a buildé les images

- [ ] Aller sur GitHub → Actions
- [ ] Workflow "Build Docker Images" terminé avec succès ✅
- [ ] Images visibles sur GitHub Packages

### 4.3 Déployer sur le VPS

```powershell
.\deploy.ps1 -env staging
```

**Entrez :**

- Nom d'utilisateur VPS
- IP du VPS

### 4.4 Vérifier les logs

```bash
# Sur le VPS
ssh user@vps-ip
cd ~/sikaflow
docker ps                                      # Tous les conteneurs running ?
docker compose -f docker-compose.staging.yml logs backend -f
```

---

## ✅ Phase 5 : Tests

### 5.1 Test de santé API

```bash
curl https://staging.sikaflow.com/health
```

**Réponse attendue :** `200 OK`

### 5.2 Test WhatsApp Webhook

1. Envoyez un message au numéro WhatsApp configuré
2. Vérifiez les logs : `docker logs sikaflow-backend-staging`

### 5.3 Test Stripe Webhook

1. Stripe Dashboard → Webhooks → Envoyer un test
2. Vérifiez les logs backend

---

## ✅ Phase 6 : Production (Quand prêt)

### 6.1 Créer le tunnel production

- [ ] Tunnel production créé : `sikaflow-production`
- [ ] Token production copié
- [ ] DNS configuré : `sikaflow.com`, `api.sikaflow.com`

### 6.2 Fichier .env production

- [ ] Créer `.env` sur VPS de production
- [ ] Utiliser les clés **LIVE** (Stripe `sk_live_`, etc.)
- [ ] `CLOUDFLARE_TUNNEL_TOKEN` de production

### 6.3 Déployer en production

```bash
git push origin main

# Puis
.\deploy.ps1 -env production
```

---

## 🔄 Workflow Quotidien

### Déployer une mise à jour sur staging

```bash
git add .
git commit -m "Description des changements"
git push origin develop

# Attendre que GitHub Actions build les images (1-2 min)

.\deploy.ps1 -env staging
```

### Promouvoir staging vers production

```bash
git checkout main
git merge develop
git push origin main

.\deploy.ps1 -env production
```

---

## 🆘 Troubleshooting

### Les conteneurs ne démarrent pas

```bash
docker compose -f docker-compose.staging.yml logs
```

### Erreur "image not found"

- Vérifiez que GitHub Actions a bien buildé l'image
- Vérifiez `GITHUB_REPOSITORY_OWNER` dans `.env`

### Erreur de connexion base de données

- Vérifiez `DB_PASSWORD` dans `.env`
- Vérifiez que le conteneur `db` est healthy : `docker ps`

### Cloudflare Tunnel ne fonctionne pas

- Vérifiez le token : `echo $CLOUDFLARE_TUNNEL_TOKEN`
- Vérifiez les logs : `docker logs cloudflared`

---

## 📞 Support

- **Documentation :** Voir les guides `ENV-SETUP-GUIDE.md`, `CLOUDFLARE-TUNNEL-GUIDE.md`
- **Logs :** Toujours commencer par `docker logs [container-name]`
