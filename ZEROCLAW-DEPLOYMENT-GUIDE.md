# 🚀 Guide de Déploiement SikaFlow + ZeroClaw

## Vue d'ensemble

ZeroClaw remplace l'orchestrateur agent custom et gère la messagerie WhatsApp/Telegram directement. Le déploiement est **entièrement automatisé** via `deploy.ps1`.

### Architecture

```
Internet
   │
   ├── WhatsApp Cloud API ──→ ZeroClaw (port 3001)
   ├── Telegram Bot API ────→ ZeroClaw (port 3001)
   │
   └── Cloudflare Tunnel ──→ Backend NestJS (port 3000)
                            → Frontend Next.js
                            → Scanner PWA

   ZeroClaw ──HTTP──→ Backend NestJS (réseau Docker interne)
             ──SQL───→ PostgreSQL (base séparée: zeroclaw_poc/zeroclaw_prod)
```

### Fichiers ZeroClaw (déjà dans le repo)

```
zeroclaw/
├── system-prompt.md          # Règles agent (456 lignes)
├── memory-schema.md          # Schéma mémoire conversationnelle
├── onboarding-conversation.md # Design onboarding
└── tools/                    # 10 tools YAML (type: http_request)
    ├── check-user-exists.tool.yaml
    ├── create-organization.tool.yaml
    ├── record-expense.tool.yaml
    ├── record-income.tool.yaml
    ├── get-balance.tool.yaml
    ├── record-debt.tool.yaml
    ├── get-debts.tool.yaml
    ├── settle-debt.tool.yaml
    ├── remind-debt.tool.yaml
    └── update-transaction-category.tool.yaml
```

---

## Déploiement Automatisé (CI/CD)

### Flux automatique

```
Push sur develop → Build images → Deploy staging (VPS)
Push sur main    → Build images → Deploy production (VPS)
```

Le workflow GitHub Actions (`.github/workflows/deploy.yml`) fait tout :

1. ✅ Build et push des images Docker (backend, frontend, scanner)
2. ✅ Copie des configs sur le VPS (compose, zeroclaw, cloudflare)
3. ✅ Exécution de `deploy.sh` (pull, compose up, cleanup)
4. ✅ Health check (backend + ZeroClaw)

### GitHub Secrets requis

| Secret        | Description          | Exemple                                  |
| ------------- | -------------------- | ---------------------------------------- |
| `VPS_HOST`    | IP du VPS            | `51.159.xxx.xxx`                         |
| `VPS_USER`    | Utilisateur SSH      | `ubuntu`                                 |
| `VPS_SSH_KEY` | Clé privée SSH (PEM) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT`    | Port SSH (optionnel) | `22`                                     |

> **Générer une clé SSH dédiée** :
>
> ```bash
> ssh-keygen -t ed25519 -f ~/.ssh/sikaflow-deploy -C "github-actions-deploy"
> # Ajouter la clé publique sur le VPS :
> cat ~/.ssh/sikaflow-deploy.pub >> ~/.ssh/authorized_keys
> # Copier la clé privée dans GitHub → Settings → Secrets → VPS_SSH_KEY
> ```

### Variables d'environnement (GitHub Environments)

Créez 2 **Environments** dans GitHub (**Settings → Environments**) :

- `staging` — déploiements depuis `develop`
- `production` — déploiements depuis `main`

Dans chaque environment, définissez **individuellement** :

#### Secrets (valeurs sensibles — **Settings → Environments → [env] → Secrets**)

| Secret                     | Description                               |
| -------------------------- | ----------------------------------------- |
| `DB_USER`                  | Utilisateur PostgreSQL                    |
| `DB_PASSWORD`              | Mot de passe PostgreSQL                   |
| `JWT_SECRET`               | Clé secrète JWT                           |
| `ADMIN_API_KEY`            | Clé API admin (= SIKAFLOW_API_KEY)        |
| `GOOGLE_API_KEY`           | Clé API Gemini                            |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID Meta                      |
| `WHATSAPP_ACCESS_TOKEN`    | Access token Meta                         |
| `WHATSAPP_VERIFY_TOKEN`    | Verify token webhook                      |
| `WHATSAPP_APP_SECRET`      | App secret Meta                           |
| `TELEGRAM_BOT_TOKEN`       | Token du bot Telegram                     |
| `TELEGRAM_WEBHOOK_SECRET`  | Secret webhook Telegram                   |
| `STRIPE_SECRET_KEY`        | Clé secrète Stripe                        |
| `STRIPE_WEBHOOK_SECRET`    | Secret webhook Stripe                     |
| `WAVE_API_KEY`             | Clé API Wave                              |
| `CLOUDFLARE_TUNNEL_ID`     | ID du tunnel Cloudflare                   |
| `CLOUDFLARE_ZONE_ID`       | Zone ID Cloudflare (Dashboard → Overview) |
| `CLOUDFLARE_API_TOKEN`     | API Token Cloudflare (Edit zone DNS)      |

#### Variables (config non sensible — **Settings → Environments → [env] → Variables**)

| Variable                    | Défaut             | Description                           |
| --------------------------- | ------------------ | ------------------------------------- |
| `DB_NAME`                   | —                  | `sikaflow_staging` ou `sikaflow_prod` |
| `APP_URL`                   | —                  | `https://api-staging.sika-flow.com`   |
| `NEXT_PUBLIC_API_URL`       | —                  | Même que APP_URL                      |
| `DB_HOST`                   | `db`               | Hostname PostgreSQL                   |
| `DB_PORT`                   | `5432`             | Port PostgreSQL                       |
| `REDIS_HOST`                | `redis`            | Hostname Redis                        |
| `REDIS_PORT`                | `6379`             | Port Redis                            |
| `PORT`                      | `3000`             | Port backend                          |
| `TELEGRAM_BOT_USERNAME`     | `SikaFlowBot`      | Username du bot                       |
| `GEMINI_MODEL_NAME`         | `gemini-2.0-flash` | Modèle LLM                            |
| `BYPASS_SUBSCRIPTION_CHECK` | `false`            | Désactiver la vérif d'abonnement      |

