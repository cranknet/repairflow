'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { BeakerIcon, UserGroupIcon, TruckIcon, CubeIcon, CheckIcon, ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BeakerIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('install.sampleData.title') || 'Sample Data'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('install.sampleData.description') || 'Choose whether to load sample data.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
                {/* Toggle Options */}
                <div className="space-y-4">
                    {/* Load Sample Data Option */}
                    <button
                        type="button"
                        onClick={() => setLoadSampleData(true)}
                        className={`w-full p-5 border-2 rounded-xl text-left transition-all ${loadSampleData
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-gray-200 dark:border-slate-600 hover:border-primary/50'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${loadSampleData ? 'border-primary bg-primary' : 'border-gray-300 dark:border-slate-500'
                                }`}>
                                {loadSampleData && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-800 dark:text-gray-200">{t('install.sampleData.loadLabel') || 'Load sample customers and parts'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {t('install.sampleData.loadHelp') || 'This will create example customers, suppliers, and parts to help you explore RepairFlow.'}
                                </p>

                                {/* Sample data details */}
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        {t('install.sampleData.includes') || 'Sample data includes:'}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {sampleDataItems.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center shadow-sm">
                                                    <item.icon className="h-4 w-4 text-primary" />
                                                </div>
                                                <span>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Skip Option */}
                    <button
                        type="button"
                        onClick={() => setLoadSampleData(false)}
                        className={`w-full p-5 border-2 rounded-xl text-left transition-all ${!loadSampleData
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-gray-200 dark:border-slate-600 hover:border-primary/50'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${!loadSampleData ? 'border-primary bg-primary' : 'border-gray-300 dark:border-slate-500'
                                }`}>
                                {!loadSampleData && <XMarkIcon className="h-3.5 w-3.5 text-white" />}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">{t('install.sampleData.skip') || 'Start with empty database'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    You can always add your own customers, suppliers, and parts later.
                                </p>
                            </div>
                        </div>
                    </button>
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
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="gap-2 min-w-[120px]"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                {loadSampleData ? (t('loading') || 'Loading...') : (t('saving') || 'Saving...')}
                            </span>
                        ) : (
                            <>
                                {t('install.nav.next') || 'Next'}
                                <ArrowRightIcon className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

