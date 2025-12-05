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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-slate-700">
            <nav aria-label="Progress">
                <ol className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const isPending = index > currentStep;

                        return (
                            <li
                                key={step}
                                className="relative flex flex-1 flex-col items-center group"
                                aria-current={isCurrent ? 'step' : undefined}
                            >
                                {/* Connector line */}
                                {index < steps.length - 1 && (
                                    <div
                                        className="absolute left-[50%] top-5 h-0.5 w-full"
                                        style={{ left: '50%' }}
                                    >
                                        <div
                                            className={cn(
                                                'h-full transition-all duration-500 ease-out',
                                                isCompleted
                                                    ? 'bg-gradient-to-r from-primary to-primary/80'
                                                    : 'bg-gray-200 dark:bg-slate-600'
                                            )}
                                            style={{
                                                width: isCompleted ? '100%' : '0%',
                                                transition: 'width 0.5s ease-out'
                                            }}
                                        />
                                        <div
                                            className={cn(
                                                'absolute inset-0 -z-10',
                                                'bg-gray-200 dark:bg-slate-600'
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Step circle */}
                                <div
                                    className={cn(
                                        'relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300',
                                        isCompleted && 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-md shadow-primary/25 scale-100',
                                        isCurrent && 'border-2 border-primary bg-white text-primary dark:bg-slate-900 ring-4 ring-primary/20 scale-110',
                                        isPending && 'border-2 border-gray-300 bg-white text-gray-400 dark:border-slate-600 dark:bg-slate-800 scale-100'
                                    )}
                                >
                                    {isCompleted ? (
                                        <CheckIcon className="h-5 w-5 animate-scaleIn" />
                                    ) : (
                                        <span className={cn(
                                            isCurrent && 'animate-pulse'
                                        )}>
                                            {index + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Step label - only show on larger screens */}
                                <span
                                    className={cn(
                                        'mt-3 text-xs font-medium text-center transition-all duration-300 hidden sm:block max-w-[80px] leading-tight',
                                        isCurrent && 'text-primary font-semibold',
                                        isPending && 'text-gray-400 dark:text-slate-500',
                                        isCompleted && 'text-gray-600 dark:text-slate-300'
                                    )}
                                >
                                    {t(stepLabels[step]) || step}
                                </span>

                                {/* Tooltip on hover (mobile friendly) */}
                                <div className={cn(
                                    'absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none transition-opacity sm:hidden',
                                    'group-active:opacity-100'
                                )}>
                                    {t(stepLabels[step]) || step}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}

