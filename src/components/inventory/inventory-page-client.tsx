'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InventoryFilters } from '@/components/inventory/inventory-filters';
import { InventoryListHeader } from '@/components/inventory/inventory-list-header';
import { NoPartsFound } from '@/components/inventory/no-parts-found';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { NewPartModal } from '@/components/inventory/new-part-modal';
import { useLanguage } from '@/contexts/language-context';

interface Part {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  supplier: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface InventoryPageClientProps {
  parts: Part[];
  filter?: string;
  search?: string;
}

export function InventoryPageClient({ parts, filter, search }: InventoryPageClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('inventory')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('manageInventory')}</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>{t('addPart')}</Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <TranslatedCardTitle translationKey="filters" />
          </CardHeader>
          <CardContent>
            <InventoryFilters currentFilter={filter} />
          </CardContent>
        </Card>

        {/* Parts List */}
        <Card>
          <CardHeader>
            <InventoryListHeader count={parts.length} />
          </CardHeader>
          <CardContent>
            {parts.length === 0 ? (
              <NoPartsFound />
            ) : (
              <InventoryTable parts={parts} />
            )}
          </CardContent>
        </Card>
      </div>

      <NewPartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

