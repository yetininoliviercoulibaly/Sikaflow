# 🌍 Stratégie Commerciale & Roadmap - EventPilot

## 📊 1. Analyse du Produit & Proposition de Valeur Unique (UVP)

EventPilot se positionne comme un **"OS Événementiel WhatsApp-First"**, utilisant l'IA multimodale pour rompre avec les logiciels SaaS traditionnels complexes (dashboards web) et les applications mobiles coûteuses (friction de téléchargement).

### Forces (Interne)

- **Zéro Friction** : Tout se passe sur WhatsApp (app la plus utilisée au monde).
- **Dual Payment** : Stripe (International) + **Wave** (Afrique) = Avantage concurrentiel massif sur le corridor Afrique-Europe.
- **IA Multimodale** : Traitement des factures/photos (scan tickets, incidents) et audio (commandes vocales) supérieur aux formulaires classiques.
- **Audit Ready** : Architecture hexagonale stricte + Logs financiers précis = Confiance pour les régulateurs.

### Faiblesses (Interne)

- **Dépendance Meta** : Risque de blocage WhatsApp Business API (nécessite une compliance stricte).
- **Complexité UX** : Certaines tâches (dashboard analytique complexe) sont moins intuitives en chat qu'en web.

---

## 🗺️ 2. Étude de Marché & Positionnement par Zone

### A. 🇨🇮 Zone Afrique Francophone (Cible : Sénégal, Côte d'Ivoire, Cameroun)

_Sous-bancarisés, Mobile-First, Économie Informelle_

- **Market Insight** :
  - WhatsApp est l'internet.
  - Le Cash et le Mobile Money (Wave, Orange Money) dominent à 99%.
  - Besoin critique de **traçabilité** pour les organisateurs (vols de cash fréquents aux guichets).
- **Concurrence** : Solutions locales fragmentées, peu d'outils "tout-en-un" intégrant la billetterie ET la gestion opérationnelle staff.
- **Approche Commerciale** : **"Le Contrôleur de Gestion dans votre Poche"**.
  - Ne vendez pas une "Billetterie" (trop de concurrence), vendez la **Sécurité du Cash** et le **Reporting Automatique** pour les sponsors.
  - **Cible** : Promoteurs de concerts, Festivals, Églises/Associations (cotisations).
  - **Hook** : "Payez 15 000 FCFA pour débloquer le bot ce weekend. Recevez tout l'argent de vos tickets sur VOTRE Wave, nous ne touchons rien. EventPilot s'occupe juste des rapports."

### B. 🇨🇦 Zone Québec (Cible : Montréal - Nightlife & Festivals)

_Réglementé, Hivers Rudes, Culture du "Line Bypass"_

- **Cultural Insight : L'Économie du "Coupe-File"** :
  - À Montréal, l'hiver (-20°C) impose une gestion des files d'attente critique. Le client paie pour la **certitude** d'entrer vite ("Line Bypass Ticket").
  - Le **Bottle Service** (Réservation de table) est la norme pour garantir l'entrée.
  - **Rôle du Scan** : Il est central ici. Il sert à valider le droit d'accès prioritaire (Scan = Entrée Rapide) et à l'attribution des commissions aux promoteurs.
- **Facteur Légal (RACJ)** :
  - La police/pompiers imposent des limites de capacité strictes. Le scan fournit un compteur temps réel "Entrées/Sorties" opposable aux autorités. Un atout majeur pour la protection de la licence d'alcool.
- **Approche Commerciale** : **"L'Assistant de Conformité & de Fluidité"**.
  - Positionner l'outil comme une solution de "Fast-Track" pour les clients et de "Sécurité Juridique" pour les patrons.
  - **Cible** : Propriétaires de Bars/Clubs, Promoteurs de soirées "underground".
  - **Hook** : "Vos bouncers scannent pour valider les coupe-files et comptent la capacité réelle pour la police. Rapport incident RACJ généré auto sur WhatsApp."

### C. 🇫🇷 Zone France (Cible : Paris - Corporate & Premium)

_Saturé, Exigeant, Culture du "Face Control"_

- **Cultural Insight : "Physionomie" vs Scan** :
  - À Paris, l'entrée en club se joue souvent au "Face Control" (Sélection à la porte) plutôt qu'au billet pré-acheté, sauf pour les gros events (Concerts/Festivals).
  - Le Scan pur et dur peut être perçu comme trop "industriel" pour des lieux sélects.
  - **Opportunité** : Utiliser le scan pour la **Gestion VIP** (Reconnaissance des "Habitués" sur guestlist) plutôt que pour la validation de paiement.
- **Approche Commerciale** : **"Le Concierge Événementiel de Luxe"**.
  - Ne pas attaquer la billetterie de masse ("Entrée 10€"). Se positionner sur le service **Premium / Guestlist**.
  - **Cible** : Agences événementielles (Séminaires, Lancements produits), Mariages haut de gamme, Soirées privées.
  - **Hook** : "Une Guestlist digitale sur WhatsApp. Le portier sait instantanément qui est le VIP, son historique de dépenses, et l'accueille par son nom."

