import { normalizePhoneNumber, isValidPhone } from './phone-number.util';

describe('normalizePhoneNumber', () => {
  // French numbers
  describe('French phone numbers', () => {
    it('should normalize local French number 0601020304 → +33601020304', () => {
      expect(normalizePhoneNumber('0601020304')).toBe('+33601020304');
    });

    it('should keep already normalized French number +33601020304', () => {
      expect(normalizePhoneNumber('+33601020304')).toBe('+33601020304');
    });

    it('should normalize number without + prefix 33601020304 → +33601020304', () => {
      expect(normalizePhoneNumber('33601020304')).toBe('+33601020304');
    });

    it('should handle spaces 06 01 02 03 04 → +33601020304', () => {
      expect(normalizePhoneNumber('06 01 02 03 04')).toBe('+33601020304');
    });

    it('should handle dashes 06-01-02-03-04 → +33601020304', () => {
      expect(normalizePhoneNumber('06-01-02-03-04')).toBe('+33601020304');
    });

    it('should handle dots 06.01.02.03.04 → +33601020304', () => {
      expect(normalizePhoneNumber('06.01.02.03.04')).toBe('+33601020304');
    });

    it('should handle mixed separators 06 01-02.03 04 → +33601020304', () => {
      expect(normalizePhoneNumber('06 01-02.03 04')).toBe('+33601020304');
    });
  });

  // Senegalese numbers
  describe('Senegalese phone numbers', () => {
    it('should normalize Senegalese number +221771234567', () => {
      expect(normalizePhoneNumber('+221771234567')).toBe('+221771234567');
    });

    it('should normalize local Senegalese with country hint', () => {
      expect(normalizePhoneNumber('771234567', 'SN')).toBe('+221771234567');
    });

    it('should normalize Senegalese number with + prefix', () => {
      // Numbers without + prefix and country hint are ambiguous
      // Use +221 or country hint for reliable parsing
      expect(normalizePhoneNumber('+221771234567')).toBe('+221771234567');
    });
  });

  // Edge cases
  describe('Edge cases and invalid inputs', () => {
    it('should return null for invalid number', () => {
      expect(normalizePhoneNumber('invalid')).toBeNull();
    });

    it('should return null for too short number', () => {
      expect(normalizePhoneNumber('123')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizePhoneNumber('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(normalizePhoneNumber(null as any)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(normalizePhoneNumber(undefined as any)).toBeNull();
    });

    it('should return null for number-only input (non-string)', () => {
      expect(normalizePhoneNumber(601020304 as any)).toBeNull();
    });
  });

  // Other international formats
  describe('Other international formats', () => {
    it('should normalize US number +14155551234', () => {
      expect(normalizePhoneNumber('+14155551234')).toBe('+14155551234');
    });

    it('should normalize UK number +447911123456', () => {
      expect(normalizePhoneNumber('+447911123456')).toBe('+447911123456');
    });
  });
});

describe('isValidPhone', () => {
  it('should return true for valid French number', () => {
    expect(isValidPhone('0601020304')).toBe(true);
  });

  it('should return true for valid international number', () => {
    expect(isValidPhone('+33601020304')).toBe(true);
  });

  it('should return false for invalid number', () => {
    expect(isValidPhone('invalid')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidPhone('')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidPhone(null as any)).toBe(false);
  });
});
