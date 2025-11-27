'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { PartStatusBadge } from './part-status-badge';

interface InventoryTableProps {
  parts: any[];
}

export function InventoryTable({ parts }: InventoryTableProps) {
  const { t } = useLanguage();

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
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => {
            const isLowStock = part.quantity <= part.reorderLevel;
            return (
              <tr
                key={part.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="py-3 px-4 font-medium">{part.name}</td>
                <td className="py-3 px-4 font-mono text-sm">{part.sku}</td>
                <td className="py-3 px-4">{part.quantity}</td>
                <td className="py-3 px-4">{part.reorderLevel}</td>
                <td className="py-3 px-4">${part.unitPrice.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <PartStatusBadge isLowStock={isLowStock} />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/inventory/${part.id}`}>
                      <Button variant="ghost" size="sm">
                        {t('view')}
                      </Button>
                    </Link>
                    <Link href={`/inventory/${part.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        {t('edit')}
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