---

## 🚀 3. Roadmap Commerciale (Go-To-Market)

### Phase 1 : "L'Ancrage Ouest-Africain" (Mois 1-3)

**Objectif** : Traction & Volume via le modèle "Prepaid"

1.  **Partenariat Stratégique** : Cibler 5 promoteurs influents. Offrir les premiers "Pass 48h" gratuitement.
2.  **Marketing** : Campagne "Votre argent reste chez vous". Insister sur le fait qu'EventPilot ne touche pas aux revenus de la billetterie (Argument de confiance majeur).
3.  **Feature Focus** : Optimiser `ActivateEventPassUseCase` pour que le paiement Wave soit fluide (Push USSD).

### Phase 2 : "La Niche Montréalaise" (Mois 3-6)

**Objectif** : Crédibilité & ARPU (Average Revenue Per User) élevé

1.  **Pilote "Nightlife Safe"** : Déployer dans 3 clubs montréalais pour la gestion des entrées prioritaires (Scan Coupe-File) et incidents.
2.  **Compliance** : Adapter les rapports (`ReportService`) pour qu'ils matchent exactement les formulaires demandés par la RACJ ou les assureurs.
3.  **Pricing** : Abonnement mensuel SaaS (ex: 150$/mois) + frais minimes sur billets "Line Bypass".

### Phase 3 : "L'Expansion Corporate France" (Compagnon Web)

**Objectif** : Image de Marque & Analyse Profonde

1.  **Dashboard Web Analytique** :
    - _Pourquoi ?_ WhatsApp est parfait pour l'opérationnel temps réel, mais terrible pour analyser des courbes de tendances sur 6 mois ou exporter des CSV complexes.
    - _Pour qui ?_ Les "Power Users" (Organisateurs qui gèrent >1000 personnes/mois).
2.  **Stratégie d'Authentification : "Magic Link WhatsApp"**
    - Ne JAMAIS demander de mot de passe (Mdp oublié = Friction = Abandon).
    - **Flux** : L'utilisateur écrit "Dashboard" sur WhatsApp -> Le bot répond avec un lien unique temporaire (`https://app.eventpilot.com/auth?token=xyz`).
    - **Avantage** : Sécurité forte (le numéro WhatsApp est le facteur d'auth) et Zéro friction à l'inscription.

### 🔮 Phase 4 : Diversification Telegram (Opportunité)

**Analyse** : Telegram a une part de marché bien plus faible que WhatsApp en Afrique/Québec, mais une API beaucoup plus permissive (Pas de risque de ban, UX riche).

- **Stratégie** : Utiliser Telegram comme **"Plan B" (Failover)** si le numéro WhatsApp est restreint, ou pour des communautés de niche (Crypto/Tech events).
- **Mise en œuvre** : L'architecture étant déjà modulaire (`IMessageStrategy`), l'ajout d'un adaptateur Telegram est techniquement trivial.

---

## 💰 Modèle de Revenus Suggéré

| Zone        | Modèle                      | Pricing Suggéré                                                                                                       |
| :---------- | :-------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **Afrique** | **Prepaid "Pay-as-you-go"** | **15 000 FCFA / 48h (Event Pass)**. <br>L'organisateur paie pour "débloquer" le bot. Il garde 100% de sa billetterie. |
| **Québec**  | **Hybride (SaaS + Usage)**  | **99-199$ CAD / mois** (Abonnement Staff) <br>+ Option "Event Pass" pour les promoteurs externes (25$).               |
| **France**  | **License / Flat Fee**      | **500€ - 2000€ / événement** (Forfait Conciergerie VIP).                                                              |

---

> [!CAUTION]
>
> ## ☠️ RISQUE EXISTENTIEL : LA RÈGLE D'OR WHATSAPP
>
> **L'erreur fatale** pour une startup sur WhatsApp est de faire du "Marketing Push" (Spam).
> Si des utilisateurs bloquent votre bot ou le signalent comme spam, **Meta bannira votre numéro définitivement**.
>
> **Règle absolue** :
>
> - **Jamais** de promotion non sollicitée ("Viens à ma soirée !").
> - **Toujours** du contenu utilitaire ("Voici ton billet", "Voici ton reçu").
>
> L'utilisateur doit percevoir le bot comme un **outil** dont il a besoin, pas comme une **boîte mail** qu'il subit.
> **Votre taux de blocage doit rester inférieur à 1% pour survivre.**

---

## ⚠️ Facteurs Clés de Succès (KPIs)

1.  **Santé du Numéro (Quality Score)** : Surveillance quotidienne dans le Meta Business Manager. Vert = OK, Jaune = DANGER.
2.  **Latence** : Le Webhook doit répondre en <2s. L'infrastructure (Redis/BullMQ) est critique.
3.  **Précision IA** : Les hallucinations sur les totaux financiers sont inacceptables. Les tests E2E financiers doivent être drastiques.
