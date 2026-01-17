export class CategoryTranslator {
  private static readonly MAPPING: Record<string, string> = {
    // English -> French (Official)
    'INCOME': 'Recette 💰',
    'EXPENSE': 'Dépense 💸',
    'UNCATEGORIZED': 'Non classé ❓',
    
    // Common LLM Outputs (Food/Transport/etc)
    'FOOD': 'Alimentation 🍔',
    'DRINK': 'Boisson 🍺',
    'TRANSPORT': 'Transport 🚕',
    'SALARY': 'Salaires 👥',
    'MARKETING': 'Marketing 📢',
    'SUPPLIES': 'Fournitures 📦',
    'RENT': 'Loyer 🏠',
    'UTILITIES': 'Factures (Eau/Elec) 💡',
    'MAINTENANCE': 'Entretien 🛠️',
    'SECURITY': 'Sécurité 🛡️',
    'EQUIPMENT': 'Équipement 🖥️',
    'TAX': 'Impôts & Taxes 🏛️',
    'INSURANCE': 'Assurance 📝',
    'EVENT': 'Événement 🎉',
    'TICKET': 'Billetterie 🎫',
    'OTHER': 'Autre 🔄'
  };

  /**
   * Translates a category or type key into a user-friendly French label with emoji.
   * Case insensitive. Returns the key itself if no translation is found.
   */
  static translate(key: string | null | undefined): string {
    if (!key) return 'Non classé ❓';
    
    const normalizedKey = key.toUpperCase().trim();
    return this.MAPPING[normalizedKey] || key;
  }
}
