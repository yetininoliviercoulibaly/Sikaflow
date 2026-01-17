# 🚀 Guide de Démarrage - Event-Pilot

Bienvenue dans le futur de la gestion d'événements ! **Event-Pilot** transforme votre application de messagerie (WhatsApp ou Telegram) en un véritable assistant de gestion pour votre Club, Festival ou Restaurant.

**Pas d'application à installer. Pas de mots de passe à retenir. Tout se passe dans votre discussion.**

---

## 🏁 1. Pour les Propriétaires (Owners)

### Première Connexion

1. Enregistrez le numéro d'Event-Pilot (WhatsApp) ou trouvez le bot (Telegram).
2. Ouvrez la discussion et envoyez simplement : **"Salut"** 👋
3. L'assistant vous guidera automatiquement :
   - _Assistant_ : "Bienvenue ! Je ne vois pas de compte..."
   - _Vous_ : "Créer le club Midnight Blue"
4. ✅ Vous êtes maintenant **Owner** de votre organisation !

### 🎓 Tutoriel Interactif (Onboarding Coach)

Event-Pilot vous guide à travers **5 étapes clés** pour maîtriser l'outil :

| Étape | Action               | Comment la compléter                |
| :---- | :------------------- | :---------------------------------- |
| 1️⃣    | Bienvenue            | Automatique à la création           |
| 2️⃣    | Première Transaction | "Payé 5000 FCFA pour la glace"      |
| 3️⃣    | Ajouter un Membre    | "Ajoute +22507070707 comme Manager" |
| 4️⃣    | Générer un Rapport   | "Rapport" ou "Flash"                |
| 5️⃣    | Activer l'Abonnement | "Abonnement"                        |

> 💡 L'assistant vous félicite à chaque étape et vous guide vers la suivante !

### Ajouter votre Équipe

Déléguez la saisie sans perdre le contrôle :

> "Ajoute le +22507070707 comme Manager"
> "Ajoute le +33612345678 comme Staff"

