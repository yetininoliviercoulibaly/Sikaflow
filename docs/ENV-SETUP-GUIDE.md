# 🔐 Guide de Configuration des Variables d'Environnement

Ce guide explique comment obtenir chaque variable du fichier `.env` sur votre VPS.

## 📋 Checklist Rapide

- [ ] GitHub Repository Owner configuré
- [ ] Base de données PostgreSQL configurée
- [ ] WhatsApp Cloud API configurée
- [ ] Stripe configuré
- [ ] Wave configuré
- [ ] JWT Secret généré
- [ ] Cloudflare Tunnel configuré

---

## 1. GITHUB_REPOSITORY_OWNER

**Valeur :** Votre nom d'utilisateur GitHub

```bash
# C'est simplement votre username GitHub
# Exemple : si votre URL GitHub est https://github.com/john-doe
GITHUB_REPOSITORY_OWNER=john-doe
```

---

## 2. Base de Données (PostgreSQL)

**Toutes ces valeurs sont locales au VPS**, vous les définissez vous-même :

```bash
DB_USER=sikaflow                    # Nom d'utilisateur (au choix)
DB_PASSWORD=votre-mdp-securise      # Mot de passe fort
DB_NAME=sikaflow_staging            # Nom de la DB staging
```

💡 **Conseil :** Générez un mot de passe fort :

```bash
openssl rand -base64 32
```

---

## 3. WhatsApp Cloud API

### 📍 Où obtenir ces valeurs ?

1. Allez sur [Meta for Developers](https://developers.facebook.com/apps/)
2. Créez une application WhatsApp Business
3. Dans **WhatsApp > API Setup** :

```bash
# Phone Number ID
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# Temporary Access Token (ou créez un System User Token permanent)
WHATSAPP_ACCESS_TOKEN=EAABsbc...xyz

# Verify Token (vous le créez vous-même, chaîne aléatoire)
WHATSAPP_VERIFY_TOKEN=mon-token-secret-123
```

📖 **Documentation :** [WhatsApp Cloud API - Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)

---

## 4. Stripe (Paiements)

### 📍 Où obtenir ces valeurs ?

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Developers > API keys**

```bash
# Pour staging/test
STRIPE_SECRET_KEY=sk_test_51ABCxxxxxxxxxxx

# Pour production
STRIPE_SECRET_KEY=sk_live_51ABCxxxxxxxxxxx
```

3. **Developers > Webhooks** > Créez un endpoint :
   - URL : `https://staging.sikaflow.com/webhooks/stripe`
   - Récupérez le **Signing secret** :

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```

📖 **Documentation :** [Stripe API Keys](https://stripe.com/docs/keys)

---

## 5. Wave (Mobile Money)

### 📍 Où obtenir cette valeur ?

1. Contactez Wave pour obtenir un accès API marchand
2. Dashboard Wave > API Credentials

```bash
WAVE_API_KEY=wave_xxxxxxxxxx
```

---

## 6. JWT Secret

**Générez une clé aléatoire sécurisée :**

```bash
openssl rand -base64 32
```

La commande affiche une chaîne base64 aléatoire à coller comme valeur :

```bash
JWT_SECRET=<collez-ici-la-sortie-de-openssl-rand-base64-32>
```

> ⚠️ Ne réutilisez jamais un exemple trouvé dans la doc : générez toujours votre propre clé.

⚠️ **Important :** Utilisez une clé **différente** pour staging et production !

---

## 7. Cloudflare Tunnel

### 📍 Comment créer un tunnel ?

1. Allez sur [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. **Access > Tunnels > Create a tunnel**
3. Choisissez **Cloudflared**
4. Nommez le tunnel : `sikaflow-staging` (ou `sikaflow-prod`)
5. **Copiez le token** qui ressemble à :

   ```
   eyJhIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwIiwidCI6Ijk4NzY1NDMyMTBmZWRjYmE5ODc2NTQzMjEwZmVkY2JhIiwicyI6IlkyRmpZVEF4WXpBd01XVXdNVEF3T0dZeVl6QXhNakF3TmpBd1lUQXciLCJpIjoiMTIzNDU2Nzg5MCJ9
   ```

6. Configurez les **Public Hostnames** :

   - **Hostname :** `staging.sikaflow.com`
   - **Service Type :** HTTP
   - **URL :** `backend:3000` (pour l'API)

   Ou pour le frontend :

   - **URL :** `frontend:3000`

```bash
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoixxxxxx
```

📖 **Documentation :** [Cloudflare Tunnel Setup](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/)

---

## 8. ADMIN_API_KEY

**Créez une clé secrète pour l'accès admin :**

```bash
# Générez une clé aléatoire
openssl rand -hex 32
```

```bash
ADMIN_API_KEY=a1b2c3d4e5f6789...
```

---

## ✅ Vérification Finale

Une fois toutes les valeurs configurées, votre fichier `.env` sur le VPS devrait ressembler à :

```bash
GITHUB_REPOSITORY_OWNER=john-doe
DB_PASSWORD=<votre-mot-de-passe-genere>
WHATSAPP_PHONE_NUMBER_ID=123456789012345
STRIPE_SECRET_KEY=sk_test_51ABCxxx...
# etc.
```

**Testez la connexion :**

```bash
cd ~/sikaflow
docker compose -f docker-compose.staging.yml config
```

Cette commande validera que toutes les variables sont correctement lues.

---

## 🔒 Sécurité

- ✅ Ne **jamais** commiter le `.env` dans Git
- ✅ Conservez une **copie backup** sécurisée (1Password, Bitwarden, etc.)
- ✅ Utilisez des clés **différentes** pour staging et production
- ✅ Permissions du fichier : `chmod 600 .env` (lecture seule par le propriétaire)
