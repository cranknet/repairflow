'use client';

import { useLanguage } from '@/contexts/language-context';

interface ContactMessageStatusBadgeProps {
  status: 'NEW' | 'READ' | 'ARCHIVED';
  className?: string;
}

export function ContactMessageStatusBadge({ status, className = '' }: ContactMessageStatusBadgeProps) {
  const { t } = useLanguage();

  const getStatusTranslation = (status: string) => {
    const statusMap: Record<string, string> = {
      'NEW': t('contact.status.new'),
      'READ': t('contact.status.read'),
      'ARCHIVED': t('contact.status.archived'),
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'READ':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'ARCHIVED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {status === 'NEW' && (
        <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
      )}
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
        {getStatusTranslation(status)}
      </span>
    </div>
  );
}

