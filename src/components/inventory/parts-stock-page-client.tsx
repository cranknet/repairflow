'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PartsStockSearch } from '@/components/inventory/parts-stock-search';
import { PartsStockListHeader } from '@/components/inventory/parts-stock-list-header';
import { NoPartsFound } from '@/components/inventory/no-parts-found';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { PartsStockTable } from '@/components/inventory/parts-stock-table';
import { PartFormModal } from '@/components/finance/PartFormModal';
import { useLanguage } from '@/contexts/language-context';

interface Part {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  supplierId: string | null;
  supplier: {
    id: string;
    name: string;
  } | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface PartsStockPageClientProps {
  parts: Part[];
  suppliers: Supplier[];
  search?: string;
  supplierId?: string;
  userRole: string;
}

export function PartsStockPageClient({ 
  parts, 
  suppliers,
  search, 
  supplierId,
  userRole 
}: PartsStockPageClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
    setIsModalOpen(false);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Name', 'SKU', 'Description', 'Quantity', 'Reorder Level', 'Unit Price', 'Supplier'];
    const rows = parts.map(part => [
      part.name,
      part.sku,
      part.description || '',
      part.quantity.toString(),
      part.reorderLevel.toString(),
      part.unitPrice.toFixed(2),
      part.supplier?.name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `parts-stock-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const lowStockCount = parts.filter(p => p.quantity <= p.reorderLevel).length;

  return (
    <>
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('inventory.stock')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('managePartsStock')}</p>
            {lowStockCount > 0 && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                {t('lowStockAlert', { count: lowStockCount })}
              </p>
            )}
          </div>
        </div>

        {/* Search Filter */}
        <Card>
          <CardHeader>
            <TranslatedCardTitle translationKey="searchParts" />
          </CardHeader>
          <CardContent>
            <PartsStockSearch suppliers={suppliers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <PartsStockListHeader 
              count={parts.length} 
              lowStockCount={lowStockCount}
              searchQuery={search}
              supplierId={supplierId}
              userRole={userRole}
              onCreate={() => setIsModalOpen(true)}
              onRefresh={handleRefresh}
              onExport={handleExport}
            />
          </CardHeader>
          <CardContent>
            {parts.length === 0 ? (
              <NoPartsFound />
            ) : (
              <PartsStockTable parts={parts} userRole={userRole} />
            )}
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <PartFormModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

