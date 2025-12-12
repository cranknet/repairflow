'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface WizardNavigationProps {
    onBack: () => void;
    onNext: () => void;
    onSubmit: () => void;
    onCancel: () => void;
    canGoBack: boolean;
    canGoNext: boolean;
    isLastStep: boolean;
    isSubmitting: boolean;
}

export function WizardNavigation({
    onBack,
    onNext,
    onSubmit,
    onCancel,
    canGoBack,
    canGoNext,
    isLastStep,
    isSubmitting,
}: WizardNavigationProps) {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={!canGoBack || isSubmitting}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('previousStep')}</span>
                <span className="sm:hidden">{t('back') || 'Back'}</span>
            </Button>

            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial"
                >
                    {t('cancel')}
                </Button>

                {isLastStep ? (
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={!canGoNext || isSubmitting}
                        className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                    >
                        {isSubmitting ? (
                            <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">{t('creating')}</span>
                                <span className="sm:hidden">...</span>
                            </>
                        ) : (
                            <>
                                <CheckIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('createTicket')}</span>
                                <span className="sm:hidden">{t('create') || 'Create'}</span>
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={onNext}
                        disabled={!canGoNext}
                        className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                    >
                        <span className="hidden sm:inline">{t('nextStep')}</span>
                        <span className="sm:hidden">{t('next') || 'Next'}</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
