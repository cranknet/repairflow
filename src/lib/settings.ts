import { prisma } from '@/lib/prisma';

// ===== Core Helper Functions =====

/**
 * Get a setting value from the database
 * @param key The setting key
 * @param defaultValue The default value if setting is not found
 * @returns The setting value or default
 */
export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key },
    });
    return setting?.value ?? defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Get a boolean setting value from the database
 */
export async function getBooleanSetting(key: string, defaultValue: boolean = false): Promise<boolean> {
  const value = await getSetting(key, defaultValue.toString());
  return value === 'true' || value === '1';
}

/**
 * Get a number setting value from the database
 */
export async function getNumberSetting(key: string, defaultValue: number = 0): Promise<number> {
  const value = await getSetting(key, defaultValue.toString());
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Set a setting value in the database
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/**
 * Get multiple settings at once
 */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    const settings = await prisma.settings.findMany({
      where: { key: { in: keys } },
    });
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}

// ===== Ticket Settings =====

export interface TicketSettingsResult {
  autoMarkAsPaid: boolean;
  requireDevicePhotos: boolean;
  requireEstimatedPrice: boolean;
  requireStatusNotes: boolean;
  autoAssignEnabled: boolean;
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  ticketNumberPrefix: string;
  autoCloseAfterDays: number;
  allowPriceBelowEstimate: boolean;
}

export async function getTicketSettings(): Promise<TicketSettingsResult> {
  const settings = await getSettings([
    'auto_mark_tickets_as_paid',
    'require_device_photos',
    'require_estimated_price',
    'status_transition_notes_required',
    'auto_assign_enabled',
    'default_priority',
    'ticket_number_prefix',
    'auto_close_after_days',
    'allow_price_below_estimate',
  ]);

  return {
    autoMarkAsPaid: settings.auto_mark_tickets_as_paid === 'true',
    requireDevicePhotos: settings.require_device_photos === 'true',
    requireEstimatedPrice: settings.require_estimated_price !== 'false', // default true
    requireStatusNotes: settings.status_transition_notes_required === 'true',
    autoAssignEnabled: settings.auto_assign_enabled === 'true',
    defaultPriority: (settings.default_priority as TicketSettingsResult['defaultPriority']) || 'MEDIUM',
    ticketNumberPrefix: settings.ticket_number_prefix || 'T',
    autoCloseAfterDays: parseInt(settings.auto_close_after_days || '0', 10),
    allowPriceBelowEstimate: settings.allow_price_below_estimate !== 'false', // default true
  };
}

export async function shouldAutoMarkTicketsAsPaid(): Promise<boolean> {
  return getBooleanSetting('auto_mark_tickets_as_paid', false);
}

// ===== Warranty & Returns Settings =====

export interface WarrantySettingsResult {
  enableWarrantyTracking: boolean;
  defaultWarrantyDays: number;
  defaultWarrantyText: string;
  returnWindowDays: number;
  returnRequireApproval: boolean;
  returnPartialRefund: boolean;
  returnRestockInventory: boolean;
}

export async function getWarrantySettings(): Promise<WarrantySettingsResult> {
  const settings = await getSettings([
    'enable_warranty_tracking',
    'default_warranty_days',
    'default_warranty_text',
    'return_window_days',
    'return_require_approval',
    'return_partial_refund',
    'return_restock_inventory',
  ]);

  return {
    enableWarrantyTracking: settings.enable_warranty_tracking !== 'false', // default true
    defaultWarrantyDays: parseInt(settings.default_warranty_days || '30', 10),
    defaultWarrantyText: settings.default_warranty_text || 'Standard warranty applies',
    returnWindowDays: parseInt(settings.return_window_days || '14', 10),
    returnRequireApproval: settings.return_require_approval !== 'false', // default true
    returnPartialRefund: settings.return_partial_refund === 'true',
    returnRestockInventory: settings.return_restock_inventory !== 'false', // default true
  };
}

// ===== Inventory Settings =====