| Rôle        | Permissions                                                    |
| :---------- | :------------------------------------------------------------- |
| **Manager** | Opérations, rapports quotidiens, incidents, finances           |
| **Staff**   | Saisie dépenses, signalement incidents (pas d'accès financier) |

### Gérer l'Abonnement

| Commande                 | Action                                     |
| ------------------------ | ------------------------------------------ |
| **"Abonnement"**         | Voir les options et lien de paiement       |
| **"Abonnement mensuel"** | Lien de paiement Stripe/Wave               |
| **"Pass"**               | Activation Event Pass (durée configurable) |

---

## 🎫 2. Gestion d'Événements & Billetterie

### Créer un Événement

> "Créer un événement Soirée VIP le 20 janvier, 100 places à 5000 FCFA"

L'assistant confirme et crée l'événement avec les paramètres spécifiés.

### Générer des Liens de Billets

> "Génère 5 billets pour la Soirée VIP"
> "Génère un billet"

Vous recevez des **liens de réclamation** (format `wa.me/...?text=CLAIM-XXXX`) à partager individuellement avec les bénéficiaires.

**Exemple de réponse** :

```
✅ 5 Liens Générés pour Soirée VIP :

1. https://wa.me/2250707...?text=CLAIM-abc123
2. https://wa.me/2250707...?text=CLAIM-def456
...

Partagez ces liens individuellement avec les bénéficiaires.
```

### Réclamer son Billet (pour les participants)

Le participant clique sur le lien reçu ou envoie manuellement :

> "CLAIM-abc123"

Il reçoit alors son **billet avec QR code unique**.

### Scanner un Billet

Prenez une photo du QR code et envoyez-la avec :

> "Scanner ce billet"
> "Valider"

**Réponses possibles** :

- ✅ **Billet valide** pour Soirée VIP - Bienvenue !
- ❌ **Billet déjà utilisé** (scanné le 20/01 à 21h30)
- ❌ **Billet invalide** (QR non reconnu)

### Vérifier le Stock

> "Stock billets"
> "Combien de places restantes ?"
> "Stock Soirée VIP"

---

## 💼 3. Pour les Managers & Staff

### Enregistrer une Dépense 💸

- **Texte** : "Acheté 10 sacs de glace pour 5000 FCFA"
- **Vocal** 🎙️ : Maintenez le micro et parlez naturellement
- **Photo** 📸 : Photo du reçu + légende "Facture boissons"

> ✅ "Dépense enregistrée : 5000 FCFA (Catégorie: Logistique)"

### Enregistrer une Recette 💰

> "Reçu 150000 FCFA de la vente de tickets"
> "Entrée: sponsoring 500000"

### Signaler un Incident 🚨

> "Bagarre à l'entrée, sécurité intervenue, niveau moyen"
> "Incident critique : coupure électrique générale"
> "Incident bas : problème de caisse"

**Niveaux de sévérité** : `bas`, `moyen`, `élevé`, `critique`

### Demander un Rapport 📊

| Commande                    | Type de rapport       |
| --------------------------- | --------------------- |
| **"Rapport"** / **"Flash"** | Résumé instantané PDF |
| **"Bilan semaine"**         | Rapport hebdomadaire  |
| **"Rapport du jour"**       | Rapport quotidien     |

Vous recevez instantanément un PDF dans la conversation.

---

## ⭐ 4. Feedback Post-Événement

Après chaque événement, les participants reçoivent automatiquement une demande de notation via boutons interactifs :

> "Comment avez-vous trouvé Soirée VIP ?"
>
> ⭐⭐⭐⭐⭐ Génial !
> ⭐⭐⭐⭐ Très bien
> ⭐⭐⭐ Correct
> ⭐⭐ Décevant
> ⭐ Mauvais

Les réponses sont collectées et disponibles dans vos rapports pour améliorer vos futurs événements.

---

## 💡 Commandes Rapides

### Commandes Générales

| Commande           | Action                               |
| :----------------- | :----------------------------------- |
| **"Salut"**        | Menu principal                       |
| **"Aide"**         | Liste des commandes disponibles      |
| **"Solde"**        | Total transactions (Managers/Owners) |
| **"Switch [Nom]"** | Changer d'organisation active        |

### Commandes Financières

| Commande                    | Action                         |
| --------------------------- | ------------------------------ |
| **"Rapport"** / **"Flash"** | Générer rapport PDF instantané |
| **"Bilan semaine"**         | Rapport hebdomadaire           |
| **[Texte de dépense]**      | Enregistrer transaction        |

### Commandes Billetterie

| Commande                              | Action                            |
| ------------------------------------- | --------------------------------- |
| **"Créer événement [Nom] le [Date]"** | Créer un événement                |
| **"Génère [N] billets"**              | Générer liens de réclamation      |
| **"CLAIM-XXXXX"**                     | Réclamer son billet (participant) |
| **"Scanner"** + photo QR              | Valider un billet                 |
| **"Stock billets"**                   | Voir places restantes             |

### Commandes Abonnement

| Commande                 | Action                  |
| ------------------------ | ----------------------- |
| **"Abonnement"**         | Voir les options        |
| **"Abonnement mensuel"** | Souscrire (Stripe/Wave) |
| **"Pass"**               | Activer un Event Pass   |

---

## 🆘 Besoin d'aide ?

Si l'assistant ne comprend pas :

1. **Reformulez** simplement votre demande
2. Tapez **"Aide"** pour voir les commandes
3. Tapez **"Support Humain"** pour être contacté par l'équipe

---

## 🌍 Paiement

Event-Pilot supporte deux modes de paiement :

| Provider   | Zone               | Méthode             |
| ---------- | ------------------ | ------------------- |
| **Stripe** | International      | Carte bancaire      |
| **Wave**   | Afrique de l'Ouest | Mobile Money (FCFA) |

Dites simplement **"Abonnement"** et choisissez votre mode de paiement préféré.
