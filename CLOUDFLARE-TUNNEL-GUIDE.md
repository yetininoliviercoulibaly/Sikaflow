# 🌐 Guide Cloudflare Tunnel - Configuration Complète

## Pourquoi Cloudflare Tunnel ?

Cloudflare Tunnel vous permet d'exposer votre application **sans ouvrir de ports** sur votre VPS. C'est plus sécurisé et plus simple que la configuration traditionnelle avec nginx/reverse proxy.

## 🚀 Configuration Étape par Étape

### Étape 1 : Créer un compte Cloudflare

1. Allez sur [cloudflare.com](https://www.cloudflare.com/)
2. Créez un compte (gratuit)
3. Ajoutez votre domaine (ex: `sikaflow.com`)

---

### Étape 2 : Accéder à Zero Trust Dashboard

1. Dans le tableau de bord Cloudflare, cliquez sur **"Zero Trust"** dans le menu latéral
2. Si c'est votre première fois, vous devrez créer une "team" (c'est gratuit)
3. URL directe : [https://one.dash.cloudflare.com/](https://one.dash.cloudflare.com/)

---

### Étape 3 : Créer un Tunnel pour Staging

1. Dans Zero Trust Dashboard :
   - **Networks** → **Tunnels** → **Create a tunnel**

2. Choisissez **"Cloudflared"** comme connecteur

3. Nommez votre tunnel :

   ```
   sikaflow-staging
   ```

4. Cliquez sur **"Save tunnel"**

5. **IMPORTANT : Copiez le token** qui s'affiche !

   ```
   eyJhIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY...
   ```

   Ce token correspond à `CLOUDFLARE_TUNNEL_TOKEN` dans votre `.env`

---

### Étape 4 : Configurer les Routes Publiques

Après avoir créé le tunnel, vous arrivez sur la page de configuration.

#### Table des Routes Staging

| Service     | Public Hostname                 | Type | URL Docker      |
| ----------- | ------------------------------- | ---- | --------------- |
| API Backend | `api-staging.sika-flow.com`     | HTTP | `backend:3000`  |
| Dashboard   | `app-staging.sika-flow.com`     | HTTP | `frontend:3000` |
| Scanner PWA | `scanner-staging.sika-flow.com` | HTTP | `scanner:80`    |

#### Route 1 : API Backend

- **Public hostname** : `api-staging.sika-flow.com`
- **Service Type** : HTTP
- **URL** : `backend:3000`

Cliquez sur **"Save hostname"**

#### Route 2 : Dashboard (Frontend Next.js)

- **Public hostname** : `app-staging.sika-flow.com`
- **Service Type** : HTTP
- **URL** : `frontend:3000`

Cliquez sur **"Save hostname"**

#### Route 3 : Scanner PWA (Ticket Validation)

- **Public hostname** : `scanner-staging.sika-flow.com`
- **Service Type** : HTTP
- **URL** : `scanner:80`

Cliquez sur **"Save hostname"**

---

### Étape 5 : Configuration DNS Automatique

Cloudflare crée **automatiquement** les enregistrements DNS nécessaires :

```
api-staging.sika-flow.com     → CNAME → [tunnel-id].cfargotunnel.com
app-staging.sika-flow.com     → CNAME → [tunnel-id].cfargotunnel.com
scanner-staging.sika-flow.com → CNAME → [tunnel-id].cfargotunnel.com
```

Vous n'avez **rien à faire manuellement** ! ✨

---

### Étape 6 : Répéter pour Production

Créez un **second tunnel** pour la production :

1. **Networks** → **Tunnels** → **Create a tunnel**
2. Nom : `sikaflow-production`
3. Copiez le nouveau token → `CLOUDFLARE_TUNNEL_TOKEN` pour production
4. Routes :

| Service   | Public Hostname         | URL Docker      |
| --------- | ----------------------- | --------------- |
| API       | `api.sika-flow.com`     | `backend:3000`  |
| Dashboard | `app.sika-flow.com`     | `frontend:3000` |
| Scanner   | `scanner.sika-flow.com` | `scanner:80`    |

---

## 📝 Résumé des Tokens

Vous devriez maintenant avoir **2 tokens** différents :

```bash
# Pour staging (.env sur VPS staging)
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiSTAGING_TOKEN_HERE...

# Pour production (.env sur VPS production)
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiPRODUCTION_TOKEN_HERE...
```

---

## ✅ Vérification

### Test avant déploiement

Pour vérifier que votre tunnel fonctionne, créez un simple test sur votre VPS :

```bash
# Sur le VPS
docker run -d --name test-backend \
  -e PORT=3000 \
  -p 3000:3000 \
  hashicorp/http-echo:latest -text="SikaFlow API Running!"

# Lancez Cloudflared manuellement
docker run -d --name cloudflared-test \
  --network host \
  cloudflare/cloudflared:latest tunnel run --token eyJhIjoiVOTRE_TOKEN...
```

Puis visitez `https://staging.sikaflow.com` → Vous devriez voir "SikaFlow API Running!"

---

## 🎯 Configuration dans docker-compose

Une fois vos tokens obtenus, ils sont **déjà configurés** dans vos `docker-compose.yml` :

```yaml
cloudflared:
  image: cloudflare/cloudflared:latest
  restart: always
  command: tunnel run
  environment:
    - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
```

Le conteneur Cloudflare Tunnel démarre automatiquement avec vos services !

---

## 🔒 Sécurité Avancée (Optionnel)

### Activer l'authentification Cloudflare Access

Pour protéger votre staging avec un login :

1. **Access** → **Applications** → **Add an application**
2. **Self-hosted**
3. Application domain : `staging.sikaflow.com`
4. Ajoutez des règles d'accès (par email, Google SSO, etc.)

Maintenant, seules les personnes autorisées peuvent accéder à votre staging ! 🛡️

---

## 📞 Support

**Documentation officielle :**

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/)

**Community :**

- [Cloudflare Community Forum](https://community.cloudflare.com/)