> **Modifier une variable** : éditer le secret/variable individuellement dans GitHub → le prochain `push` la déploie.

### Pré-requis VPS (initiaux uniquement)

Le `.env` est maintenant **géré automatiquement** par le workflow. Aucune modification manuelle sur le VPS n'est nécessaire après le premier déploiement.

### Déploiement manuel (fallback)

```powershell
.\deploy.ps1 -TargetEnv staging
```

### Déclenchement manuel via GitHub

**GitHub → Actions → Build & Deploy → Run workflow** → choisir l'environnement.

---

## Routage Réseau (automatisé)

Le routage Cloudflare est **versionné dans Git** dans `cloudflare/config.staging.yml` et `cloudflare/config.prod.yml`. Les routes incluent automatiquement ZeroClaw :

| Hostname                        | Service                  |
| ------------------------------- | ------------------------ |
| `api-staging.sika-flow.com`     | Backend NestJS (`:3000`) |
| `agent-staging.sika-flow.com`   | ZeroClaw (`:3001`)       |
| `app-staging.sika-flow.com`     | Frontend Next.js         |
| `scanner-staging.sika-flow.com` | Scanner PWA              |

### Setup initial (une seule fois par environnement)

```bash
# Pré-requis : cloudflared installé + cloudflared login
export CLOUDFLARE_ZONE_ID=<ton-zone-id>       # Dashboard → Overview → Zone ID
export CLOUDFLARE_API_TOKEN=<ton-api-token>    # Dashboard → API Tokens → Edit zone DNS

# Le script fait tout automatiquement :
#   1. Crée le tunnel
#   2. Copie le credentials.json dans cloudflare/
#   3. Crée les CNAME DNS (api, agent, app, scanner)
./setup-cloudflare.sh staging

# Puis copie les credentials vers le VPS
scp cloudflare/credentials.json user@vps:~/sikaflow/cloudflare/
```

### Webhooks WhatsApp/Telegram

Configurez les webhooks une seule fois :

- **WhatsApp** (Meta) : `https://agent-staging.sika-flow.com/webhook/whatsapp`
- **Telegram** :

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://agent-staging.sika-flow.com/webhook/telegram", "secret_token": "${TELEGRAM_WEBHOOK_SECRET}"}'
```

---

## Tests Post-Déploiement

### Santé

```bash
curl https://api-staging.sika-flow.com/health          # Backend
curl https://agent-staging.sika-flow.com/health     # ZeroClaw
```

### Test E2E

1. **Onboarding** : Nouveau numéro → reçoit les questions → org créée
2. **Dépense** : "Dépense 5000 boissons" → confirmation → enregistré
3. **Solde** : "Ma caisse" → résumé formaté
4. **Dette** : "Kofi me doit 10000" → enregistré
5. **Relance** : "Relance Kofi" → rappel envoyé

---

## Troubleshooting

| Problème                  | Solution                                                          |
| ------------------------- | ----------------------------------------------------------------- |
| ZeroClaw ne démarre pas   | `docker compose logs zeroclaw` — vérifier DB et `GOOGLE_API_KEY`  |
| Pas de messages reçus     | Vérifier les webhooks Meta/Telegram et les logs Cloudflare        |
| Erreurs HTTP vers backend | `docker exec zeroclaw curl http://backend:3000/health`            |
| Latence élevée            | Utiliser `gemini-2.0-flash`, vérifier CPU/RAM avec `htop`         |
| **Rollback**              | Remettre webhooks vers le backend, `docker compose stop zeroclaw` |
