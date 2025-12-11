'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { PrinterIcon } from '@heroicons/react/24/outline';

interface PrintSettingsTabProps {
    settings: Record<string, string>;
    onSettingChange: (key: string, value: string) => void;
    onSave: () => void;
    isSaving: boolean;
}

function ToggleSetting({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1 pr-4">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

export function PrintSettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
}: PrintSettingsTabProps) {
    const { t } = useLanguage();

    const getBool = (key: string, defaultVal: boolean = false): boolean => {
        const val = settings[key];
        if (val === undefined) return defaultVal;
        return val === 'true' || val === '1';
    };

    const setBool = (key: string, value: boolean) => {
        onSettingChange(key, value ? 'true' : 'false');
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-zinc-500/10">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 text-white shadow-lg shadow-slate-500/25">
                            <PrinterIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{t('settings.print.title') || 'Print Settings'}</CardTitle>
                            <CardDescription>
                                {t('settings.print.description') || 'Configure label and invoice printing options'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Label Printing */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.labelPrinting') || 'Label Printing'}</CardTitle>
                    <CardDescription>{t('settings.labelPrintingDescription') || 'Configure label print settings'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="print_label_size">{t('settings.labelSize') || 'Label Size (mm)'}</Label>
                            <select
                                id="print_label_size"
                                value={settings.print_label_size || '40x20'}
                                onChange={(e) => onSettingChange('print_label_size', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            >
                                <option value="40x20">40 x 20 mm (Standard)</option>
                                <option value="50x25">50 x 25 mm</option>
                                <option value="60x30">60 x 30 mm</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        {settings.print_label_size === 'custom' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="print_label_width">{t('settings.labelWidth') || 'Label Width (mm)'}</Label>
                                    <Input
                                        id="print_label_width"
                                        type="number"
                                        min="20"
                                        max="100"
                                        value={settings.print_label_width || '40'}
                                        onChange={(e) => onSettingChange('print_label_width', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="print_label_height">{t('settings.labelHeight') || 'Label Height (mm)'}</Label>
                                    <Input
                                        id="print_label_height"
                                        type="number"
                                        min="10"
                                        max="100"
                                        value={settings.print_label_height || '20'}
                                        onChange={(e) => onSettingChange('print_label_height', e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <ToggleSetting
                        label={t('settings.showQrOnLabel') || 'Show QR Code on Labels'}
                        description={t('settings.showQrOnLabelDescription') || 'Include QR code on printed labels'}
                        checked={getBool('print_show_qr_code', true)}
                        onChange={(val) => setBool('print_show_qr_code', val)}
                    />
                </CardContent>
            </Card>

            {/* Invoice Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.invoicePrinting') || 'Invoice Printing'}</CardTitle>
                    <CardDescription>{t('settings.invoicePrintingDescription') || 'Configure invoice print settings'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="print_invoice_size">{t('settings.invoiceSize') || 'Invoice Size (mm)'}</Label>
                            <select
                                id="print_invoice_size"
                                value={settings.print_invoice_size || '80x120'}
                                onChange={(e) => onSettingChange('print_invoice_size', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            >
                                <option value="80x120">80 x 120 mm (Thermal)</option>
                                <option value="A4">A4 (210 x 297 mm)</option>
                                <option value="Letter">Letter (8.5 x 11 in)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice_number_prefix">{t('settings.invoiceNumberPrefix') || 'Invoice Number Prefix'}</Label>
                            <Input
                                id="invoice_number_prefix"
                                value={settings.invoice_number_prefix || 'INV'}
                                onChange={(e) => onSettingChange('invoice_number_prefix', e.target.value)}
                                placeholder="INV"
                                maxLength={10}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="default_print_language">{t('settings.defaultPrintLanguage') || 'Default Print Language'}</Label>
                            <select
                                id="default_print_language"
                                value={settings.default_print_language || 'en'}
                                onChange={(e) => onSettingChange('default_print_language', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            >
                                <option value="en">English</option>
                                <option value="fr">Français</option>
                                <option value="ar">العربية</option>
                            </select>
                        </div>
                    </div>

                    <ToggleSetting
                        label={t('settings.showPartsBreakdown') || 'Show Parts Breakdown'}
                        description={t('settings.showPartsBreakdownDescription') || 'Display itemized parts list on invoices'}
                        checked={getBool('invoice_show_parts_breakdown', true)}
                        onChange={(val) => setBool('invoice_show_parts_breakdown', val)}
                    />

                    <ToggleSetting
                        label={t('settings.autoPrintOnPayment') || 'Auto-Print on Payment'}
                        description={t('settings.autoPrintOnPaymentDescription') || 'Automatically print receipt when payment is recorded'}
                        checked={getBool('receipt_auto_print')}
                        onChange={(val) => setBool('receipt_auto_print', val)}
                    />
                </CardContent>
            </Card>

            {/* Invoice Content */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.invoiceContent') || 'Invoice Content'}</CardTitle>
                    <CardDescription>{t('settings.invoiceContentDescription') || 'Customize invoice text and appearance'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="invoice_footer_text">{t('settings.invoiceFooter') || 'Invoice Footer Text'}</Label>
                        <textarea
                            id="invoice_footer_text"
                            value={settings.invoice_footer_text || ''}
                            onChange={(e) => onSettingChange('invoice_footer_text', e.target.value)}
                            placeholder="Thank you for your business!"
                            className="flex min-h-[60px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invoice_terms_text">{t('settings.invoiceTerms') || 'Terms & Conditions'}</Label>
                        <textarea
                            id="invoice_terms_text"
                            value={settings.invoice_terms_text || ''}
                            onChange={(e) => onSettingChange('invoice_terms_text', e.target.value)}
                            placeholder="All repairs come with a standard warranty. Please retain this receipt for any warranty claims."
                            className="flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? t('loading') : t('saveSettings')}
            </Button>
        </div>
    );
}
