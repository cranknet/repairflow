'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
    CheckCircleIcon,
    RocketLaunchIcon,
    BuildingOfficeIcon,
    UserIcon,
    CogIcon,
    BeakerIcon,
    ArrowLeftIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import type { InstallState } from '../../lib/validation';

interface FinalizeStepProps {
    onNext: () => void;
    onBack: () => void;
    installState: InstallState;
    updateState: (updates: Partial<InstallState>) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    onComplete: () => void;
}

export function FinalizeStep({
    onBack,
    installState,
    isLoading,
    setIsLoading,
    onComplete
}: FinalizeStepProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [isComplete, setIsComplete] = useState(false);

    const handleFinalize = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/install/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to complete installation');
            }

            setIsComplete(true);

            // Wait a moment before redirecting
            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (error) {
            toast({
                title: t('error') || 'Error',
                description: error instanceof Error ? error.message : 'Failed to complete installation',
                variant: 'destructive',
            });
            setIsLoading(false);
        }
    };

    if (isComplete) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
                <div className="py-16 px-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6 animate-scaleIn">
                        <CheckCircleIcon className="h-14 w-14 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                        {t('install.finalize.success') || 'Installation complete!'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('install.finalize.redirecting') || 'Redirecting to login...'}
                    </p>
                    <div className="mt-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary/5 via-white to-primary/5 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <RocketLaunchIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('install.finalize.title') || 'Ready to Install'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('install.finalize.description') || 'Review your settings and complete the installation.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
                {/* Summary Header */}
                <div className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">
                        {t('install.finalize.summary') || 'Installation Summary'}
                    </h3>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Company */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <BuildingOfficeIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{t('install.finalize.company') || 'Company'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {installState.company?.company_name || 'Not configured'}
                            </p>
                            {installState.company?.company_email && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">{installState.company.company_email}</p>
                            )}
                        </div>
                    </div>

                    {/* Admin */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{t('install.finalize.admin') || 'Administrator'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {installState.admin?.name || 'Not configured'}
                            </p>
                            {installState.admin?.username && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">@{installState.admin.username}</p>
                            )}
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <CogIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{t('install.finalize.preferences') || 'Preferences'}</p>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                                <p className="flex items-center gap-2">
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-600 capitalize">
                                        {installState.preferences?.theme || 'System'}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${installState.preferences?.sms_enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-200 dark:bg-slate-600'}`}>
                                        SMS {installState.preferences?.sms_enabled ? 'ON' : 'OFF'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sample Data */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <BeakerIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{t('install.finalize.sampleData') || 'Sample Data'}</p>
                            <p className={`text-sm ${installState.loadSampleData ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {installState.loadSampleData
                                    ? (t('install.finalize.yes') || 'Will be loaded')
                                    : (t('install.finalize.no') || 'Skipped')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-slate-700">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <Button
                        onClick={handleFinalize}
                        disabled={isLoading}
                        size="lg"
                        className="gap-2 min-w-[200px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                {t('install.finalize.installing') || 'Installing...'}
                            </span>
                        ) : (
                            <>
                                <RocketLaunchIcon className="h-5 w-5" />
                                {t('install.finalize.completeButton') || 'Complete Installation'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

