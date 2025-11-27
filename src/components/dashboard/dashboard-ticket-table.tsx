'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';

interface DashboardTicketTableProps {
  tickets: any[];
}

export function DashboardTicketTable({ tickets }: DashboardTicketTableProps) {
  const { t } = useLanguage();

  const getStatusTranslation = (status: string) => {
    const statusMap: Record<string, string> = {
      'RECEIVED': t('received'),
      'IN_PROGRESS': t('inProgress'),
      'WAITING_FOR_PARTS': t('waitingForParts'),
      'REPAIRED': t('repaired'),
      'COMPLETED': t('completed'),
      'CANCELLED': t('cancelled'),
    };
    return statusMap[status] || status.replace('_', ' ');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('ticketNumber')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('task')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('pickUpTime')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('assignTo')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('customer')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-500">
                {t('noActiveTickets')}
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-4">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="font-semibold text-blue-600 hover:text-purple-600 transition-colors"
                  >
                    {ticket.ticketNumber}
                  </Link>
                </td>
                <td className="py-4 px-4 text-gray-700">{ticket.deviceIssue}</td>
                <td className="py-4 px-4 text-gray-600">
                  {ticket.completedAt
                    ? format(new Date(ticket.completedAt), 'dd MMM yyyy (h:mma)')
                    : 'N/A'}
                </td>
                <td className="py-4 px-4 text-gray-600">
                  {ticket.assignedTo?.name || ticket.assignedTo?.username || t('unassigned')}
                </td>
                <td className="py-4 px-4 font-medium text-gray-700">{ticket.customer.name}</td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      ticket.status === 'IN_PROGRESS'
                        ? 'bg-orange-100 text-orange-700'
                        : ticket.status === 'WAITING_FOR_PARTS'
                        ? 'bg-amber-100 text-amber-700'
                        : ticket.status === 'REPAIRED'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {getStatusTranslation(ticket.status)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

