'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface InventorySettingsTabProps {
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

export function InventorySettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
}: InventorySettingsTabProps) {
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
            {/* Inventory Tracking */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.inventoryTracking') || 'Inventory Tracking'}</CardTitle>
                    <CardDescription>{t('settings.inventoryTrackingDescription') || 'Configure inventory management behavior'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('settings.inventoryTrackingEnabled') || 'Enable Inventory Tracking'}
                        description={t('settings.inventoryTrackingEnabledDescription') || 'Track stock levels and inventory transactions'}
                        checked={getBool('inventory_tracking_enabled', true)}
                        onChange={(val) => setBool('inventory_tracking_enabled', val)}
                    />

                    <ToggleSetting
                        label={t('settings.autoDeductParts') || 'Auto-Deduct Parts on Complete'}
                        description={t('settings.autoDeductPartsDescription') || 'Automatically deduct parts from inventory when ticket is completed'}
                        checked={getBool('auto_deduct_parts_on_complete', true)}
                        onChange={(val) => setBool('auto_deduct_parts_on_complete', val)}
                    />

                    <ToggleSetting
                        label={t('settings.negativeStockAllowed') || 'Allow Negative Stock'}
                        description={t('settings.negativeStockAllowedDescription') || 'Allow stock to go below zero (not recommended)'}
                        checked={getBool('negative_stock_allowed')}
                        onChange={(val) => setBool('negative_stock_allowed', val)}
                    />
                </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.lowStockAlerts') || 'Low Stock Alerts'}</CardTitle>
                    <CardDescription>{t('settings.lowStockAlertsDescription') || 'Configure low stock notifications'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('settings.lowStockNotifications') || 'Enable Low Stock Notifications'}
                        description={t('settings.lowStockNotificationsDescription') || 'Send notifications when parts are low in stock'}
                        checked={getBool('low_stock_notifications_enabled', true)}
                        onChange={(val) => setBool('low_stock_notifications_enabled', val)}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="low_stock_threshold">{t('settings.lowStockThreshold') || 'Global Low Stock Threshold'}</Label>
                            <Input
                                id="low_stock_threshold"
                                type="number"
                                min="0"
                                value={settings.low_stock_threshold || '5'}
                                onChange={(e) => onSettingChange('low_stock_threshold', e.target.value)}
                                placeholder="5"
                            />
                            <p className="text-xs text-gray-500">Alert when stock falls below this level</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="default_reorder_level">{t('settings.defaultReorderLevel') || 'Default Reorder Level'}</Label>
                            <Input
                                id="default_reorder_level"
                                type="number"
                                min="0"
                                value={settings.default_reorder_level || '5'}
                                onChange={(e) => onSettingChange('default_reorder_level', e.target.value)}
                                placeholder="5"
                            />
                            <p className="text-xs text-gray-500">Default reorder level for new parts</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Part Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.partDefaults') || 'Part Defaults'}</CardTitle>
                    <CardDescription>{t('settings.partDefaultsDescription') || 'Default settings for new parts'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('settings.supplierRequired') || 'Require Supplier for Parts'}
                        description={t('settings.supplierRequiredDescription') || 'Supplier field is required when adding new parts'}
                        checked={getBool('supplier_required_for_parts')}
                        onChange={(val) => setBool('supplier_required_for_parts', val)}
                    />
                </CardContent>
            </Card>

            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? t('loading') : t('saveSettings')}
            </Button>
        </div>
    );
}
