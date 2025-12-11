'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { TicketIcon } from '@heroicons/react/24/outline';

interface TicketSettingsTabProps {
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

export function TicketSettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
}: TicketSettingsTabProps) {
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
            <Card className="overflow-hidden border-0 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-cyan-500/10">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
                            <TicketIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{t('settings.tickets.title') || 'Ticket Settings'}</CardTitle>
                            <CardDescription>
                                {t('settings.tickets.description') || 'Configure ticket creation and workflow behavior'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Ticket Workflow */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('ticketSettings') || 'Ticket Settings'}</CardTitle>
                    <CardDescription>{t('settings.ticketWorkflowDescription') || 'Configure ticket creation and workflow behavior'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('autoMarkTicketsAsPaid')}
                        description={t('autoMarkTicketsAsPaidDescription')}
                        checked={getBool('auto_mark_tickets_as_paid')}
                        onChange={(val) => setBool('auto_mark_tickets_as_paid', val)}
                    />

                    <ToggleSetting
                        label={t('settings.requireDevicePhotos') || 'Require Device Photos'}
                        description={t('settings.requireDevicePhotosDescription') || 'Require front and back photos when creating tickets'}
                        checked={getBool('require_device_photos')}
                        onChange={(val) => setBool('require_device_photos', val)}
                    />

                    <ToggleSetting
                        label={t('settings.requireEstimatedPrice') || 'Require Estimated Price'}
                        description={t('settings.requireEstimatedPriceDescription') || 'Estimated price is required when creating tickets'}
                        checked={getBool('require_estimated_price', true)}
                        onChange={(val) => setBool('require_estimated_price', val)}
                    />

                    <ToggleSetting
                        label={t('settings.statusNotesRequired') || 'Require Status Change Notes'}
                        description={t('settings.statusNotesRequiredDescription') || 'Require notes when changing ticket status'}
                        checked={getBool('status_transition_notes_required')}
                        onChange={(val) => setBool('status_transition_notes_required', val)}
                    />

                    <ToggleSetting
                        label={t('settings.autoAssign') || 'Auto-Assign Tickets'}
                        description={t('settings.autoAssignDescription') || 'Automatically assign new tickets to available staff'}
                        checked={getBool('auto_assign_enabled')}
                        onChange={(val) => setBool('auto_assign_enabled', val)}
                    />
                </CardContent>
            </Card>

            {/* Ticket Defaults */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.ticketDefaults') || 'Ticket Defaults'}</CardTitle>
                    <CardDescription>{t('settings.ticketDefaultsDescription') || 'Default values for new tickets'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="default_priority">{t('settings.defaultPriority') || 'Default Priority'}</Label>
                            <select
                                id="default_priority"
                                value={settings.default_priority || 'MEDIUM'}
                                onChange={(e) => onSettingChange('default_priority', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            >
                                <option value="LOW">{t('low')}</option>
                                <option value="MEDIUM">{t('medium')}</option>
                                <option value="HIGH">{t('high')}</option>
                                <option value="URGENT">{t('urgent')}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ticket_number_prefix">{t('settings.ticketNumberPrefix') || 'Ticket Number Prefix'}</Label>
                            <Input
                                id="ticket_number_prefix"
                                value={settings.ticket_number_prefix || 'T'}
                                onChange={(e) => onSettingChange('ticket_number_prefix', e.target.value)}
                                placeholder="T"
                                maxLength={5}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Auto-Close Rules */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.autoCloseRules') || 'Auto-Close Rules'}</CardTitle>
                    <CardDescription>{t('settings.autoCloseRulesDescription') || 'Automatically close completed tickets after a period'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="auto_close_after_days">{t('settings.autoCloseAfterDays') || 'Auto-Close After (Days)'}</Label>
                            <Input
                                id="auto_close_after_days"
                                type="number"
                                min="0"
                                value={settings.auto_close_after_days || '0'}
                                onChange={(e) => onSettingChange('auto_close_after_days', e.target.value)}
                                placeholder="0 = Disabled"
                            />
                            <p className="text-xs text-gray-500">Set to 0 to disable auto-close</p>
                        </div>
                    </div>

                    <ToggleSetting
                        label={t('settings.allowPriceBelowEstimate') || 'Allow Final Price Below Estimate'}
                        description={t('settings.allowPriceBelowEstimateDescription') || 'Allow setting final price lower than estimated price'}
                        checked={getBool('allow_price_below_estimate', true)}
                        onChange={(val) => setBool('allow_price_below_estimate', val)}
                    />
                </CardContent>
            </Card>

            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? t('loading') : t('saveSettings')}
            </Button>
        </div>
    );
}
