'use client';

import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface InventoryFiltersProps {
  currentFilter?: string;
}

export function InventoryFilters({ currentFilter }: InventoryFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2">
      <Link href="/inventory">
        <Button variant={!currentFilter ? 'default' : 'outline'}>{t('all')}</Button>
      </Link>
      <Link href="/inventory?filter=low_stock">
        <Button variant={currentFilter === 'low_stock' ? 'default' : 'outline'}>
          {t('lowStock')}
        </Button>
      </Link>
    </div>
  );
}