export interface InventorySettingsResult {
  inventoryTrackingEnabled: boolean;
  autoDeductParts: boolean;
  allowNegativeStock: boolean;
  lowStockNotifications: boolean;
  lowStockThreshold: number;
  defaultReorderLevel: number;
  requireSupplier: boolean;
}

export async function getInventorySettings(): Promise<InventorySettingsResult> {
  const settings = await getSettings([
    'inventory_tracking_enabled',
    'auto_deduct_parts',
    'allow_negative_stock',
    'low_stock_notifications',
    'low_stock_threshold',
    'default_reorder_level',
    'require_supplier',
  ]);

  return {
    inventoryTrackingEnabled: settings.inventory_tracking_enabled !== 'false', // default true
    autoDeductParts: settings.auto_deduct_parts === 'true',
    allowNegativeStock: settings.allow_negative_stock === 'true',
    lowStockNotifications: settings.low_stock_notifications !== 'false', // default true
    lowStockThreshold: parseInt(settings.low_stock_threshold || '5', 10),
    defaultReorderLevel: parseInt(settings.default_reorder_level || '10', 10),
    requireSupplier: settings.require_supplier === 'true',
  };
}

// ===== Finance Settings =====

export interface FinanceSettingsResult {
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: 'before' | 'after';
  taxEnabled: boolean;
  taxRate: number;
  taxLabel: string;
  taxIncluded: boolean;
  acceptCash: boolean;
  acceptCard: boolean;
  acceptMobile: boolean;
  defaultPaymentMethod: string;
  diagnosticFeeEnabled: boolean;
  diagnosticFeeAmount: number;
  rushFeeEnabled: boolean;
  rushFeeAmount: number;
}

export async function getFinanceSettings(): Promise<FinanceSettingsResult> {
  const settings = await getSettings([
    'currency_symbol',
    'currency_code',
    'currency_position',
    'tax_enabled',
    'tax_rate',
    'tax_label',
    'tax_included',
    'accept_cash',
    'accept_card',
    'accept_mobile',
    'default_payment_method',
    'diagnostic_fee_enabled',
    'diagnostic_fee_amount',
    'rush_fee_enabled',
    'rush_fee_amount',
  ]);

  return {
    currencySymbol: settings.currency_symbol || '$',
    currencyCode: settings.currency_code || 'USD',
    currencyPosition: (settings.currency_position as 'before' | 'after') || 'before',
    taxEnabled: settings.tax_enabled === 'true',
    taxRate: parseFloat(settings.tax_rate || '0'),
    taxLabel: settings.tax_label || 'Tax',
    taxIncluded: settings.tax_included === 'true',
    acceptCash: settings.accept_cash !== 'false', // default true
    acceptCard: settings.accept_card !== 'false', // default true
    acceptMobile: settings.accept_mobile === 'true',
    defaultPaymentMethod: settings.default_payment_method || 'CASH',
    diagnosticFeeEnabled: settings.diagnostic_fee_enabled === 'true',
    diagnosticFeeAmount: parseFloat(settings.diagnostic_fee_amount || '0'),
    rushFeeEnabled: settings.rush_fee_enabled === 'true',
    rushFeeAmount: parseFloat(settings.rush_fee_amount || '0'),
  };
}

/**
 * Format a price with currency settings
 */
export async function formatPrice(amount: number): Promise<string> {
  const { currencySymbol, currencyPosition } = await getFinanceSettings();
  const formattedAmount = amount.toFixed(2);
  return currencyPosition === 'before'
    ? `${currencySymbol}${formattedAmount}`
    : `${formattedAmount}${currencySymbol}`;
}

// ===== Tracking Settings =====

export interface TrackingSettingsResult {
  trackingEnabled: boolean;
  showPriceOnTracking: boolean;
  showNotesOnTracking: boolean;
  showEtaOnTracking: boolean;
  showContactForm: boolean;
  showPhoneOnTracking: boolean;
  showTechnicianOnTracking: boolean;
  satisfactionRatingEnabled: boolean;
  trackingWelcomeMessage: string;
  trackingCompletionMessage: string;
}

