'use client';

import { useLanguage } from '@/contexts/language-context';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CubeIcon,
    WrenchScrewdriverIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface ServiceOnlyChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectAddParts: () => void;
    onSelectServiceOnly: () => void;
    isLoading?: boolean;
}

/**
 * Modal that appears when clicking on WAITING_FOR_PARTS status.
 * Allows the user to choose between:
 * 1. Adding/managing parts for the repair
 * 2. Marking the repair as service-only (no parts required)
 */
export function ServiceOnlyChoiceModal({
    isOpen,
    onClose,
    onSelectAddParts,
    onSelectServiceOnly,
    isLoading = false,
}: ServiceOnlyChoiceModalProps) {
    const { t } = useLanguage();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('ticket.serviceOnly.title')}</DialogTitle>
                    <DialogDescription>
                        {t('ticket.serviceOnly.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {/* Add Parts Option */}
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onSelectAddParts();
                        }}
                        disabled={isLoading}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/50 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                            <CubeIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-orange-800 dark:text-orange-200">
                                {t('ticket.serviceOnly.addParts')}
                            </p>
                            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                                {t('ticket.serviceOnly.addPartsDescription')}
                            </p>
                        </div>
                    </button>

                    {/* Service Only Option */}
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onSelectServiceOnly();
                        }}
                        disabled={isLoading}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                            <WrenchScrewdriverIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-purple-800 dark:text-purple-200">
                                {t('ticket.serviceOnly.markServiceOnly')}
                            </p>
                            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                {t('ticket.serviceOnly.markServiceOnlyDescription')}
                            </p>
                        </div>
                    </button>
                </div>

                {/* Examples hint */}
                <div className="flex items-start gap-2 mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <InformationCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('ticket.serviceOnly.examples')}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
