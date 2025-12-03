'use client';

import { useLanguage } from '@/contexts/language-context';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';

interface SuppliersListHeaderProps {
  count: number;
  searchQuery?: string;
}

export function SuppliersListHeader({ count, searchQuery }: SuppliersListHeaderProps) {
  const { t } = useLanguage();

  return (
    <TranslatedCardTitle translationKey="allSuppliers">
      {' '}({count})
      {searchQuery && (
        <span className="text-sm font-normal text-gray-500 ml-2">
          - {t('filteredBy')} &quot;{searchQuery}&quot;
        </span>
      )}
    </TranslatedCardTitle>
  );
}

