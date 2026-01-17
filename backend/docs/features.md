Voici la version mise à jour et enrichie de la Documentation Fonctionnelle d'Event-Copilote, intégrant les derniers éléments discutés, notamment le système de reporting automatisé pour le propriétaire.

📑 DOCUMENTATION FONCTIONNELLE : EVENT-COPILOTE (v2.0)

1. VISION DU PRODUIT
   Event-Copilote est un assistant intelligent omnicanal (WhatsApp et Telegram) conçu pour les propriétaires et gestionnaires d'établissements (clubs, restaurants, événements). Il centralise la gestion financière, le suivi opérationnel du staff et la sécurité en temps réel, tout en générant des analyses stratégiques automatisées.

2. ARCHITECTURE & FLUX DE DONNÉES
   L'intelligence repose sur trois piliers :
   Saisie (Input) : Texte, messages vocaux (transcrits via Whisper) et photos (analysées via Vision LLM).
   Traitement (Cerveau) : Extraction d'entités (montants, noms, incidents) et stockage structuré.
   Restitution (Output) : Réponses instantanées, alertes critiques et Rapports Hebdomadaires automatisés.

3. Gestion de l'Organisation & des Membres
   L'objectif ici est de définir qui appartient à quelle entité et quel est son niveau d'accès.
   ID
   En tant que...
   Je veux...
   Afin de...
   US.1
   Propriétaire (Owner)
   Créer une Organisation (ex: "Club XYZ") lors de ma première connexion.
   Devenir l'administrateur principal de cette entité.
   US.2
   Propriétaire
   Ajouter un numéro WhatsApp ou Telegram à mon Organisation en lui attribuant un rôle (Manager ou Staff).
   Déléguer la saisie des données tout en contrôlant les accès.
   US.3
   Système
   Associer chaque message reçu à une organization_id via le numéro de l'expéditeur.
   Garantir que les dépenses loguées vont dans le bon compte.
   US.4
   Membre (Staff/Manager)
   Quitter une Organisation ou être révoqué par le Propriétaire.
   Couper instantanément l'accès aux données de l'entreprise.

4. Interactions Contextuelles (Multi-Plateforme)
   L'IA doit savoir de quel projet on parle sans que l'utilisateur ait à le préciser à chaque message.
   ID
   En tant que...
   Je veux...
   Afin de...
   US.5
   Utilisateur
   Envoyer un vocal ("Payé 100$ pour la sécu").
   Que l'IA enregistre la dépense uniquement pour l'organisation active liée à mon numéro.
   US.6
   Système
   Rejeter toute demande provenant d'un numéro non associé à une Organisation.
   Sécuriser l'outil contre les utilisations non autorisées.
   US.7
   Propriétaire multi-sites
   Envoyer une commande "Switch [Nom du Club]" par WhatsApp ou Telegram.
   Basculer mon contexte de saisie d'un établissement à un autre.

5. Reporting & Confidentialité (Scoping)
   La visibilité des données est désormais filtrée par l'appartenance à l'organisation et le rôle.
   ID
   En tant que...
   Je veux...
   Afin de...
   US.8
   Manager
   Demander le "Flash Report" de fin de soirée.
   Voir les chiffres de mon organisation uniquement.
   US.9
   Propriétaire
   Recevoir un rapport consolidé si je gère plusieurs organisations.
   Avoir une vue d'ensemble sur l'ensemble de mes business.
   US.10
   Système
   Bloquer l'accès aux "Marges Réelles" si le rôle de l'utilisateur est Staff.
   Protéger les informations financières sensibles des employés subalternes.

6. Modèle Économique Hybride (SaaS & Event-Based)
   Le paiement débloque les fonctionnalités au niveau de l'organisation.
   ID
   En tant que...
   Je veux...
   Afin de...
   US.11
   Propriétaire
   Activer un "Pass Événement" pour une durée de 48h.
   Utiliser l'outil ponctuellement pour un concert sans abonnement mensuel.
   US.12
   Propriétaire
   Souscrire à un abonnement mensuel (SaaS) pour mon club.
   Bénéficier d'un accès permanent et de rapports hebdomadaires comparatifs.
   US.13
   Système
   Vérifier le statut de l'organisation (subscription_active ou event_pass_valid) avant de traiter un message.
   Appliquer le modèle de monétisation hybride.

