'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { WizardProgress } from './wizard-progress';
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
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
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

    return (
        <div className="w-full max-w-2xl mx-auto">
            <WizardProgress
                steps={STEPS}
                currentStep={currentStep}
            />
            <div className="mt-8">
                {renderStep()}
            </div>
        </div>
    );
}
