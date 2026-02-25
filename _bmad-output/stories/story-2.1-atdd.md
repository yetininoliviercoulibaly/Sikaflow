# ATDD — Story 2.1 : Enregistrement de Dépense par Message

## Stratégie de Test

Story 100% ZeroClaw (system prompt + tool YAML). Aucun code backend à tester.
Les tests couvrent uniquement la **logique de conversation** et le **contrat du tool YAML**.

| Couche | Approche | Raison |
|--------|----------|--------|
| Extraction IA | Tests comportementaux (scénarios Gherkin) | ZeroClaw gère le LLM |
| Tool YAML | Validation de schéma (structure, types, exemples) | Contrat API statique |
| Flux de confirmation | Scénarios Gherkin | Logique conversationnelle |
| Backend `POST /transactions` | Couvert par tests existants | Déjà validé dans stories antérieures |

---

## Matrice ATDD

| ID | Scénario | AC | Type | Cible |
|---|---|---|---|---|
| T2.1-01 | Dépense standard extraite et confirmée | AC#1, #2 | Comportemental | ZeroClaw extraction + confirmation |
| T2.1-02 | Dépense confirmée → POST /transactions appelé | AC#2 | Contrat | Tool YAML record-expense |
| T2.1-03 | Annulation par l'utilisateur | AC#3 | Comportemental | Flux annulation |
| T2.1-04 | Message ambigu (montant + description) | AC#4 | Comportemental | Extraction partielle |
| T2.1-05 | Montant absent → question de clarification | AC#5 | Comportemental | Fallback extraction |
| T2.1-06 | Catégorie auto-déduite depuis description | AC#1 | Comportemental | Mapping catégories |

---

## Scénarios Gherkin

### T2.1-01 — Dépense standard

```gherkin
Scenario: Enregistrement d'une dépense standard avec confirmation
  Given un utilisateur identifié (session.activeOrgId défini)
  And il envoie "Dépense 5000 pour les boissons"
  When ZeroClaw reçoit le message
  Then il extrait amount=5000, type=EXPENSE, description="boissons", category="Boissons"
  And il répond "J'enregistre une dépense de 5 000 FCFA pour les boissons. Correct ?"
  And aucune API n'est appelée avant confirmation
```

### T2.1-02 — Appel POST /transactions après confirmation

```gherkin
Scenario: POST /transactions appelé après confirmation positive
  Given ZeroClaw a extrait { amount: 5000, type: EXPENSE, category: "Boissons", description: "boissons" }
  And il a demandé confirmation
  When l'utilisateur répond "oui"
  Then ZeroClaw appelle POST /transactions avec {
    phoneNumber: <phone_utilisateur>,
    amount: 5000,
    type: "EXPENSE",
    category: "Boissons",
    description: "boissons"
  }
  And il répond "✅ Dépense de 5 000 FCFA enregistrée"
```

### T2.1-03 — Annulation

```gherkin
Scenario: Annulation de la dépense avant enregistrement
  Given ZeroClaw a demandé confirmation pour une dépense de 5000 FCFA
  When l'utilisateur répond "non" ou "annule"
  Then POST /transactions n'est PAS appelé
  And ZeroClaw répond "D'accord, on annule. Dis-moi si tu veux modifier."
```

### T2.1-04 — Message ambigu

```gherkin
Scenario: Message ambigu sans le mot "dépense"
  Given un utilisateur identifié
  And il envoie "5000 boissons"
  When ZeroClaw reçoit le message
  Then il infère une dépense (pas un revenu) depuis le contexte
  And il demande confirmation "J'enregistre une dépense de 5 000 FCFA pour les boissons. Correct ?"
```

### T2.1-05 — Montant absent

```gherkin
Scenario: Message sans montant identifiable
  Given un utilisateur identifié
  And il envoie "Dépense boissons"
  When ZeroClaw ne peut pas extraire de montant
  Then il répond "Je n'ai pas compris le montant. Combien as-tu dépensé ?"
  And aucune API n'est appelée
```

### T2.1-06 — Mapping catégorie automatique

```gherkin
Scenario: Catégorie déduite automatiquement depuis la description
  Given un message "Payé 15000 au DJ"
  When ZeroClaw extrait les données
  Then category est "Staff"
  And description est "DJ"

  Given un message "Dépense 3000 pour le transport"
  When ZeroClaw extrait les données
  Then category est "Transport"

  Given un message "Dépense 2000 pour des trucs"
  When ZeroClaw ne reconnaît pas de catégorie
  Then category est "Général"
```

---

## Contrat Tool YAML — `record-expense.tool.yaml`

Structure attendue :

```yaml
name: record_expense
type: http_request
config:
  method: POST
  url: "{{SIKAFLOW_API_URL}}/transactions"
  headers:
    X-API-Key: "{{SIKAFLOW_API_KEY}}"
parameters:
  - name: phone_number    # required, string E.164
  - name: amount          # required, number, > 0
  - name: category        # required, string
  - name: description     # optional, string
response_schema:
  type: object
  properties:
    id: string
    amount: number
    type: string  # "EXPENSE"
    category: string
    description: string | null
    createdAt: string
```

---

## Critères de Validation

| Critère | Méthode | Attendu |
|---|---|---|
| Structure `record-expense.tool.yaml` valide | Lecture manuelle | Champs requis présents |
| `type` fixé à `"EXPENSE"` dans le body | Inspection YAML | `type: EXPENSE` en valeur fixe ou param |
| `phoneNumber` transmis (contexte session) | Scénario T2.1-02 | Champ présent dans appel API |
| Aucun appel API avant confirmation | Scénario T2.1-01 | POST non appelé au message initial |
| Annulation propre | Scénario T2.1-03 | Aucun POST émis |
