'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { CURRENCIES } from '@/lib/currencies';

interface FinanceSettingsTabProps {
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

export function FinanceSettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
}: FinanceSettingsTabProps) {
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
            {/* Currency Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.currencySettings') || 'Currency Settings'}</CardTitle>
                    <CardDescription>{t('settings.currencySettingsDescription') || 'Configure currency display and formatting'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="currency">{t('currency')}</Label>
                            <select
                                id="currency"
                                value={settings.currency || 'USD'}
                                onChange={(e) => onSettingChange('currency', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            >
                                {CURRENCIES.map((currency) => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.flag} {currency.code} - {currency.name} ({currency.symbol})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency_symbol_position">{t('settings.symbolPosition') || 'Symbol Position'}</Label>
                            <select
                                id="currency_symbol_position"
                                value={settings.currency_symbol_position || 'before'}
                                onChange={(e) => onSettingChange('currency_symbol_position', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            >
                                <option value="before">Before amount ($100)</option>
                                <option value="after">After amount (100$)</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* VAT/Tax Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.vatSettings') || 'VAT / Tax Settings'}</CardTitle>
                    <CardDescription>{t('settings.vatSettingsDescription') || 'Configure tax calculation and display'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('settings.vatEnabled') || 'Enable VAT/Tax'}
                        description={t('settings.vatEnabledDescription') || 'Apply VAT/tax to invoices and pricing'}
                        checked={getBool('vat_enabled')}
                        onChange={(val) => setBool('vat_enabled', val)}
                    />

                    {getBool('vat_enabled') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="vat_rate">{t('settings.vatRate') || 'VAT Rate (%)'}</Label>
                                <Input
                                    id="vat_rate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={settings.vat_rate || '0'}
                                    onChange={(e) => onSettingChange('vat_rate', e.target.value)}
                                    placeholder="20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vat_number">{t('settings.vatNumber') || 'VAT Number'}</Label>
                                <Input
                                    id="vat_number"
                                    value={settings.vat_number || ''}
                                    onChange={(e) => onSettingChange('vat_number', e.target.value)}
                                    placeholder="VAT123456789"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.paymentMethods') || 'Payment Methods'}</CardTitle>
                    <CardDescription>{t('settings.paymentMethodsDescription') || 'Configure available payment options'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t('settings.enabledPaymentMethods') || 'Enabled Payment Methods'}</Label>
                        <div className="flex flex-wrap gap-2">
                            {['CASH', 'CARD', 'MOBILE', 'BANK_TRANSFER', 'OTHER'].map((method) => {
                                const enabledMethods = (settings.payment_methods || 'CASH,CARD').split(',');
                                const isSelected = enabledMethods.includes(method);
                                const labels: Record<string, string> = {
                                    CASH: 'Cash',
                                    CARD: 'Card',
                                    MOBILE: 'Mobile Payment',
                                    BANK_TRANSFER: 'Bank Transfer',
                                    OTHER: 'Other',
                                };

                                return (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => {
                                            const newMethods = isSelected
                                                ? enabledMethods.filter((m) => m !== method)
                                                : [...enabledMethods, method];
                                            onSettingChange('payment_methods', newMethods.filter(Boolean).join(','));
                                        }}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isSelected
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {labels[method]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="default_payment_method">{t('settings.defaultPaymentMethod') || 'Default Payment Method'}</Label>
                            <select
                                id="default_payment_method"
                                value={settings.default_payment_method || 'CASH'}
                                onChange={(e) => onSettingChange('default_payment_method', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="MOBILE">Mobile Payment</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    <ToggleSetting
                        label={t('settings.requirePaymentReference') || 'Require Payment Reference'}
                        description={t('settings.requirePaymentReferenceDescription') || 'Require transaction reference for card/mobile payments'}
                        checked={getBool('require_payment_reference')}
                        onChange={(val) => setBool('require_payment_reference', val)}
                    />
                </CardContent>
            </Card>

            {/* Service Fees */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.serviceFees') || 'Service Fees'}</CardTitle>
                    <CardDescription>{t('settings.serviceFeesDescription') || 'Configure additional service charges'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('settings.serviceFeeEnabled') || 'Enable Service Fee'}
                        description={t('settings.serviceFeeEnabledDescription') || 'Add a service fee to tickets'}
                        checked={getBool('service_fee_enabled')}
                        onChange={(val) => setBool('service_fee_enabled', val)}
                    />

                    {getBool('service_fee_enabled') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="service_fee_amount">{t('settings.serviceFeeAmount') || 'Fee Amount'}</Label>
                                <Input
                                    id="service_fee_amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={settings.service_fee_amount || '0'}
                                    onChange={(e) => onSettingChange('service_fee_amount', e.target.value)}
                                    placeholder="5.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="service_fee_type">{t('settings.serviceFeeType') || 'Fee Type'}</Label>
                                <select
                                    id="service_fee_type"
                                    value={settings.service_fee_type || 'fixed'}
                                    onChange={(e) => onSettingChange('service_fee_type', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                                >
                                    <option value="fixed">Fixed Amount</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? t('loading') : t('saveSettings')}
            </Button>
        </div>
    );
}
