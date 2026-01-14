# 🚀 Guide de Déploiement - SikaFlow

Ce dossier contient les configurations prêtes à l'emploi pour déployer **SikaFlow** en production.

## 📂 Contenu

| Fichier                             | Usage                                                                                        |
| :---------------------------------- | :------------------------------------------------------------------------------------------- |
| **`docker-compose.all-in-one.yml`** | **Option Recommandée (VPS)**. Déploie l'App + Base de données + Redis sur une seule machine. |
| **`docker-compose.hybrid.yml`**     | **Option Managée**. Déploie uniquement l'App, et se connecte à Supabase & Upstash.           |
| **`env.example`**                   | Modèle de configuration pour la production.                                                  |

---

## 🛠️ Pré-requis

1.  Un **VPS** (Ubuntu 22.04 LTS recommandé) avec **Docker** et **Docker Compose** installés.
2.  Un compte **Cloudflare** (pour le Tunnel).

---

## 📝 Option 1 : "Tout-en-un" (VPS Standard)

C'est l'option la plus économique et performante. Tout tourne sur votre serveur.

1.  **Copier les fichiers** sur votre serveur (via `scp` ou `git clone`).
2.  Créez votre fichier `.env.prod` :
    ```bash
    cp deploy/env.example deploy/.env.prod
    nano deploy/.env.prod
    ```
    _Remplissez les sections "All-in-One" et définissez vos mots de passe._
3.  **Lancer le service** :
    ```bash
    cd deploy
    docker-compose -f docker-compose.all-in-one.yml up -d
    ```

---

## ☁️ Option 2 : "Hybride" (Supabase + Upstash)

Utilisez cette option si vous préférez ne pas gérer la base de données vous-même.

1.  **Créer les services externes** :
    - [Supabase](https://supabase.com/) (Database)
    - [Upstash](https://upstash.com/) (Redis)
2.  **Configurer** votre `.env.prod` :
    ```bash
    cp deploy/env.example deploy/.env.prod
    ```
    _Remplissez les sections "Hybrid" avec les URLs de connexion fournies par Supabase/Upstash._
3.  **Lancer le service** :
    ```bash
    cd deploy
    docker-compose -f docker-compose.hybrid.yml up -d
    ```

---

## 🔒 Sécurisation avec Cloudflare Tunnel

Pour exposer votre API (port 3000) en HTTPS sans ouvrir de ports sur le pare-feu :

1.  Allez sur **Cloudflare Zero Trust** > **Access** > **Tunnels**.
2.  Créez un tunnel et copiez le **Token**.
3.  Collez le token dans votre `.env.prod` :
    ```bash
    CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...
    ```
4.  Dans l'interface Cloudflare, pointez le tunnel vers le service Docker :
    - Service : `HTTP`
    - URL : `app:3000` (le nom du container dans le réseau Docker)

