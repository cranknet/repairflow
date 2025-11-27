'use client';

import { useLanguage } from '@/contexts/language-context';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';

interface CustomersListHeaderProps {
  count: number;
  searchQuery?: string;
}

export function CustomersListHeader({ count, searchQuery }: CustomersListHeaderProps) {
  const { t } = useLanguage();

  return (
    <TranslatedCardTitle translationKey="allCustomers">
      {' '}({count})
      {searchQuery && (
        <span className="text-sm font-normal text-gray-500 ml-2">
          - {t('filteredBy')} &quot;{searchQuery}&quot;
        </span>
      )}
    </TranslatedCardTitle>
  );
}

