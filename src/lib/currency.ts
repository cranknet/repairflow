/**
 * Currency symbol mapping
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  CNY: '¥',
  INR: '₹',
  SAR: 'ر.س',
  AED: 'د.إ',
  EGP: 'E£',
};

/**
 * Get currency symbol from currency code
 * @param currencyCode - Currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol (e.g., '$', '€')
 */
export function getCurrencySymbol(currencyCode: string | null | undefined): string {
  if (!currencyCode) {
    return '$'; // Default to USD
  }
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
}

