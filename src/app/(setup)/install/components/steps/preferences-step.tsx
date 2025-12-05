'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CogIcon, ArrowLeftIcon, ArrowRightIcon, GlobeAltIcon, ChatBubbleLeftRightIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
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

const getThemeIcon = (theme: string) => {
    switch (theme) {
        case 'light': return <SunIcon className="h-5 w-5" />;
        case 'dark': return <MoonIcon className="h-5 w-5" />;
        default: return <ComputerDesktopIcon className="h-5 w-5" />;
    }
};

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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CogIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('install.preferences.title') || 'System Preferences'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('install.preferences.description') || 'Configure your system settings.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
                {/* Timezone & Theme Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Timezone */}
                    <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-sm font-medium flex items-center gap-2">
                            <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                            {t('install.preferences.timezoneLabel') || 'Timezone'}
                        </Label>
                        <select
                            id="timezone"
                            {...register('timezone')}
                            className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        >
                            {TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Theme Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('install.preferences.themeLabel') || 'Default Theme'}</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {['light', 'dark', 'system'].map((themeOption) => (
                                <button
                                    key={themeOption}
                                    type="button"
                                    onClick={() => setValue('theme', themeOption as 'light' | 'dark' | 'system')}
                                    className={`p-3 border-2 rounded-xl text-center capitalize transition-all flex flex-col items-center gap-1.5 ${watch('theme') === themeOption
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-gray-200 dark:border-slate-600 hover:border-primary/50 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {getThemeIcon(themeOption)}
                                    <span className="text-xs font-medium">{t(themeOption) || themeOption}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SMS Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{t('install.preferences.smsLabel') || 'Enable SMS Notifications'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('install.preferences.smsHelp') || 'Send automated SMS to customers about ticket status'}
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            {...register('sms_enabled')}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Social Media Links */}
                <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        {t('install.preferences.socialLabel') || 'Social Media Links'} <span className="text-gray-400 font-normal">({t('optional') || 'optional'})</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="facebook_url" className="text-xs text-gray-500">
                                {t('install.preferences.facebookLabel') || 'Facebook URL'}
                            </Label>
                            <Input
                                id="facebook_url"
                                {...register('facebook_url')}
                                placeholder="https://facebook.com/..."
                                className="h-10"
                            />
                            {errors.facebook_url && (
                                <p className="text-xs text-red-500">{errors.facebook_url.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="youtube_url" className="text-xs text-gray-500">
                                {t('install.preferences.youtubeLabel') || 'YouTube URL'}
                            </Label>
                            <Input
                                id="youtube_url"
                                {...register('youtube_url')}
                                placeholder="https://youtube.com/..."
                                className="h-10"
                            />
                            {errors.youtube_url && (
                                <p className="text-xs text-red-500">{errors.youtube_url.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="instagram_url" className="text-xs text-gray-500">
                                {t('install.preferences.instagramLabel') || 'Instagram URL'}
                            </Label>
                            <Input
                                id="instagram_url"
                                {...register('instagram_url')}
                                placeholder="https://instagram.com/..."
                                className="h-10"
                            />
                            {errors.instagram_url && (
                                <p className="text-xs text-red-500">{errors.instagram_url.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-slate-700">
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={onBack}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="gap-2 min-w-[120px]"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                {t('saving') || 'Saving...'}
                            </span>
                        ) : (
                            <>
                                {t('install.nav.next') || 'Next'}
                                <ArrowRightIcon className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

