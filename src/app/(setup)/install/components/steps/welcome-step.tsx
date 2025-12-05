'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import type { InstallState, EnvCheckResult } from '../../lib/validation';
import { SetupLanguageSwitcher } from '@/components/setup/setup-language-switcher';

interface WelcomeStepProps {
    onNext: () => void;
    onBack: () => void;
    installState: InstallState;
    updateState: (updates: Partial<InstallState>) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export function WelcomeStep({ onNext, isLoading, setIsLoading }: WelcomeStepProps) {
    const { t } = useLanguage();
    const [checks, setChecks] = useState<EnvCheckResult[]>([]);
    const [hasErrors, setHasErrors] = useState(false);
    const [hasWarnings, setHasWarnings] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        checkEnvironment();
    }, []);

    const checkEnvironment = async () => {
        setIsChecking(true);
        try {
            const response = await fetch('/api/install/environment');
            const data = await response.json();
            setChecks(data.checks || []);
            setHasErrors(data.hasErrors);
            setHasWarnings(data.hasWarnings);
        } catch (error) {
            console.error('Failed to check environment:', error);
            setHasErrors(true);
        } finally {
            setIsChecking(false);
        }
    };

    const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
        switch (status) {
            case 'ok':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'warning':
                return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
            case 'error':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-end mb-2">
                    <SetupLanguageSwitcher />
                </div>
                <div className="flex justify-center mb-4">
                    <Image
                        src="/default-logo.png"
                        alt="RepairFlow Logo"
                        width={100}
                        height={100}
                        unoptimized
                    />
                </div>
                <CardTitle className="text-2xl">{t('install.welcome.title') || 'Welcome to RepairFlow'}</CardTitle>
                <CardDescription>
                    {t('install.welcome.description') || "Let's set up your repair shop management system."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Environment Checks */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('install.welcome.checkingEnv') || 'Checking environment...'}
                    </h3>

                    {isChecking ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {checks.map((check) => (
                                <div
                                    key={check.key}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(check.status)}
                                        <div>
                                            <p className="text-sm font-medium">{check.label}</p>
                                            {check.message && (
                                                <p className="text-xs text-gray-500">{check.message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${check.required
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {check.required
                                            ? (t('install.welcome.required') || 'Required')
                                            : (t('install.welcome.optional') || 'Optional')
                                        }
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Message */}
                {!isChecking && (
                    <div className={`p-4 rounded-lg ${hasErrors
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : hasWarnings
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        }`}>
                        {hasErrors
                            ? (t('install.welcome.envError') || 'Critical configuration missing. Please check your .env file.')
                            : hasWarnings
                                ? (t('install.welcome.envWarning') || 'Some optional features may be limited.')
                                : (t('install.welcome.envReady') || 'Environment is ready!')
                        }
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-end pt-4">
                    <Button
                        onClick={onNext}
                        disabled={isChecking || hasErrors}
                    >
                        {t('install.nav.next') || 'Next'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
