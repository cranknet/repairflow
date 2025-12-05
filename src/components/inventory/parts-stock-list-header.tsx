'use client';

import { useLanguage } from '@/contexts/language-context';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PartsStockListHeaderProps {
  count: number;
  lowStockCount: number;
  searchQuery?: string;
  supplierId?: string;
  userRole?: string;
  onCreate?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
}

export function PartsStockListHeader({ 
  count, 
  lowStockCount,
  searchQuery,
  supplierId,
  userRole,
  onCreate,
  onRefresh,
  onExport
}: PartsStockListHeaderProps) {
  const { t } = useLanguage();

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
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
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            icon={<span className="material-symbols-outlined text-sm">refresh</span>}
            aria-label={t('refresh') || 'Refresh'}
            title={t('refresh') || 'Refresh'}
          >
            <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
          </Button>
        )}
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<span className="material-symbols-outlined text-sm">download</span>}
            aria-label={t('export') || 'Export'}
            title={t('export') || 'Export'}
          >
            <span className="hidden sm:inline">{t('export') || 'Export'}</span>
          </Button>
        )}
        {onCreate && userRole === 'ADMIN' && (
          <Button
            variant="default"
            size="sm"
            onClick={onCreate}
            icon={<span className="material-symbols-outlined text-sm">add</span>}
            aria-label={t('addPart') || 'Add Part'}
          >
            <span className="hidden sm:inline">{t('addPart') || 'Add Part'}</span>
            <span className="sm:hidden">{t('add') || 'Add'}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

