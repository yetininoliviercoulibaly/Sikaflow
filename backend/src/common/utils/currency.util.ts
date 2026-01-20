/**
 * Retrieves the application's configured currency.
 * Prioritizes process.env.CURRENCY, then process.env.DEFAULT_CURRENCY, defaulting to 'EUR'.
 */
export function getCurrency(): string {
  return process.env.CURRENCY || process.env.DEFAULT_CURRENCY || 'EUR';
}
