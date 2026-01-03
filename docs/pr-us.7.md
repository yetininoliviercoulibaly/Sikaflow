# Code Review : US.7 (Switch Organization)

## Synthèse

L'User Story US.7 permet à un utilisateur multi-organisations de changer son contexte actif par une commande textuelle. L'implémentation a été auditée et est validée.

## 1. Analyse Technique & Architecture

### Respect des Patterns

- **Hexagonal Architecture** : Le Use Case `SwitchOrganizationUseCase` est correctement isolé dans la couche `application` et dépend des ports (`I_ORGANIZATION_REPOSITORY`, `I_USER_REPOSITORY`). Le couplage est faible.
- **Injection de Dépendances** : Correcte.
- **Gestion des Erreurs** : Les cas limites (User not found, User has no orgs, Org not found) sont couverts par des `NotFoundException` appropriées, garantissant que l'utilisateur reçoit un feedback clair.

### Qualité du Code

- Le code est concis et lisible.
- La recherche des organisations de l'utilisateur (`findOrganizationsForUser`) sécurise intrinsèquement la fonctionnalité : il est impossible de switcher vers une organisation dont on n'est pas membre.

## 2. Analyse Fonctionnelle (US.7)

### Matching des Noms

L'implémentation propose une stratégie à deux niveaux :

1.  **Correspondance Exacte** (Case insensitive) : Prioritaire.
2.  **Correspondance "Fuzzy"** (`includes`) : Secondaire.

> [!NOTE] > **Point d'Attention (Ambiguïté)** : Si un utilisateur appartient à "Club Paris" et "Club Paris Est", et qu'il tape "Switch Paris", l'algorithme sélectionnera le premier trouvé dans la liste (ordre non garanti ou insertion).
> _Recommandation_ : Pour une V2, si plusieurs résultats "Fuzzy" sont trouvés, le système devrait idéalement demander une clarification (ex: "Voulez-vous dire A ou B ?"). Pour l'instant, le comportement est acceptable.

### Sécurité

- **Context Isolation** : La mise à jour du `lastActiveOrganizationId` est sécurisée par la vérification d'appartenance préalable.
- **Privacy** : Le message d'erreur "Organization ... not found in your list" est correct et ne révèle pas l'existence d'organisations tierces.

## 3. Script de Vérification

Le script `src/scripts/verify-us7.ts` couvre bien les scénarios nominaux :

- Création de contexte multi-org.
- Switch nominal (Nom exact).
- Switch fuzzy (Partie du nom).
- Vérification de la persistance en base.

## Conclusion

Implémentation **VALIDÉE**. Prêt pour intégration au flux conversationnel (LLM).