export async function getTrackingSettings(): Promise<TrackingSettingsResult> {
  const settings = await getSettings([
    'tracking_enabled',
    'show_price_on_tracking',
    'show_notes_on_tracking',
    'show_eta_on_tracking',
    'show_contact_form',
    'show_phone_on_tracking',
    'show_technician_on_tracking',
    'satisfaction_rating_enabled',
    'tracking_welcome_message',
    'tracking_completion_message',
  ]);

  return {
    trackingEnabled: settings.tracking_enabled !== 'false', // default true
    showPriceOnTracking: settings.show_price_on_tracking === 'true',
    showNotesOnTracking: settings.show_notes_on_tracking === 'true',
    showEtaOnTracking: settings.show_eta_on_tracking !== 'false', // default true
    showContactForm: settings.show_contact_form !== 'false', // default true
    showPhoneOnTracking: settings.show_phone_on_tracking !== 'false', // default true
    showTechnicianOnTracking: settings.show_technician_on_tracking === 'true',
    satisfactionRatingEnabled: settings.satisfaction_rating_enabled !== 'false', // default true
    trackingWelcomeMessage: settings.tracking_welcome_message || 'Track your repair status',
    trackingCompletionMessage: settings.tracking_completion_message || 'Your repair is complete! Please pick up your device.',
  };
}

// ===== Security Settings =====

export interface SecuritySettingsResult {
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
}

export async function getSecuritySettings(): Promise<SecuritySettingsResult> {
  const settings = await getSettings([
    'password_min_length',
    'require_uppercase',
    'require_number',
    'require_special_char',
    'session_timeout',
    'max_login_attempts',
    'lockout_duration',
  ]);

  return {
    passwordMinLength: parseInt(settings.password_min_length || '8', 10),
    requireUppercase: settings.require_uppercase !== 'false', // default true
    requireNumber: settings.require_number !== 'false', // default true
    requireSpecialChar: settings.require_special_char === 'true',
    sessionTimeout: parseInt(settings.session_timeout || '60', 10),
    maxLoginAttempts: parseInt(settings.max_login_attempts || '5', 10),
    lockoutDuration: parseInt(settings.lockout_duration || '15', 10),
  };
}

/**
 * Validate a password against security settings
 */
export async function validatePassword(password: string): Promise<{ valid: boolean; errors: string[] }> {
  const settings = await getSecuritySettings();
  const errors: string[] = [];

  if (password.length < settings.passwordMinLength) {
    errors.push(`Password must be at least ${settings.passwordMinLength} characters`);
  }
  if (settings.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (settings.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (settings.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

// ===== Print Settings =====

export interface PrintSettingsResult {
  labelSize: string;
  printBarcode: boolean;
  printQrCode: boolean;
  invoiceSize: string;
  showLogoOnInvoice: boolean;
  showTermsOnInvoice: boolean;
  invoiceFooter: string;
  invoicePrefix: string;
  autoPrintOnPayment: boolean;
}

export async function getPrintSettings(): Promise<PrintSettingsResult> {
  const settings = await getSettings([
    'print_label_size',
    'print_barcode',
    'print_qr_code',
    'print_invoice_size',
    'show_logo_on_invoice',
    'show_terms_on_invoice',
    'invoice_footer',
    'invoice_prefix',
    'auto_print_on_payment',
  ]);

  return {
    labelSize: settings.print_label_size || '40x20',
    printBarcode: settings.print_barcode !== 'false', // default true
    printQrCode: settings.print_qr_code !== 'false', // default true
    invoiceSize: settings.print_invoice_size || '80x120',
    showLogoOnInvoice: settings.show_logo_on_invoice !== 'false', // default true
    showTermsOnInvoice: settings.show_terms_on_invoice === 'true',
    invoiceFooter: settings.invoice_footer || 'Thank you for your business!',
    invoicePrefix: settings.invoice_prefix || 'INV',
    autoPrintOnPayment: settings.auto_print_on_payment === 'true',
  };
}

