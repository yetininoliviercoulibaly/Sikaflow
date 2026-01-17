import { parsePhoneNumber, CountryCode, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Default country code for local phone number parsing.
 * Can be overridden via DEFAULT_PHONE_COUNTRY environment variable.
 */
const DEFAULT_COUNTRY: CountryCode = (process.env.DEFAULT_PHONE_COUNTRY as CountryCode) || 'FR';

/**
 * Normalizes a phone number to E.164 international format.
 * 
 * @param phone - The phone number to normalize (can be local or international)
 * @param defaultCountry - Country code hint for local numbers (default: FR)
 * @returns Normalized E.164 phone number (e.g., +33601020304) or null if invalid
 * 
 * @example
 * normalizePhoneNumber('0601020304') // Returns '+33601020304'
 * normalizePhoneNumber('+33601020304') // Returns '+33601020304'
 * normalizePhoneNumber('06 01 02 03 04') // Returns '+33601020304'
 * normalizePhoneNumber('771234567', 'SN') // Returns '+221771234567'
 * normalizePhoneNumber('invalid') // Returns null
 */
export function normalizePhoneNumber(
  phone: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Clean the input: remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  try {
    // Try parsing with the default country hint
    const parsed = parsePhoneNumber(cleaned, defaultCountry);

    if (parsed && parsed.isValid()) {
      return parsed.number; // E.164 format
    }

    // If parsing failed with default country, try without (for fully international numbers)
    if (cleaned.startsWith('+') || cleaned.length > 10) {
      const parsedIntl = parsePhoneNumber(cleaned);
      if (parsedIntl && parsedIntl.isValid()) {
        return parsedIntl.number;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a phone number is valid.
 * 
 * @param phone - The phone number to validate
 * @param defaultCountry - Country code hint for local numbers
 * @returns true if valid, false otherwise
 */
export function isValidPhone(
  phone: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  try {
    return isValidPhoneNumber(cleaned, defaultCountry);
  } catch {
    return false;
  }
}
