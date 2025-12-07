'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface WarrantySettingsTabProps {
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

export function WarrantySettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
}: WarrantySettingsTabProps) {
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
            {/* Warranty Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.warranty') || 'Warranty Settings'}</CardTitle>
                    <CardDescription>{t('settings.warrantyDescription') || 'Configure default warranty behavior'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('settings.warrantyEnabled') || 'Enable Warranty Tracking'}
                        description={t('settings.warrantyEnabledDescription') || 'Track warranty periods for completed repairs'}
                        checked={getBool('warranty_enabled', true)}
                        onChange={(val) => setBool('warranty_enabled', val)}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="default_warranty_days">{t('settings.defaultWarrantyDays') || 'Default Warranty (Days)'}</Label>
                            <Input
                                id="default_warranty_days"
                                type="number"
                                min="0"
                                value={settings.default_warranty_days || '30'}
                                onChange={(e) => onSettingChange('default_warranty_days', e.target.value)}
                                placeholder="30"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="warranty_text_template">{t('settings.warrantyTextTemplate') || 'Default Warranty Text'}</Label>
                        <textarea
                            id="warranty_text_template"
                            value={settings.warranty_text_template || ''}
                            onChange={(e) => onSettingChange('warranty_text_template', e.target.value)}
                            placeholder="e.g., This repair is covered under our standard warranty policy..."
                            className="flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            rows={3}
                        />
                        <p className="text-xs text-gray-500">This text will be displayed on warranty documentation</p>
                    </div>
                </CardContent>
            </Card>

            {/* Returns Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.returns') || 'Return Settings'}</CardTitle>
                    <CardDescription>{t('settings.returnsDescription') || 'Configure return and refund policies'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="return_window_days">{t('settings.returnWindowDays') || 'Return Window (Days)'}</Label>
                            <Input
                                id="return_window_days"
                                type="number"
                                min="0"
                                value={settings.return_window_days || '14'}
                                onChange={(e) => onSettingChange('return_window_days', e.target.value)}
                                placeholder="14"
                            />
                            <p className="text-xs text-gray-500">Days allowed for return requests after completion</p>
                        </div>
                    </div>

                    <ToggleSetting
                        label={t('settings.returnRequireApproval') || 'Require Admin Approval'}
                        description={t('settings.returnRequireApprovalDescription') || 'Return requests require admin approval before processing'}
                        checked={getBool('return_require_approval', true)}
                        onChange={(val) => setBool('return_require_approval', val)}
                    />

                    <ToggleSetting
                        label={t('settings.returnPartialRefund') || 'Allow Partial Refunds'}
                        description={t('settings.returnPartialRefundDescription') || 'Allow refunding less than the full amount'}
                        checked={getBool('return_partial_refund_allowed', true)}
                        onChange={(val) => setBool('return_partial_refund_allowed', val)}
                    />

                    <ToggleSetting
                        label={t('settings.returnRestockInventory') || 'Auto-Restock Inventory'}
                        description={t('settings.returnRestockInventoryDescription') || 'Automatically restock parts when a return is approved'}
                        checked={getBool('return_restock_inventory', true)}
                        onChange={(val) => setBool('return_restock_inventory', val)}
                    />
                </CardContent>
            </Card>

            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? t('loading') : t('saveSettings')}
            </Button>
        </div>
    );
}
