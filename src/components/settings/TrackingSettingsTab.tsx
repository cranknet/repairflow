'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface TrackingSettingsTabProps {
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
        <div className="flex-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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

export function TrackingSettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
}: TrackingSettingsTabProps) {
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
            <Card className="overflow-hidden border-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-violet-500/10">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
                            <MapPinIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{t('settings.tracking.title') || 'Tracking Settings'}</CardTitle>
                            <CardDescription>
                                {t('settings.tracking.description') || 'Configure public tracking page and customer communication'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Public Tracking */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.publicTracking') || 'Public Tracking Page'}</CardTitle>
                    <CardDescription>{t('settings.publicTrackingDescription') || 'Configure the customer-facing tracking page'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('settings.trackingEnabled') || 'Enable Public Tracking'}
                        description={t('settings.trackingEnabledDescription') || 'Allow customers to track their repairs via public URL'}
                        checked={getBool('public_tracking_enabled', true)}
                        onChange={(val) => setBool('public_tracking_enabled', val)}
                    />

                    <ToggleSetting
                        label={t('settings.trackingShowPrice') || 'Show Price on Tracking'}
                        description={t('settings.trackingShowPriceDescription') || 'Display repair price on the public tracking page'}
                        checked={getBool('tracking_show_price')}
                        onChange={(val) => setBool('tracking_show_price', val)}
                    />

                    <ToggleSetting
                        label={t('settings.trackingShowTechnician') || 'Show Assigned Technician'}
                        description={t('settings.trackingShowTechnicianDescription') || 'Display the name of the assigned technician'}
                        checked={getBool('tracking_show_assigned_tech')}
                        onChange={(val) => setBool('tracking_show_assigned_tech', val)}
                    />

                    <ToggleSetting
                        label={t('settings.trackingShowEstimatedCompletion') || 'Show Estimated Completion'}
                        description={t('settings.trackingShowEstimatedCompletionDescription') || 'Display estimated completion date on tracking page'}
                        checked={getBool('tracking_show_estimated_completion', true)}
                        onChange={(val) => setBool('tracking_show_estimated_completion', val)}
                    />

                    <ToggleSetting
                        label={t('settings.trackingShowSocialLinks') || 'Show Social Media Links'}
                        description={t('settings.trackingShowSocialLinksDescription') || 'Display social media links on the tracking page'}
                        checked={getBool('tracking_show_social_links', true)}
                        onChange={(val) => setBool('tracking_show_social_links', val)}
                    />
                </CardContent>
            </Card>

            {/* Customer Contact */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.customerContact') || 'Customer Contact'}</CardTitle>
                    <CardDescription>{t('settings.customerContactDescription') || 'Configure customer communication options'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('settings.trackingAllowContact') || 'Allow Contact Form'}
                        description={t('settings.trackingAllowContactDescription') || 'Allow customers to send messages via tracking page'}
                        checked={getBool('tracking_allow_contact', true)}
                        onChange={(val) => setBool('tracking_allow_contact', val)}
                    />

                    <ToggleSetting
                        label={t('settings.satisfactionRatingEnabled') || 'Enable Satisfaction Ratings'}
                        description={t('settings.satisfactionRatingEnabledDescription') || 'Allow customers to rate their repair experience'}
                        checked={getBool('satisfaction_rating_enabled', true)}
                        onChange={(val) => setBool('satisfaction_rating_enabled', val)}
                    />
                </CardContent>
            </Card>

            {/* Custom Content */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.trackingCustomContent') || 'Custom Content'}</CardTitle>
                    <CardDescription>{t('settings.trackingCustomContentDescription') || 'Customize tracking page messages'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tracking_custom_message">{t('settings.trackingCustomMessage') || 'Custom Welcome Message'}</Label>
                        <textarea
                            id="tracking_custom_message"
                            value={settings.tracking_custom_message || ''}
                            onChange={(e) => onSettingChange('tracking_custom_message', e.target.value)}
                            placeholder="e.g., Thank you for choosing our repair service. We're working hard to fix your device!"
                            className="flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            rows={3}
                        />
                        <p className="text-xs text-gray-500">This message will be displayed at the top of the tracking page</p>
                    </div>
                </CardContent>
            </Card>

            {/* Social Media Links */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('socialMedia')}</CardTitle>
                    <CardDescription>{t('socialMediaDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid-form">
                        <div className="space-y-2">
                            <Label htmlFor="facebook_url">{t('facebookUrl') || 'Facebook URL'}</Label>
                            <Input
                                id="facebook_url"
                                type="url"
                                value={settings.facebook_url || ''}
                                onChange={(e) => onSettingChange('facebook_url', e.target.value)}
                                placeholder="https://facebook.com/yourpage"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram_url">{t('instagramUrl') || 'Instagram URL'}</Label>
                            <Input
                                id="instagram_url"
                                type="url"
                                value={settings.instagram_url || ''}
                                onChange={(e) => onSettingChange('instagram_url', e.target.value)}
                                placeholder="https://instagram.com/yourprofile"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="youtube_url">{t('youtubeUrl') || 'YouTube URL'}</Label>
                            <Input
                                id="youtube_url"
                                type="url"
                                value={settings.youtube_url || ''}
                                onChange={(e) => onSettingChange('youtube_url', e.target.value)}
                                placeholder="https://youtube.com/@yourchannel"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="twitter_url">{t('settings.twitterUrl') || 'Twitter/X URL'}</Label>
                            <Input
                                id="twitter_url"
                                type="url"
                                value={settings.twitter_url || ''}
                                onChange={(e) => onSettingChange('twitter_url', e.target.value)}
                                placeholder="https://twitter.com/yourhandle"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? t('loading') : t('saveSettings')}
            </Button>
        </div>
    );
}
