'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CogIcon } from '@heroicons/react/24/outline';
import { preferencesSchema, type PreferencesFormData, type InstallState } from '../../lib/validation';

interface PreferencesStepProps {
    onNext: () => void;
    onBack: () => void;
    installState: InstallState;
    updateState: (updates: Partial<InstallState>) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

// Common timezones
const TIMEZONES = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'Europe/London', label: 'London, Dublin, Lisbon' },
    { value: 'Europe/Paris', label: 'Paris, Berlin, Rome, Madrid' },
    { value: 'Asia/Dubai', label: 'Dubai, Abu Dhabi' },
    { value: 'Asia/Riyadh', label: 'Riyadh, Kuwait, Baghdad' },
    { value: 'Asia/Tokyo', label: 'Tokyo, Seoul' },
    { value: 'Asia/Shanghai', label: 'Beijing, Shanghai, Hong Kong' },
    { value: 'Australia/Sydney', label: 'Sydney, Melbourne' },
    { value: 'Africa/Cairo', label: 'Cairo' },
    { value: 'Africa/Casablanca', label: 'Casablanca' },
];

export function PreferencesStep({
    onNext,
    onBack,
    installState,
    updateState,
    isLoading,
    setIsLoading
}: PreferencesStepProps) {
    const { t } = useLanguage();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<PreferencesFormData>({
        resolver: zodResolver(preferencesSchema),
        defaultValues: installState.preferences || {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            sms_enabled: false,
            facebook_url: '',
            youtube_url: '',
            instagram_url: '',
            theme: 'system',
        },
    });

    const smsEnabled = watch('sms_enabled');

    const onSubmit = async (data: PreferencesFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/install/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save preferences');
            }

            updateState({ preferences: data });
            onNext();
        } catch (error) {
            toast({
                title: t('error') || 'Error',
                description: error instanceof Error ? error.message : 'Failed to save preferences',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <CogIcon className="h-16 w-16 text-primary" />
                </div>
                <CardTitle>{t('install.preferences.title') || 'System Preferences'}</CardTitle>
                <CardDescription>
                    {t('install.preferences.description') || 'Configure your system settings.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Timezone */}
                    <div className="space-y-2">
                        <Label htmlFor="timezone">
                            {t('install.preferences.timezoneLabel') || 'Timezone'}
                        </Label>
                        <select
                            id="timezone"
                            {...register('timezone')}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            {TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* SMS Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                            <p className="font-medium">{t('install.preferences.smsLabel') || 'Enable SMS Notifications'}</p>
                            <p className="text-sm text-gray-500">
                                {t('install.preferences.smsHelp') || 'Send automated SMS to customers about ticket status'}
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('sms_enabled')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Theme Selection */}
                    <div className="space-y-2">
                        <Label>{t('install.preferences.themeLabel') || 'Default Theme'}</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {['light', 'dark', 'system'].map((themeOption) => (
                                <button
                                    key={themeOption}
                                    type="button"
                                    onClick={() => setValue('theme', themeOption as 'light' | 'dark' | 'system')}
                                    className={`p-3 border-2 rounded-lg text-center capitalize transition-colors ${watch('theme') === themeOption
                                            ? 'border-primary bg-primary/10'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                        }`}
                                >
                                    {t(themeOption) || themeOption}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="space-y-4">
                        <Label>{t('install.preferences.socialLabel') || 'Social Media Links'}</Label>

                        <div className="space-y-2">
                            <Label htmlFor="facebook_url" className="text-sm text-gray-500">
                                {t('install.preferences.facebookLabel') || 'Facebook URL'}
                            </Label>
                            <Input
                                id="facebook_url"
                                {...register('facebook_url')}
                                placeholder="https://facebook.com/yourpage"
                            />
                            {errors.facebook_url && (
                                <p className="text-sm text-red-500">{errors.facebook_url.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="youtube_url" className="text-sm text-gray-500">
                                {t('install.preferences.youtubeLabel') || 'YouTube URL'}
                            </Label>
                            <Input
                                id="youtube_url"
                                {...register('youtube_url')}
                                placeholder="https://youtube.com/yourchannel"
                            />
                            {errors.youtube_url && (
                                <p className="text-sm text-red-500">{errors.youtube_url.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="instagram_url" className="text-sm text-gray-500">
                                {t('install.preferences.instagramLabel') || 'Instagram URL'}
                            </Label>
                            <Input
                                id="instagram_url"
                                {...register('instagram_url')}
                                placeholder="https://instagram.com/yourprofile"
                            />
                            {errors.instagram_url && (
                                <p className="text-sm text-red-500">{errors.instagram_url.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between pt-6">
                        <Button type="button" variant="outlined" onClick={onBack} disabled={isLoading}>
                            {t('install.nav.back') || 'Back'}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    {t('saving') || 'Saving...'}
                                </span>
                            ) : (
                                t('install.nav.next') || 'Next'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
