'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary/5 via-white to-primary/5 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center overflow-hidden">
                            <Image
                                src="/default-logo.png"
                                alt="RepairFlow Logo"
                                width={48}
                                height={48}
                                unoptimized
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('install.welcome.title') || 'Welcome to RepairFlow'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {t('install.welcome.description') || "Let's set up your repair shop management system."}
                            </p>
                        </div>
                    </div>
                    <SetupLanguageSwitcher />
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
                {/* Environment Checks */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <SparklesIcon className="h-4 w-4 text-primary" />
                        {t('install.welcome.checkingEnv') || 'Environment Checks'}
                    </div>

                    {isChecking ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary"></div>
                                <p className="text-sm text-gray-500">{t('loading') || 'Checking...'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {checks.map((check, index) => (
                                <div
                                    key={check.key}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${check.status === 'ok' ? 'bg-green-100 dark:bg-green-900/30' :
                                                check.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                                    'bg-red-100 dark:bg-red-900/30'
                                            }`}>
                                            {getStatusIcon(check.status)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{check.label}</p>
                                            {check.message && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{check.message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${check.required
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                        : 'bg-gray-100 text-gray-600 dark:bg-slate-600 dark:text-gray-300'
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
                    <div className={`p-4 rounded-xl border ${hasErrors
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                        : hasWarnings
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                        }`}>
                        <div className="flex items-center gap-2">
                            {hasErrors
                                ? <XCircleIcon className="h-5 w-5" />
                                : hasWarnings
                                    ? <ExclamationTriangleIcon className="h-5 w-5" />
                                    : <CheckCircleIcon className="h-5 w-5" />
                            }
                            <span className="text-sm font-medium">
                                {hasErrors
                                    ? (t('install.welcome.envError') || 'Critical configuration missing. Please check your .env file.')
                                    : hasWarnings
                                        ? (t('install.welcome.envWarning') || 'Some optional features may be limited.')
                                        : (t('install.welcome.envReady') || 'Environment is ready!')
                                }
                            </span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                    <Button
                        onClick={onNext}
                        disabled={isChecking || hasErrors}
                        className="gap-2 min-w-[140px]"
                    >
                        {t('install.welcome.getStarted') || 'Get Started'}
                        <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

