'use client';

import { useLanguage } from '@/contexts/language-context';

export function DashboardTicketHeader() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <button className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-lg shadow-soft">
          {t('ticket').toUpperCase()}
        </button>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-lg shadow-soft">
          {t('today').toUpperCase()}
        </button>
        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
          {t('thisMonth').toUpperCase()}
        </button>
        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
          {t('lastMonth').toUpperCase()}
        </button>
      </div>
    </div>
  );
}

