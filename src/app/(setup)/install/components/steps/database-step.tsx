'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { CircleStackIcon } from '@heroicons/react/24/solid';
import type { InstallState, DbCheckResult } from '../../lib/validation';

interface DatabaseStepProps {
    onNext: () => void;
    onBack: () => void;
    installState: InstallState;
    updateState: (updates: Partial<InstallState>) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export function DatabaseStep({ onNext, onBack, isLoading, setIsLoading }: DatabaseStepProps) {
    const { t } = useLanguage();
    const [dbCheck, setDbCheck] = useState<DbCheckResult | null>(null);
    const [isTesting, setIsTesting] = useState(true);

    useEffect(() => {
        testDatabase();
    }, []);

    const testDatabase = async () => {
        setIsTesting(true);
        try {
            const response = await fetch('/api/install/database');
            const data = await response.json();
            setDbCheck(data);
        } catch (error) {
            console.error('Database test failed:', error);
            setDbCheck({
                connected: false,
                type: 'Unknown',
                error: 'Failed to test database connection',
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CircleStackIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('install.database.title') || 'Database Connection'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('install.database.description') || 'Testing connection to your database...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
                {/* Connection Status */}
                <div className="flex flex-col items-center justify-center py-12">
                    {isTesting ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
                                <CircleStackIcon className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                                {t('install.database.testing') || 'Testing connection...'}
                            </p>
                        </div>
                    ) : dbCheck?.connected ? (
                        <div className="flex flex-col items-center gap-4 animate-fadeIn">
                            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircleIcon className="h-12 w-12 text-green-500" />
                            </div>
                            <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                                {t('install.database.success') || 'Database connected successfully!'}
                            </p>
                            <div className="mt-2 px-6 py-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{t('install.database.type') || 'Database Type'}:</span>{' '}
                                    <span className="text-primary font-medium">{dbCheck.type}</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 animate-fadeIn">
                            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <XCircleIcon className="h-12 w-12 text-red-500" />
                            </div>
                            <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                                {t('install.database.error') || 'Could not connect to database'}
                            </p>
                            {dbCheck?.error && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md text-center bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                                    {dbCheck.error}
                                </p>
                            )}
                            <Button
                                variant="outline"
                                onClick={testDatabase}
                                className="mt-2 gap-2"
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                                {t('install.database.retry') || 'Retry Connection'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-slate-700">
                    <Button variant="outline" onClick={onBack} className="gap-2">
                        <ArrowLeftIcon className="h-4 w-4" />
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={isTesting || !dbCheck?.connected}
                        className="gap-2 min-w-[120px]"
                    >
                        {t('install.nav.next') || 'Next'}
                        <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

