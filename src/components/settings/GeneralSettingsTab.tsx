'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { CURRENCIES } from '@/lib/currencies';
import { COUNTRIES } from '@/lib/countries';
import { AppVersion } from '@/components/layout/app-version';

interface GeneralSettingsTabProps {
    settings: Record<string, string>;
    onSettingChange: (key: string, value: string) => void;
    onSave: () => void;
    isSaving: boolean;
    onShowResetConfirm: () => void;
}

export function GeneralSettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
    onShowResetConfirm,
}: GeneralSettingsTabProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            {/* Company Information */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('generalSettings')}</CardTitle>
                    <CardDescription>{t('companyInformation')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="company_name">{t('companyName')}</Label>
                            <Input
                                id="company_name"
                                value={settings.company_name || ''}
                                onChange={(e) => onSettingChange('company_name', e.target.value)}
                                placeholder="My Repair Shop"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company_email">{t('companyEmail')}</Label>
                            <Input
                                id="company_email"
                                type="email"
                                value={settings.company_email || ''}
                                onChange={(e) => onSettingChange('company_email', e.target.value)}
                                placeholder="info@myrepairshop.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company_phone">{t('companyPhone')}</Label>
                            <Input
                                id="company_phone"
                                value={settings.company_phone || ''}
                                onChange={(e) => onSettingChange('company_phone', e.target.value)}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company_address">{t('companyAddress')}</Label>
                            <Input
                                id="company_address"
                                value={settings.company_address || ''}
                                onChange={(e) => onSettingChange('company_address', e.target.value)}
                                placeholder="123 Main St, City, State 12345"
                            />
                        </div>
                    </div>

                    {/* Regional Settings */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">{t('install.company.localeSettings') || 'Regional Settings'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currency">{t('currency')}</Label>
                                <select
                                    id="currency"
                                    value={settings.currency || 'USD'}
                                    onChange={(e) => onSettingChange('currency', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                                >
                                    {CURRENCIES.map((currency) => (
                                        <option key={currency.code} value={currency.code}>
                                            {currency.flag} {currency.code} - {currency.name} ({currency.symbol})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">{t('country')}</Label>
                                <select
                                    id="country"
                                    value={settings.country || 'US'}
                                    onChange={(e) => onSettingChange('country', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                                >
                                    {COUNTRIES.map((country) => (
                                        <option key={country.code} value={country.code}>
                                            {country.flag} {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone">{t('install.preferences.timezoneLabel') || 'Timezone'}</Label>
                                <select
                                    id="timezone"
                                    value={settings.timezone || 'UTC'}
                                    onChange={(e) => onSettingChange('timezone', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                                >
                                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                                    <option value="America/Chicago">Central Time (US & Canada)</option>
                                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                                    <option value="Europe/London">London (GMT)</option>
                                    <option value="Europe/Paris">Paris (CET)</option>
                                    <option value="Europe/Berlin">Berlin (CET)</option>
                                    <option value="Asia/Dubai">Dubai (GST)</option>
                                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                                    <option value="Australia/Sydney">Sydney (AEST)</option>
                                    <option value="Africa/Cairo">Cairo (EET)</option>
                                    <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Business Hours */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">{t('settings.businessHours') || 'Business Hours'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="business_hours_start">{t('settings.openingTime') || 'Opening Time'}</Label>
                                <Input
                                    id="business_hours_start"
                                    type="time"
                                    value={settings.business_hours_start || '09:00'}
                                    onChange={(e) => onSettingChange('business_hours_start', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="business_hours_end">{t('settings.closingTime') || 'Closing Time'}</Label>
                                <Input
                                    id="business_hours_end"
                                    type="time"
                                    value={settings.business_hours_end || '18:00'}
                                    onChange={(e) => onSettingChange('business_hours_end', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <Label>{t('settings.workingDays') || 'Working Days'}</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                    const dayNumber = (index + 1).toString();
                                    const workingDays = (settings.business_days || '1,2,3,4,5').split(',');
                                    const isSelected = workingDays.includes(dayNumber);

                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => {
                                                const newDays = isSelected
                                                    ? workingDays.filter(d => d !== dayNumber)
                                                    : [...workingDays, dayNumber].sort();
                                                onSettingChange('business_days', newDays.join(','));
                                            }}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isSelected
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* App Version */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <AppVersion />
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-6 border-t-2 border-red-200 dark:border-red-900">
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">{t('factoryReset')}</h3>
                                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{t('resetSettingsDescription')}</p>
                                    <Button
                                        variant="outline"
                                        onClick={onShowResetConfirm}
                                        className="mt-3 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                    >
                                        {t('resetSettings')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? t('loading') : t('saveSettings')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
