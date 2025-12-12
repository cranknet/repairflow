'use client';

import { useLanguage } from '@/contexts/language-context';
import {
    CheckIcon,
    DevicePhoneMobileIcon,
    UserIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { STEPS } from './constants';

interface WizardStepIndicatorProps {
    currentStep: number;
}

export function WizardStepIndicator({ currentStep }: WizardStepIndicatorProps) {
    const { t } = useLanguage();

    const stepIcons = [DevicePhoneMobileIcon, UserIcon, DocumentTextIcon];

    const progress = ((currentStep) / (STEPS.length - 1)) * 100;

    return (
        <div className="mb-6">
            {/* Progress bar background */}
            <div className="relative">
                <div className="flex justify-between items-center relative z-10">
                    {STEPS.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const StepIcon = stepIcons[index];

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                {/* Step circle with icon */}
                                <div
                                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                      transition-all duration-300 border-2
                      ${isCompleted
                                            ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-primary-900/50'
                                            : isCurrent
                                                ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-primary-900/50 scale-110'
                                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                                        }
                    `}
                                >
                                    {isCompleted ? (
                                        <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    ) : (
                                        <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    )}
                                </div>
                                {/* Step label */}
                                <span
                                    className={`
                      mt-2 text-xs sm:text-sm font-medium text-center
                      ${isCompleted || isCurrent
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                        }
                    `}
                                >
                                    {t(step.label)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Progress track (behind circles) */}
                <div className="absolute top-5 sm:top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0 mx-5 sm:mx-6" />

                {/* Progress fill */}
                <div
                    className="absolute top-5 sm:top-6 left-0 h-0.5 bg-primary-600 transition-all duration-500 -z-0 mx-5 sm:mx-6"
                    style={{ width: `calc(${progress}% - ${progress === 100 ? '0px' : '0px'})` }}
                />
            </div>
        </div>
    );
}
