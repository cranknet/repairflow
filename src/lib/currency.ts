/**
 * Currency symbol mapping
 * @deprecated Use getCurrencySymbol from currencies.ts instead
 */
import { getCurrencySymbol as getCurrencySymbolFromCurrencies } from './currencies';

/**
 * Get currency symbol from currency code
 * @param currencyCode - Currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol (e.g., '$', '€')
 * @deprecated Use getCurrencySymbol from currencies.ts instead
 */
export function getCurrencySymbol(currencyCode: string | null | undefined): string {
  return getCurrencySymbolFromCurrencies(currencyCode);
}

