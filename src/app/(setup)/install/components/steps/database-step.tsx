'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
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
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <CircleStackIcon className="h-16 w-16 text-primary" />
                </div>
                <CardTitle>{t('install.database.title') || 'Database Connection'}</CardTitle>
                <CardDescription>
                    {t('install.database.description') || 'Testing connection to your database...'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Connection Status */}
                <div className="flex flex-col items-center justify-center py-8">
                    {isTesting ? (
                        <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">
                                {t('install.database.testing') || 'Testing connection...'}
                            </p>
                        </>
                    ) : dbCheck?.connected ? (
                        <>
                            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
                            <p className="text-lg font-medium text-green-700 dark:text-green-400">
                                {t('install.database.success') || 'Database connected successfully!'}
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">{t('install.database.type') || 'Database Type'}:</span>{' '}
                                    {dbCheck.type}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
                            <p className="text-lg font-medium text-red-700 dark:text-red-400">
                                {t('install.database.error') || 'Could not connect to database'}
                            </p>
                            {dbCheck?.error && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md text-center">
                                    {dbCheck.error}
                                </p>
                            )}
                            <Button
                                variant="outlined"
                                onClick={testDatabase}
                                className="mt-4"
                            >
                                <ArrowPathIcon className="h-4 w-4 mr-2" />
                                {t('install.database.retry') || 'Retry Connection'}
                            </Button>
                        </>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                    <Button variant="outlined" onClick={onBack}>
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={isTesting || !dbCheck?.connected}
                    >
                        {t('install.nav.next') || 'Next'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
