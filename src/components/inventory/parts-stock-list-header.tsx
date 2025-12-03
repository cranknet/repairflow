'use client';

import { useLanguage } from '@/contexts/language-context';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { Badge } from '@/components/ui/badge';

interface PartsStockListHeaderProps {
  count: number;
  lowStockCount: number;
  searchQuery?: string;
  supplierId?: string;
}

export function PartsStockListHeader({ 
  count, 
  lowStockCount,
  searchQuery,
  supplierId 
}: PartsStockListHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <TranslatedCardTitle translationKey="allParts">
        {' '}({count})
        {searchQuery && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            - {t('filteredBy')} &quot;{searchQuery}&quot;
          </span>
        )}
        {supplierId && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            - {t('filteredBySupplier')}
          </span>
        )}
      </TranslatedCardTitle>
      {lowStockCount > 0 && (
        <Badge variant="warning" className="ml-2">
          <span className="material-symbols-outlined text-sm mr-1">warning</span>
          {lowStockCount} {t('inventory.lowStock')}
        </Badge>
      )}
    </div>
  );
}

