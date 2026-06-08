# 📷 SikaFlow Scanner

PWA de **validation de billets par QR code** pour SikaFlow. Le personnel à l'entrée d'un événement scanne les QR des participants ; chaque scan est validé en temps réel contre l'API backend.

## 🛠️ Stack

- [Vite 7](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) — accès caméra & décodage QR
- [Axios](https://axios-http.com/) — appels à l'API SikaFlow

## 🚀 Développement

```bash
npm install
npm run dev        # http://localhost:5173
```

## 📦 Build & preview

```bash
npm run build      # tsc -b && vite build  → dist/
npm run preview    # sert le build de production localement
npm run lint       # ESLint
```

## 🔧 Configuration

| Variable | Description | Défaut (Docker) |
| :------- | :---------- | :-------------- |
| `VITE_API_URL` | URL de base de l'API backend SikaFlow | `http://localhost:3000` |

Créez un fichier `.env` (ignoré par Git) à la racine de `scanner/` pour surcharger ces valeurs en local.

## 🐳 Docker

L'image est buildée et servie (Nginx, port `80`) via la stack racine :

```bash
docker compose -f ../docker-compose.local.yml up --build scanner   # exposé sur http://localhost:3002
```

> Caméra : les navigateurs n'autorisent l'accès à la caméra que sur `https://` ou `http://localhost`. En production, le scanner doit être servi en HTTPS.
