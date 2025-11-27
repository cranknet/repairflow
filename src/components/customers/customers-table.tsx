'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';

interface CustomersTableProps {
  customers: any[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const { t } = useLanguage();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('customerName')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('customerPhone')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('customerEmail')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('totalTickets')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('createdAt')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="py-3 px-4 font-medium">{customer.name}</td>
              <td className="py-3 px-4">{customer.phone}</td>
              <td className="py-3 px-4">{customer.email || '-'}</td>
              <td className="py-3 px-4">{customer._count.tickets}</td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
              </td>
              <td className="py-3 px-4">
                <Link href={`/customers/${customer.id}`}>
                  <Button variant="ghost" size="sm">
                    {t('view')}
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

