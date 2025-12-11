'use client';

import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

type PeriodFilter = 'today' | 'thisMonth' | 'lastMonth';

interface DashboardTicketHeaderProps {
  selectedPeriod: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

export function DashboardTicketHeader({ selectedPeriod, onPeriodChange }: DashboardTicketHeaderProps) {
  const { t } = useLanguage();

  const periods: { id: PeriodFilter; label: string }[] = [
    { id: 'today', label: t('today') || 'Today' },
    { id: 'thisMonth', label: t('thisMonth') || 'This Month' },
    { id: 'lastMonth', label: t('lastMonth') || 'Last Month' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex gap-2">
        <button className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-lg shadow-soft">
          {t('ticket').toUpperCase()}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => onPeriodChange(period.id)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap',
              selectedPeriod === period.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            {period.label.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
