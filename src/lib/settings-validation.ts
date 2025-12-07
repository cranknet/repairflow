import { z } from 'zod';

// ===== Ticket Settings =====
export const ticketSettingsSchema = z.object({
    auto_mark_tickets_as_paid: z.enum(['true', 'false']).default('false'),
    require_device_photos: z.enum(['true', 'false']).default('false'),
    require_estimated_price: z.enum(['true', 'false']).default('true'),
    require_status_notes: z.enum(['true', 'false']).default('false'),
    auto_assign_creator: z.enum(['true', 'false']).default('true'),
    default_priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    ticket_prefix: z.string().min(1).max(5).default('T'),
    enable_auto_close: z.enum(['true', 'false']).default('false'),
    auto_close_days: z.string().regex(/^\d+$/).default('30'),
    allow_price_below_estimate: z.enum(['true', 'false']).default('true'),
});

export type TicketSettings = z.infer<typeof ticketSettingsSchema>;

// ===== Warranty Settings =====
export const warrantySettingsSchema = z.object({
    enable_warranty_tracking: z.enum(['true', 'false']).default('true'),
    default_warranty_days: z.string().regex(/^\d+$/).default('30'),
    default_warranty_text: z.string().max(500).default('Standard 30-day warranty on parts and labor'),
    return_window_days: z.string().regex(/^\d+$/).default('14'),
    require_return_approval: z.enum(['true', 'false']).default('true'),
    allow_partial_refunds: z.enum(['true', 'false']).default('true'),
    auto_restock_returns: z.enum(['true', 'false']).default('true'),
});

export type WarrantySettings = z.infer<typeof warrantySettingsSchema>;

// ===== Inventory Settings =====
export const inventorySettingsSchema = z.object({
    enable_inventory_tracking: z.enum(['true', 'false']).default('true'),
    auto_deduct_parts: z.enum(['true', 'false']).default('true'),
    allow_negative_stock: z.enum(['true', 'false']).default('false'),
    enable_low_stock_alerts: z.enum(['true', 'false']).default('true'),
    default_low_stock_threshold: z.string().regex(/^\d+$/).default('5'),
    default_reorder_level: z.string().regex(/^\d+$/).default('10'),
    require_supplier: z.enum(['true', 'false']).default('false'),
});

export type InventorySettings = z.infer<typeof inventorySettingsSchema>;

// ===== Finance Settings =====
export const financeSettingsSchema = z.object({
    currency_code: z.string().min(2).max(4).default('USD'),
    currency_symbol: z.string().min(1).max(5).default('$'),
    currency_position: z.enum(['before', 'after']).default('before'),
    enable_tax: z.enum(['true', 'false']).default('false'),
    tax_rate: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
    tax_label: z.string().max(50).default('Tax'),
    prices_include_tax: z.enum(['true', 'false']).default('false'),
    accept_cash: z.enum(['true', 'false']).default('true'),
    accept_card: z.enum(['true', 'false']).default('true'),
    accept_mobile: z.enum(['true', 'false']).default('true'),
    enable_diagnostic_fee: z.enum(['true', 'false']).default('false'),
    diagnostic_fee: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
    enable_rush_fee: z.enum(['true', 'false']).default('false'),
    rush_fee: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
});

export type FinanceSettings = z.infer<typeof financeSettingsSchema>;

// ===== Print Settings =====
export const printSettingsSchema = z.object({
    label_size: z.enum(['1x1', '2x1', '2x2']).default('2x1'),
    print_qr_code: z.enum(['true', 'false']).default('true'),
    print_barcode: z.enum(['true', 'false']).default('false'),
    invoice_prefix: z.string().max(10).default('INV-'),
    show_logo_on_invoice: z.enum(['true', 'false']).default('true'),
    show_terms_on_invoice: z.enum(['true', 'false']).default('true'),
    invoice_terms: z.string().max(1000).default('Payment is due upon receipt of device.'),
    invoice_footer: z.string().max(500).default('Thank you for your business!'),
    invoice_thank_you: z.string().max(200).default('Thank you for choosing us!'),
});

export type PrintSettings = z.infer<typeof printSettingsSchema>;

// ===== Tracking Settings =====
export const trackingSettingsSchema = z.object({
    enable_public_tracking: z.enum(['true', 'false']).default('true'),
    show_price_on_tracking: z.enum(['true', 'false']).default('false'),
    show_notes_on_tracking: z.enum(['true', 'false']).default('false'),
    show_eta_on_tracking: z.enum(['true', 'false']).default('true'),
    tracking_welcome_message: z.string().max(500).default('Track your repair status'),
    tracking_completion_message: z.string().max(500).default('Your repair is complete! Please pick up your device.'),
    show_contact_form: z.enum(['true', 'false']).default('true'),
    show_phone_on_tracking: z.enum(['true', 'false']).default('true'),
});

