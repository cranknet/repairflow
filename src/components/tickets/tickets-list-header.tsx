'use client';

import { useLanguage } from '@/contexts/language-context';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';

interface TicketsListHeaderProps {
  count: number;
  searchQuery?: string;
}

export function TicketsListHeader({ count, searchQuery }: TicketsListHeaderProps) {
  const { t } = useLanguage();

  return (
    <TranslatedCardTitle translationKey="allTickets">
      {' '}({count})
      {searchQuery && (
        <span className="text-sm font-normal text-gray-500 ml-2">
          - {t('filteredBy')} &quot;{searchQuery}&quot;
        </span>
      )}
    </TranslatedCardTitle>
  );
}