Documentation Fonctionnelle : Event-Copilote (v2.0)

Voici la version mise à jour et enrichie de la Documentation Fonctionnelle d'Event-Copilote, intégrant les derniers éléments discutés, notamment le système de reporting automatisé pour le propriétaire.1. Vision du Produit

Event-Copilote est un assistant intelligent omnicanal (principalement via WhatsApp) conçu pour les propriétaires et gestionnaires d'établissements (clubs, restaurants, événements). Il centralise la gestion financière, le suivi opérationnel du staff et la sécurité en temps réel, tout en générant des analyses stratégiques automatisées.2. Architecture & Flux de Données

L'intelligence repose sur trois piliers :
Saisie (Input) : Texte, messages vocaux (transcrits via Whisper) et photos (analysées via Vision LLM).
Traitement (Cerveau) : Extraction d'entités (montants, noms, incidents) et stockage structuré.
Restitution (Output) : Réponses instantanées, alertes critiques et Rapports Hebdomadaires automatisés. 3. Spécifications Fonctionnelles (User Stories)3.1. Gestion de l'Organisation & des Membres

L'objectif ici est de définir qui appartient à quelle entité et quel est son niveau d'accès.
ID
En tant que...
Je veux...
Afin de...
US.1
Propriétaire (Owner)
Créer une Organisation (ex: "Club XYZ") lors de ma première connexion.
Devenir l'administrateur principal de cette entité.
US.2
Propriétaire
Ajouter un numéro WhatsApp à mon Organisation en lui attribuant un rôle (Manager ou Staff).
Déléguer la saisie des données tout en contrôlant les accès.
US.3
Système
Associer chaque message reçu à une organization_id via le numéro de l'expéditeur.
Garantir que les dépenses loguées vont dans le bon compte.
US.4
Membre (Staff/Manager)
Quitter une Organisation ou être révoqué par le Propriétaire.
Couper instantanément l'accès aux données de l'entreprise.

3.2. Interactions WhatsApp Contextuelles (Multi-Organisation)

L'IA doit savoir de quel projet on parle sans que l'utilisateur ait à le préciser à chaque message.
ID
En tant que...
Je veux...
Afin de...
US.5
Utilisateur
Envoyer un vocal ("Payé 100$ pour la sécu").
Que l'IA enregistre la dépense uniquement pour l'organisation active liée à mon numéro.
US.6
Système
Rejeter toute demande provenant d'un numéro non associé à une Organisation.
Sécuriser l'outil contre les utilisations non autorisées.
US.7
Propriétaire multi-sites
Envoyer une commande "Switch [Nom du Club]" par WhatsApp.
Basculer mon contexte de saisie d'un établissement à un autre.

3.3. Reporting & Confidentialité (Scoping)

La visibilité des données est désormais filtrée par l'appartenance à l'organisation et le rôle.
ID
En tant que...
Je veux...
Afin de...
US.8
Manager
Demander le "Flash Report" de fin de soirée.
Voir les chiffres de mon organisation uniquement.
US.9
Propriétaire
Recevoir un rapport consolidé si je gère plusieurs organisations.
Avoir une vue d'ensemble sur l'ensemble de mes business.
US.10
Système
Bloquer l'accès aux "Marges Réelles" si le rôle de l'utilisateur est Staff.
Protéger les informations financières sensibles des employés subalternes.

3.4. Modèle Économique Hybride (SaaS & Event-Based)

Le paiement débloque les fonctionnalités au niveau de l'organisation.
ID
En tant que...
Je veux...
Afin de...
US.11
Propriétaire
Activer un "Pass Événement" pour une durée de 48h.
Utiliser l'outil ponctuellement pour un concert sans abonnement mensuel.
US.12
Propriétaire
Souscrire à un abonnement mensuel (SaaS) pour mon club.
Bénéficier d'un accès permanent et de rapports hebdomadaires comparatifs.
US.13
Système
Vérifier le statut de l'organisation (subscription_active ou event_pass_valid) avant de traiter un message.
Appliquer le modèle de monétisation hybride.
