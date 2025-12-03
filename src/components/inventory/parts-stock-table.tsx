'use client';

import { useLanguage } from '@/contexts/language-context';
import { Badge } from '@/components/ui/badge';

interface Part {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  supplier: {
    id: string;
    name: string;
  } | null;
}

interface PartsStockTableProps {
  parts: Part[];
  userRole: string;
}

export function PartsStockTable({ parts, userRole }: PartsStockTableProps) {
  const { t } = useLanguage();

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) {
      return { label: t('outOfStock'), variant: 'warning' as const, icon: 'error' };
    } else if (quantity <= reorderLevel) {
      return { label: t('inventory.lowStock'), variant: 'warning' as const, icon: 'warning' };
    } else {
      return { label: t('inventory.inStock'), variant: 'default' as const, icon: 'check_circle' };
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('partName')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('sku')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('supplier')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('quantity')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('reorderLevel')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('unitPrice')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => {
            const stockStatus = getStockStatus(part.quantity, part.reorderLevel);
            return (
              <tr
                key={part.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="py-3 px-4 font-medium">{part.name}</td>
                <td className="py-3 px-4 font-mono text-sm">{part.sku}</td>
                <td className="py-3 px-4">{part.supplier?.name || '-'}</td>
                <td className="py-3 px-4">{part.quantity}</td>
                <td className="py-3 px-4">{part.reorderLevel}</td>
                <td className="py-3 px-4">
                  {part.unitPrice > 0 ? `$${part.unitPrice.toFixed(2)}` : '-'}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={stockStatus.variant} className="flex items-center gap-1 w-fit">
                    <span className="material-symbols-outlined text-sm">
                      {stockStatus.icon}
                    </span>
                    {stockStatus.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

