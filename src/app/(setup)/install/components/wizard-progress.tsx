'use client';

import { useLanguage } from '@/contexts/language-context';
import { CheckIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
    steps: readonly string[];
    currentStep: number;
}

const stepLabels: Record<string, string> = {
    welcome: 'install.step.welcome',
    database: 'install.step.database',
    company: 'install.step.company',
    branding: 'install.step.branding',
    admin: 'install.step.admin',
    preferences: 'install.step.preferences',
    sampleData: 'install.step.sampleData',
    finalize: 'install.step.finalize',
};

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
    const { t } = useLanguage();

    return (
        <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isPending = index > currentStep;

                    return (
                        <li key={step} className="relative flex flex-col items-center">
                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        'absolute left-[50%] top-4 h-0.5 w-full -translate-y-1/2',
                                        isCompleted ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                    )}
                                    style={{ left: '50%', width: 'calc(100% + 1rem)' }}
                                />
                            )}

                            {/* Step circle */}
                            <div
                                className={cn(
                                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                                    isCompleted && 'bg-primary text-white',
                                    isCurrent && 'border-2 border-primary bg-white text-primary dark:bg-gray-900',
                                    isPending && 'border-2 border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-800'
                                )}
                            >
                                {isCompleted ? (
                                    <CheckIcon className="h-4 w-4" />
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </div>

                            {/* Step label - only show on larger screens */}
                            <span
                                className={cn(
                                    'mt-2 hidden text-xs font-medium sm:block',
                                    isCurrent && 'text-primary',
                                    isPending && 'text-gray-500',
                                    isCompleted && 'text-gray-700 dark:text-gray-300'
                                )}
                            >
                                {t(stepLabels[step]) || step}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