export type TrackingSettings = z.infer<typeof trackingSettingsSchema>;

// ===== Security Settings =====
export const securitySettingsSchema = z.object({
    password_min_length: z.string().regex(/^\d+$/).default('8'),
    require_uppercase: z.enum(['true', 'false']).default('true'),
    require_number: z.enum(['true', 'false']).default('true'),
    require_special_char: z.enum(['true', 'false']).default('false'),
    session_timeout: z.string().regex(/^\d+$/).default('60'),
    max_login_attempts: z.string().regex(/^\d+$/).default('5'),
    lockout_duration: z.string().regex(/^\d+$/).default('15'),
});

export type SecuritySettings = z.infer<typeof securitySettingsSchema>;

// ===== Company Settings =====
export const companySettingsSchema = z.object({
    company_name: z.string().min(1).max(100),
    company_email: z.string().email().optional().or(z.literal('')),
    company_phone: z.string().max(50).optional(),
    company_address: z.string().max(500).optional(),
    currency: z.string().min(2).max(4).default('USD'),
    country: z.string().min(2).max(3).default('US'),
    language: z.enum(['en', 'fr', 'ar']).default('en'),
});

export type CompanySettings = z.infer<typeof companySettingsSchema>;

// ===== Combined Settings Schema =====
export const allSettingsSchema = z.object({
    ...companySettingsSchema.shape,
    ...ticketSettingsSchema.shape,
    ...warrantySettingsSchema.shape,
    ...inventorySettingsSchema.shape,
    ...financeSettingsSchema.shape,
    ...printSettingsSchema.shape,
    ...trackingSettingsSchema.shape,
    ...securitySettingsSchema.shape,
}).partial();

export type AllSettings = z.infer<typeof allSettingsSchema>;

// ===== Validation Helper =====
export function validateSettings(
    settings: Record<string, string>,
    schema: z.ZodSchema
): { success: boolean; errors?: string[] } {
    const result = schema.safeParse(settings);

    if (!result.success) {
        return {
            success: false,
            errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        };
    }

    return { success: true };
}

// ===== Get Default Value =====
export function getSettingDefault(key: string): string | undefined {
    const allDefaults: Record<string, string> = {
        // Ticket
        auto_mark_tickets_as_paid: 'false',
        require_device_photos: 'false',
        require_estimated_price: 'true',
        require_status_notes: 'false',
        auto_assign_creator: 'true',
        default_priority: 'MEDIUM',
        ticket_prefix: 'T',
        enable_auto_close: 'false',
        auto_close_days: '30',
        allow_price_below_estimate: 'true',
        // Warranty
        enable_warranty_tracking: 'true',
        default_warranty_days: '30',
        default_warranty_text: 'Standard 30-day warranty on parts and labor',
        return_window_days: '14',
        require_return_approval: 'true',
        allow_partial_refunds: 'true',
        auto_restock_returns: 'true',
        // Inventory
        enable_inventory_tracking: 'true',
        auto_deduct_parts: 'true',
        allow_negative_stock: 'false',
        enable_low_stock_alerts: 'true',
        default_low_stock_threshold: '5',
        default_reorder_level: '10',
        require_supplier: 'false',
        // Finance
        currency_code: 'USD',
        currency_symbol: '$',
        currency_position: 'before',
        enable_tax: 'false',
        tax_rate: '0',
        tax_label: 'Tax',
        prices_include_tax: 'false',
        accept_cash: 'true',
        accept_card: 'true',
        accept_mobile: 'true',
        enable_diagnostic_fee: 'false',
        diagnostic_fee: '0',
        enable_rush_fee: 'false',
        rush_fee: '0',
        // Print
        label_size: '2x1',
        print_qr_code: 'true',
        print_barcode: 'false',
        invoice_prefix: 'INV-',
        show_logo_on_invoice: 'true',
        show_terms_on_invoice: 'true',
        invoice_terms: 'Payment is due upon receipt of device.',
        invoice_footer: 'Thank you for your business!',
        invoice_thank_you: 'Thank you for choosing us!',
        // Tracking
        enable_public_tracking: 'true',
        show_price_on_tracking: 'false',
        show_notes_on_tracking: 'false',
        show_eta_on_tracking: 'true',
        tracking_welcome_message: 'Track your repair status',
        tracking_completion_message: 'Your repair is complete! Please pick up your device.',
        show_contact_form: 'true',
        show_phone_on_tracking: 'true',
        // Security
        password_min_length: '8',
        require_uppercase: 'true',
        require_number: 'true',
        require_special_char: 'false',
        session_timeout: '60',
        max_login_attempts: '5',
        lockout_duration: '15',
    };

    return allDefaults[key];
}
