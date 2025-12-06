'use client';

import { useLanguage } from '@/contexts/language-context';

interface TicketStatusBadgeProps {
  status: string;
  className?: string;
  hasPendingReturn?: boolean;
}

export function TicketStatusBadge({ status, className = '', hasPendingReturn = false }: TicketStatusBadgeProps) {
  const { t } = useLanguage();

  const getStatusTranslation = (status: string) => {
    const statusMap: Record<string, string> = {
      'RECEIVED': t('received'),
      'IN_PROGRESS': t('inProgress'),
      'WAITING_FOR_PARTS': t('waitingForParts'),
      'REPAIRED': t('repaired'),
      'COMPLETED': t('completed'),
      'CANCELLED': t('cancelled'),
      'RETURNED': t('returned') || 'Returned',
    };
    return statusMap[status] || status.replace('_', ' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'WAITING_FOR_PARTS':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'REPAIRED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'RETURNED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
        {getStatusTranslation(status)}
      </span>
      {hasPendingReturn && (
        <span
          className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          title={t('returnPendingTooltip')}
        >
          ⏳ {t('returnPending')}
        </span>
      )}
    </div>
  );
}

