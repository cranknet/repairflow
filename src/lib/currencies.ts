/**
 * Comprehensive list of currencies with their symbols and names
 */
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string; // Country flag emoji
}

export const CURRENCIES: Currency[] = [
  // Major currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  
  // Middle East
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', flag: '🇯🇴' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', flag: '🇮🇷' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', flag: '🇮🇶' },
  
  // Asia Pacific
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', flag: '🇳🇵' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', flag: '🇲🇲' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', flag: '🇰🇭' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', flag: '🇱🇦' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', flag: '🇲🇳' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  
  // Europe
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', flag: '🇷🇸' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', symbol: 'KM', flag: '🇧🇦' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', flag: '🇲🇰' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'Lek', flag: '🇦🇱' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', flag: '🇮🇸' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', flag: '🇧🇾' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', flag: '🇲🇩' },
  
  // Americas
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', flag: '🇺🇾' },
  { code: 'VES', name: 'Venezuelan Bolivar', symbol: 'Bs', flag: '🇻🇪' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.', flag: '🇧🇴' },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', flag: '🇵🇾' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', flag: '🇬🇹' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', flag: '🇭🇳' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', flag: '🇳🇮' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', flag: '🇨🇷' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', flag: '🇵🇦' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', flag: '🇩🇴' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', flag: '🇯🇲' },
  { code: 'TTD', name: 'Trinidad & Tobago Dollar', symbol: 'TT$', flag: '🇹🇹' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$', flag: '🇧🇧' },
  
  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', flag: '🇪🇹' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', flag: '🇲🇦' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', flag: '🇹🇳' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', flag: '🇩🇿' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', flag: '🌍' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', flag: '🌍' },
];

/**
 * Get currency by code
 */
export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode: string | null | undefined): string {
  if (!currencyCode) {
    return '$'; // Default to USD
  }
  const currency = getCurrencyByCode(currencyCode.toUpperCase());
  return currency?.symbol || currencyCode;
}

