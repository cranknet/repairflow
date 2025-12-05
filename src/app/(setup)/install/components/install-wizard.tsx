'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { WizardProgress } from './wizard-progress';
import { WizardSidebar } from './wizard-sidebar';
import { WelcomeStep } from './steps/welcome-step';
import { DatabaseStep } from './steps/database-step';
import { CompanyStep } from './steps/company-step';
import { BrandingStep } from './steps/branding-step';
import { AdminStep } from './steps/admin-step';
import { PreferencesStep } from './steps/preferences-step';
import { SampleDataStep } from './steps/sample-data-step';
import { FinalizeStep } from './steps/finalize-step';
import type { InstallState } from '../lib/validation';

const STEPS = [
    'welcome',
    'database',
    'company',
    'branding',
    'admin',
    'preferences',
    'sampleData',
    'finalize',
] as const;

type Step = typeof STEPS[number];

export function InstallWizard() {
    const router = useRouter();
    const { t } = useLanguage();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [installState, setInstallState] = useState<InstallState>({
        currentStep: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
    const contentRef = useRef<HTMLDivElement>(null);

    // Load state from sessionStorage on mount
    useEffect(() => {
        const saved = sessionStorage.getItem('installState');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setInstallState(parsed);
                setCurrentStep(parsed.currentStep || 0);
            } catch (e) {
                console.error('Failed to parse install state:', e);
            }
        }
    }, []);

    // Save state to sessionStorage on change
    useEffect(() => {
        sessionStorage.setItem('installState', JSON.stringify({
            ...installState,
            currentStep,
        }));
    }, [installState, currentStep]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setSlideDirection('left');
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setIsTransitioning(false);
            }, 200);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setSlideDirection('right');
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
                setIsTransitioning(false);
            }, 200);
        }
    };

    const updateState = (updates: Partial<InstallState>) => {
        setInstallState(prev => ({ ...prev, ...updates }));
    };

    const handleComplete = () => {
        // Clear session storage
        sessionStorage.removeItem('installState');
        // Redirect to login
        router.push('/login');
    };

    const stepProps = {
        onNext: handleNext,
        onBack: handleBack,
        installState,
        updateState,
        isLoading,
        setIsLoading,
    };

    const renderStep = () => {
        switch (STEPS[currentStep]) {
            case 'welcome':
                return <WelcomeStep {...stepProps} />;
            case 'database':
                return <DatabaseStep {...stepProps} />;
            case 'company':
                return <CompanyStep {...stepProps} />;
            case 'branding':
                return <BrandingStep {...stepProps} />;
            case 'admin':
                return <AdminStep {...stepProps} />;
            case 'preferences':
                return <PreferencesStep {...stepProps} />;
            case 'sampleData':
                return <SampleDataStep {...stepProps} />;
            case 'finalize':
                return <FinalizeStep {...stepProps} onComplete={handleComplete} />;
            default:
                return null;
        }
    };

    // Animation classes for step transitions
    const getTransitionClasses = () => {
        if (isTransitioning) {
            return slideDirection === 'left'
                ? 'opacity-0 -translate-x-4'
                : 'opacity-0 translate-x-4';
        }
        return 'opacity-100 translate-x-0';
    };

    return (
        <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-8">
            {/* Stepper - full width on top */}
            <WizardProgress
                steps={STEPS}
                currentStep={currentStep}
            />

            {/* Main content area - two columns on desktop */}
            <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main content - left side (2/3 width) */}
                <main className="lg:col-span-2">
                    <div
                        ref={contentRef}
                        className={`
                            transform transition-all duration-200 ease-out
                            ${getTransitionClasses()}
                        `}
                    >
                        {renderStep()}
                    </div>
                </main>

                {/* Sidebar - right side (1/3 width) - hidden on mobile */}
                <aside className="hidden lg:block lg:col-span-1">
                    <div className="sticky top-6">
                        <WizardSidebar
                            currentStep={currentStep}
                            totalSteps={STEPS.length}
                            installState={installState}
                        />
                    </div>
                </aside>
            </div>

            {/* Mobile progress indicator */}
            <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-3 z-50">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                        {t('install.sidebar.stepOf') || 'Step'} {currentStep + 1} / {STEPS.length}
                    </span>
                    <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-primary font-medium">
                        {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
                    </span>
                </div>
            </div>

            {/* Add padding at bottom for mobile progress bar */}
            <div className="h-16 lg:hidden" />
        </div>
    );
}

