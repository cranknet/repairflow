'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BeakerIcon, UserGroupIcon, TruckIcon, CubeIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { InstallState } from '../../lib/validation';

interface SampleDataStepProps {
    onNext: () => void;
    onBack: () => void;
    installState: InstallState;
    updateState: (updates: Partial<InstallState>) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export function SampleDataStep({
    onNext,
    onBack,
    installState,
    updateState,
    isLoading,
    setIsLoading
}: SampleDataStepProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [loadSampleData, setLoadSampleData] = useState(installState.loadSampleData ?? false);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/install/sample-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loadSampleData }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load sample data');
            }

            updateState({ loadSampleData });
            onNext();
        } catch (error) {
            toast({
                title: t('error') || 'Error',
                description: error instanceof Error ? error.message : 'Failed to load sample data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const sampleDataItems = [
        { icon: UserGroupIcon, label: t('install.sampleData.customers') || '5 sample customers' },
        { icon: TruckIcon, label: t('install.sampleData.suppliers') || '3 sample suppliers' },
        { icon: CubeIcon, label: t('install.sampleData.parts') || '5 sample parts' },
    ];

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <BeakerIcon className="h-16 w-16 text-primary" />
                </div>
                <CardTitle>{t('install.sampleData.title') || 'Sample Data'}</CardTitle>
                <CardDescription>
                    {t('install.sampleData.description') || 'Choose whether to load sample data.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Toggle Options */}
                <div className="space-y-4">
                    {/* Load Sample Data Option */}
                    <button
                        type="button"
                        onClick={() => setLoadSampleData(true)}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${loadSampleData
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${loadSampleData ? 'border-primary bg-primary' : 'border-gray-300'
                                }`}>
                                {loadSampleData && <CheckIcon className="h-3 w-3 text-white" />}
                            </div>
                            <div>
                                <p className="font-medium">{t('install.sampleData.loadLabel') || 'Load sample customers and parts'}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {t('install.sampleData.loadHelp') || 'This will create example customers, suppliers, and parts to help you explore RepairFlow.'}
                                </p>

                                {/* Sample data details */}
                                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm font-medium mb-2">
                                        {t('install.sampleData.includes') || 'Sample data includes:'}
                                    </p>
                                    <ul className="space-y-2">
                                        {sampleDataItems.map((item, index) => (
                                            <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <item.icon className="h-4 w-4" />
                                                {item.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Skip Option */}
                    <button
                        type="button"
                        onClick={() => setLoadSampleData(false)}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${!loadSampleData
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${!loadSampleData ? 'border-primary bg-primary' : 'border-gray-300'
                                }`}>
                                {!loadSampleData && <CheckIcon className="h-3 w-3 text-white" />}
                            </div>
                            <div>
                                <p className="font-medium">{t('install.sampleData.skip') || 'Start with empty database'}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    You can always add your own customers, suppliers, and parts later.
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                    <Button type="button" variant="outlined" onClick={onBack} disabled={isLoading}>
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                {loadSampleData ? (t('loading') || 'Loading...') : (t('saving') || 'Saving...')}
                            </span>
                        ) : (
                            t('install.nav.next') || 'Next'
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
