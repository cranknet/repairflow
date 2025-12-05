'use client';

import { useLanguage } from '@/contexts/language-context';
import {
    CheckCircleIcon,
    SparklesIcon,
    QuestionMarkCircleIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import type { InstallState } from '../lib/validation';

interface WizardSidebarProps {
    currentStep: number;
    totalSteps: number;
    installState: InstallState;
}

const STEP_TIPS: Record<number, { icon: React.ReactNode; tipKey: string; defaultTip: string }> = {
    0: {
        icon: <SparklesIcon className="h-5 w-5" />,
        tipKey: 'install.sidebar.tip.welcome',
        defaultTip: 'We\'ll check your environment to ensure everything is configured correctly.',
    },
    1: {
        icon: <SparklesIcon className="h-5 w-5" />,
        tipKey: 'install.sidebar.tip.database',
        defaultTip: 'Make sure your database connection is properly configured in .env file.',
    },
    2: {
        icon: <BuildingOffice2Icon className="h-5 w-5" />,
        tipKey: 'install.sidebar.tip.company',
        defaultTip: 'This information will appear on invoices and customer communications.',
    },
    3: {
        icon: <SparklesIcon className="h-5 w-5" />,
        tipKey: 'install.sidebar.tip.branding',
        defaultTip: 'Upload your logo to personalize the system. You can skip this step.',
    },
    4: {
        icon: <SparklesIcon className="h-5 w-5" />,
        tipKey: 'install.sidebar.tip.admin',
        defaultTip: 'Choose a strong password. This account will have full system access.',
    },
    5: {
        icon: <SparklesIcon className="h-5 w-5" />,
        tipKey: 'install.sidebar.tip.preferences',
        defaultTip: 'Configure your timezone and notification preferences.',
    },
    6: {
        icon: <SparklesIcon className="h-5 w-5" />,
        tipKey: 'install.sidebar.tip.sampleData',
        defaultTip: 'Sample data helps you explore the system before adding real data.',
    },
    7: {
        icon: <CheckCircleIcon className="h-5 w-5" />,
        tipKey: 'install.sidebar.tip.finalize',
        defaultTip: 'Review your settings before completing the installation.',
    },
};

export function WizardSidebar({ currentStep, totalSteps, installState }: WizardSidebarProps) {
    const { t } = useLanguage();
    const progress = Math.round(((currentStep + 1) / totalSteps) * 100);
    const tip = STEP_TIPS[currentStep] || STEP_TIPS[0];

    return (
        <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-primary">{progress}%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('install.sidebar.progress') || 'Installation Progress'}
                    </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-primary to-primary/80 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="text-xs text-center text-gray-400 mt-2">
                    {t('install.sidebar.stepOf') || 'Step'} {currentStep + 1} / {totalSteps}
                </div>
            </div>

            {/* Tip Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-sm p-6 border border-blue-100 dark:border-slate-600">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                    <QuestionMarkCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">{t('install.sidebar.tipTitle') || 'Quick Tip'}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t(tip.tipKey) || tip.defaultTip}
                </p>
            </div>

            {/* Logo Preview (if uploaded) */}
            {installState.branding?.logo && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-slate-700 animate-fadeIn">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {t('install.sidebar.logoPreview') || 'Your Logo'}
                    </div>
                    <div className="flex justify-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                        <img
                            src={installState.branding.logo}
                            alt="Company Logo"
                            className="max-h-20 object-contain"
                        />
                    </div>
                </div>
            )}

            {/* Company Summary (if entered) */}
            {installState.company?.company_name && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-slate-700 animate-fadeIn">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3">
                        <BuildingOffice2Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{t('install.sidebar.companySummary') || 'Company'}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p className="font-medium text-gray-800 dark:text-white">{installState.company.company_name}</p>
                        {installState.company.company_email && <p>{installState.company.company_email}</p>}
                    </div>
                </div>
            )}

            {/* Help Links */}
            <div className="text-center text-xs text-gray-400 space-y-1">
                <p>{t('install.sidebar.needHelp') || 'Need help?'}</p>
                <a
                    href="https://github.com/cranknet/repairflow/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                >
                    {t('install.sidebar.visitDocs') || 'Visit Documentation'}
                </a>
            </div>
        </div>
    );
}
