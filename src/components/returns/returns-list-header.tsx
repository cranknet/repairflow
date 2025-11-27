'use client';

import { useLanguage } from '@/contexts/language-context';

export function ReturnsListHeader() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('returns')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('manageReturns')}
        </p>
      </div>
    </div>
  );
}

