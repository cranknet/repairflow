'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

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
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t('satisfaction.rating_label')}
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
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
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ticket.status === 'IN_PROGRESS'
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
                  <td className="py-4 px-4">
                    {ticket.satisfactionRating ? (
                      <div className="flex items-center gap-1" title={`${ticket.satisfactionRating.rating}/5 ${ticket.satisfactionRating.comment ? `- ${ticket.satisfactionRating.comment}` : ''}`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          star <= ticket.satisfactionRating.rating ? (
                            <StarIcon key={star} className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <StarOutlineIcon key={star} className="h-4 w-4 text-gray-300" />
                          )
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t('noActiveTickets')}
          </div>
        ) : (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-blue-600 text-base">{ticket.ticketNumber}</p>
                  <p className="text-sm text-gray-700 mt-1">{ticket.deviceIssue}</p>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${ticket.status === 'IN_PROGRESS'
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
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('customer')}:</span>
                  <span className="font-medium text-gray-700">{ticket.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('assignTo')}:</span>
                  <span className="text-gray-600">
                    {ticket.assignedTo?.name || ticket.assignedTo?.username || t('unassigned')}
                  </span>
                </div>
                {ticket.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('pickUpTime')}:</span>
                    <span className="text-gray-600">
                      {format(new Date(ticket.completedAt), 'dd MMM yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}

