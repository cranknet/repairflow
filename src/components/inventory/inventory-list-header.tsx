'use client';

import { useLanguage } from '@/contexts/language-context';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';

interface InventoryListHeaderProps {
  count: number;
}

export function InventoryListHeader({ count }: InventoryListHeaderProps) {
  const { t } = useLanguage();

  return (
    <TranslatedCardTitle translationKey="parts">
      {' '}({count})
    </TranslatedCardTitle>
  );
}

