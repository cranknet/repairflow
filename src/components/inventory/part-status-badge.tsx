'use client';

import { useLanguage } from '@/contexts/language-context';

interface PartStatusBadgeProps {
  isLowStock: boolean;
}

export function PartStatusBadge({ isLowStock }: PartStatusBadgeProps) {
  const { t } = useLanguage();

  return isLowStock ? (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      {t('lowStock')}
    </span>
  ) : (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      {t('inStock')}
    </span>
  );
}

