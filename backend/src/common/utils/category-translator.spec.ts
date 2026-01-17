import { CategoryTranslator } from './category-translator';

describe('CategoryTranslator', () => {
  it('should translate standard types correctly', () => {
    expect(CategoryTranslator.translate('INCOME')).toBe('Recette 💰');
    expect(CategoryTranslator.translate('EXPENSE')).toBe('Dépense 💸');
  });

  it('should translate common categories correctly', () => {
    expect(CategoryTranslator.translate('FOOD')).toBe('Alimentation 🍔');
    expect(CategoryTranslator.translate('food')).toBe('Alimentation 🍔'); // Case insensitive
    expect(CategoryTranslator.translate('Transport')).toBe('Transport 🚕');
  });

  it('should handle null or undefined', () => {
    expect(CategoryTranslator.translate(null)).toBe('Non classé ❓');
    expect(CategoryTranslator.translate(undefined)).toBe('Non classé ❓');
  });

  it('should return original key if no translation found', () => {
    expect(CategoryTranslator.translate('CustomCategory')).toBe('CustomCategory');
  });

  it('should handle whitespace', () => {
    expect(CategoryTranslator.translate('  rent  ')).toBe('Loyer 🏠');
  });
});
