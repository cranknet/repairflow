'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CheckCircleIcon,
    RocketLaunchIcon,
    BuildingOfficeIcon,
    UserIcon,
    CogIcon,
    BeakerIcon
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
            <Card>
                <CardContent className="py-16 text-center">
                    <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                        {t('install.finalize.success') || 'Installation complete!'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('install.finalize.redirecting') || 'Redirecting to login...'}
                    </p>
                    <div className="mt-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <RocketLaunchIcon className="h-16 w-16 text-primary" />
                </div>
                <CardTitle>{t('install.finalize.title') || 'Ready to Install'}</CardTitle>
                <CardDescription>
                    {t('install.finalize.description') || 'Review your settings and complete the installation.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary */}
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">
                        {t('install.finalize.summary') || 'Installation Summary'}
                    </h3>

                    {/* Company */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <BuildingOfficeIcon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-medium">{t('install.finalize.company') || 'Company'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {installState.company?.company_name || 'Not configured'}
                            </p>
                            {installState.company?.company_email && (
                                <p className="text-sm text-gray-500">{installState.company.company_email}</p>
                            )}
                        </div>
                    </div>

                    {/* Admin */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <UserIcon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-medium">{t('install.finalize.admin') || 'Administrator'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {installState.admin?.name || 'Not configured'}
                            </p>
                            {installState.admin?.username && (
                                <p className="text-sm text-gray-500">@{installState.admin.username}</p>
                            )}
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <CogIcon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-medium">{t('install.finalize.preferences') || 'Preferences'}</p>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p>Theme: {installState.preferences?.theme || 'System'}</p>
                                <p>SMS: {installState.preferences?.sms_enabled ? 'Enabled' : 'Disabled'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sample Data */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <BeakerIcon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-medium">{t('install.finalize.sampleData') || 'Sample Data'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {installState.loadSampleData
                                    ? (t('install.finalize.yes') || 'Yes')
                                    : (t('install.finalize.no') || 'No')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                    <Button type="button" variant="outlined" onClick={onBack} disabled={isLoading}>
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <Button onClick={handleFinalize} disabled={isLoading} size="lg">
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                {t('install.finalize.installing') || 'Installing...'}
                            </span>
                        ) : (
                            <>
                                <RocketLaunchIcon className="h-5 w-5 mr-2" />
                                {t('install.finalize.completeButton') || 'Complete Installation'}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
