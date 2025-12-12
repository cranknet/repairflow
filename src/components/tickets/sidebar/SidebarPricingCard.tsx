'use client';

import { useLanguage } from '@/contexts/language-context';
import { BanknotesIcon } from '@heroicons/react/24/outline';

interface SidebarPricingCardProps {
    estimatedPrice: number;
    finalPrice: number | null;
    paid: boolean;
}

export function SidebarPricingCard({ estimatedPrice, finalPrice, paid }: SidebarPricingCardProps) {
    const { t } = useLanguage();

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <BanknotesIcon className="h-[18px] w-[18px] text-gray-500" />
                    {t('pricing')}
                </h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${paid
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                    {paid ? t('paid') : t('unpaid')}
                </span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('estimatedPrice')}</span>
                    <span className="font-medium">${estimatedPrice.toFixed(2)}</span>
                </div>
                {finalPrice !== null && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('finalPrice')}</span>
                        <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
                            ${finalPrice.toFixed(2)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
