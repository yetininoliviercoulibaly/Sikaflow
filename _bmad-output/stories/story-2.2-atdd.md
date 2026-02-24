# ATDD — Story 2.2 : Enregistrement de Revenu par Message

## Stratégie de Test

Story 100% ZeroClaw. Même approche que Story 2.1 : tests comportementaux + contrat YAML.

| Couche | Approche |
|--------|----------|
| Extraction IA revenus | Scénarios Gherkin |
| Ambiguïté dépense/revenu | Scénarios Gherkin |
| Tool YAML `record-income` | Validation de schéma |
| Backend `POST /transactions` | Couvert par tests existants |

---

## Matrice ATDD

| ID | Scénario | AC | Type |
|---|---|---|---|
| T2.2-01 | Revenu standard → enregistrement direct | AC#1 | Comportemental |
| T2.2-02 | POST /transactions appelé avec type=INCOME | AC#1 | Contrat YAML |
| T2.2-03 | Message ambigu → confirmation demandée | AC#2 | Comportemental |
| T2.2-04 | Annulation après confirmation | AC#3 | Comportemental |
| T2.2-05 | Montant absent → question courte | AC#4 | Comportemental |
| T2.2-06 | Ambiguïté dépense/revenu | AC#5 | Comportemental |
| T2.2-07 | Catégorie auto-déduite depuis description | AC#1 | Comportemental |

---

## Scénarios Gherkin

### T2.2-01 — Revenu standard, enregistrement direct

```gherkin
Scenario: Revenu clair → enregistrement immédiat
  Given un utilisateur identifié (session.activeOrgId défini)
  And il envoie "Reçu 25000 vente de billets"
  When ZeroClaw reçoit le message
  Then il extrait amount=25000, type=INCOME, description="vente de billets", category="Ventes"
  And appelle immédiatement record_income (sans demander confirmation)
  And répond "✅ Revenu de 25 000 FCFA pour vente de billets enregistré"
```

### T2.2-02 — Contrat POST /transactions avec type=INCOME

```gherkin
Scenario: Tool record_income appelle POST /transactions correctement
  Given ZeroClaw a extrait un revenu de 25000 FCFA
  When il appelle record_income
  Then POST /transactions reçoit {
    phoneNumber: <phone_utilisateur>,
    amount: 25000,
    type: "INCOME",
    category: "Ventes",
    description: "vente de billets"
  }
```

### T2.2-03 — Message ambigu

```gherkin
Scenario: Message de revenu avec interprétation incertaine
  Given un utilisateur identifié
  And il envoie "Encaissé hier"
  When ZeroClaw ne peut pas extraire le montant
  Then il demande "Combien as-tu encaissé ?"
  And aucune API n'est appelée
```

### T2.2-04 — Annulation après confirmation

```gherkin
Scenario: Annulation d'un revenu ambigu
  Given ZeroClaw a demandé confirmation pour un revenu de 25000 FCFA
  When l'utilisateur répond "non"
  Then record_income n'est PAS appelé
  And ZeroClaw répond "D'accord, dis-moi ce que tu veux corriger."
```

### T2.2-05 — Montant absent

```gherkin
Scenario: Revenu sans montant
  Given un utilisateur envoie "J'ai vendu des billets"
  When ZeroClaw ne trouve pas de montant
  Then il répond "Combien as-tu encaissé ?"
  And attend la réponse avant d'enregistrer
```

### T2.2-06 — Ambiguïté dépense/revenu

```gherkin
Scenario: Message sans indicateur de direction
  Given un utilisateur envoie "25000 boissons"
  When ZeroClaw ne peut pas déterminer si c'est une entrée ou une sortie
  Then il demande "C'est une entrée ou une sortie d'argent ?"
  And attend la réponse pour orienter vers record_expense ou record_income
```

### T2.2-07 — Catégories revenus

```gherkin
Scenario: Catégorie déduite selon la description
  Given "Reçu 50000 pour une prestation"
  Then category = "Services"

  Given "Vendu 10000 de marchandise"
  Then category = "Ventes"

  Given "Reçu 30000 loyer local"
  Then category = "Location"

  Given "Reçu 5000 cadeau client"
  Then category = "Général"
```

---

## Contrat Tool YAML — `record-income.tool.yaml`

```yaml
name: record_income
type: http_request
config:
  method: POST
  url: "{{SIKAFLOW_API_URL}}/transactions"
  body:
    type: "INCOME"   # Valeur fixe — jamais EXPENSE
parameters:
  - name: phone_number   # required
  - name: amount         # required, number > 0
  - name: category       # required (Ventes / Services / Location / Général)
  - name: description    # optional
```
