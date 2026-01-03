# 🚀 Guide de Configuration CI/CD - GitHub Actions

Ce guide vous accompagne pas à pas pour configurer le pipeline CI/CD d'EventPilot sur GitHub.

---

## 📋 Pré-requis

- Un **VPS** (Hetzner, OVH, DigitalOcean) avec Ubuntu 22.04+
- **Docker** et **Docker Compose** installés sur le VPS
- Un accès **SSH** au serveur

---

## 🔧 Étape 1 : Préparer le VPS

### 1.1 Créer un utilisateur de déploiement

```bash
# Sur le VPS (en root)
adduser deploy
usermod -aG docker deploy
```

### 1.2 Générer une clé SSH (sur votre machine locale)

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/eventpilot_deploy
```

Cela crée deux fichiers :

- `~/.ssh/eventpilot_deploy` (clé privée → pour GitHub)
- `~/.ssh/eventpilot_deploy.pub` (clé publique → pour le VPS)

### 1.3 Autoriser la clé sur le VPS

```bash
# Copier la clé publique sur le VPS
ssh-copy-id -i ~/.ssh/eventpilot_deploy.pub deploy@VOTRE_IP_VPS
```

Ou manuellement :

```bash
# Sur le VPS, en tant que 'deploy'
mkdir -p ~/.ssh
echo "CONTENU_DE_eventpilot_deploy.pub" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 1.4 Créer le dossier de déploiement

```bash
# Sur le VPS
sudo mkdir -p /opt/eventpilot
sudo chown deploy:deploy /opt/eventpilot

# Copier les fichiers Docker Compose
cd /opt/eventpilot
# Créez docker-compose.yml et .env.prod ici
```

---

## 🔐 Étape 2 : Configurer les Secrets GitHub

1. Allez sur votre dépôt GitHub
2. Cliquez sur **Settings** → **Secrets and variables** → **Actions**
3. Cliquez sur **New repository secret** et ajoutez :

| Nom du Secret | Valeur                           | Description                                                     |
| :------------ | :------------------------------- | :-------------------------------------------------------------- |
| `VPS_HOST`    | `123.45.67.89`                   | IP publique de votre VPS                                        |
| `VPS_USER`    | `deploy`                         | Utilisateur SSH créé à l'étape 1.1                              |
| `VPS_SSH_KEY` | _(contenu de eventpilot_deploy)_ | Clé **privée** SSH (tout le fichier, y compris `-----BEGIN...`) |

> ⚠️ **Important** : Copiez le contenu **complet** de la clé privée, pas le chemin du fichier.

---

## 🌍 Étape 3 : Configurer l'Environnement de Production

1. Toujours dans **Settings** → **Environments**
2. Cliquez sur **New environment**
3. Nommez-le `production`
4. (Optionnel) Activez **Required reviewers** pour approuver les déploiements manuellement

---

## 📦 Étape 4 : Activer GitHub Container Registry (ghcr.io)

Le workflow CD publie l'image Docker sur `ghcr.io` automatiquement grâce au `GITHUB_TOKEN`.

1. Allez dans **Settings** → **Actions** → **General**
2. Sous **Workflow permissions**, sélectionnez :
   - ✅ **Read and write permissions**
3. Cliquez sur **Save**

---

## ✅ Étape 5 : Vérifier le Pipeline

### Test CI (Pull Request)

1. Créez une branche `feature/test-ci`
2. Faites un petit changement et ouvrez une Pull Request vers `main`
3. Vérifiez que le workflow **CI** s'exécute dans l'onglet **Actions**

### Test CD (Déploiement)

1. Mergez la PR dans `main`
2. Le workflow **CD** devrait :
   - Builder l'image Docker
   - La pousser sur `ghcr.io`
   - Se connecter au VPS et redémarrer le container

---

## 🐛 Dépannage

### Erreur SSH "Permission denied"

- Vérifiez que la clé publique est bien dans `~/.ssh/authorized_keys` sur le VPS
- Vérifiez que le secret `VPS_SSH_KEY` contient bien la clé **privée**

### Erreur Docker "permission denied"

- Assurez-vous que l'utilisateur `deploy` est dans le groupe `docker` :
  ```bash
  sudo usermod -aG docker deploy
  # Déconnectez-vous et reconnectez-vous
  ```

### Le container ne démarre pas

- Connectez-vous au VPS et vérifiez les logs :
  ```bash
  cd /opt/eventpilot
  docker compose logs app
  ```

---

## 📊 Schéma du Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        DÉVELOPPEUR                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (git push feature/*)
┌─────────────────────────────────────────────────────────────────┐
│  Pull Request → CI Workflow                                     │
│  ├─ Checkout                                                    │
│  ├─ npm ci                                                      │
│  ├─ npm run lint                                                │
│  ├─ npm run build                                               │
│  └─ npm run test (avec Postgres + Redis containers)            │
└─────────────────────────────────────────────────────────────────┘
                              │ ✅ Success
                              ▼ (merge to main)
┌─────────────────────────────────────────────────────────────────┐
│  CD Workflow                                                    │
│  ├─ Build Docker Image (multi-stage)                            │
│  ├─ Push to ghcr.io/yetininoliviercoulibaly/eventpilot         │
│  └─ SSH → docker compose pull && up -d                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      🚀 VPS (Production)                        │
│  └─ EventPilot running on port 3000                             │
└─────────────────────────────────────────────────────────────────┘
```

---

_Dernière mise à jour : Janvier 2026_
