'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { TicketStatusBadge } from './ticket-status-badge';

interface TicketsTableProps {
  tickets: any[];
}

export function TicketsTable({ tickets }: TicketsTableProps) {
  const { t } = useLanguage();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityTranslation = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'LOW': t('low'),
      'MEDIUM': t('medium'),
      'HIGH': t('high'),
      'URGENT': t('urgent'),
    };
    return priorityMap[priority] || priority;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('ticketNumber')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('customer')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('device')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('status')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('priority')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('estimatedPrice')}
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
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="py-3 px-4">
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="font-medium text-primary-600 hover:underline"
                >
                  {ticket.ticketNumber}
                </Link>
              </td>
              <td className="py-3 px-4">{ticket.customer.name}</td>
              <td className="py-3 px-4">
                {ticket.deviceBrand} {ticket.deviceModel}
              </td>
              <td className="py-3 px-4">
                <TicketStatusBadge status={ticket.status} />
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                    ticket.priority
                  )}`}
                >
                  {getPriorityTranslation(ticket.priority)}
                </span>
              </td>
              <td className="py-3 px-4">${ticket.estimatedPrice.toFixed(2)}</td>
              <td className="py-3 px-4">
                {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
              </td>
              <td className="py-3 px-4">
                <Link href={`/tickets/${ticket.id}`}>
                  <button className="text-primary-600 hover:underline text-sm">{t('view')}</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

