'use client';

import { useLanguage } from '@/contexts/language-context';

interface ContactMessageStatusBadgeProps {
  status: 'NEW' | 'READ' | 'ARCHIVED';
  className?: string;
}

const statusConfig = {
  NEW: {
    icon: 'mark_email_unread',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  READ: {
    icon: 'drafts',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
  ARCHIVED: {
    icon: 'archive',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
};

export function ContactMessageStatusBadge({ status, className = '' }: ContactMessageStatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusConfig[status];

  const getStatusTranslation = (status: string) => {
    const statusMap: Record<string, string> = {
      'NEW': t('contact.status.new'),
      'READ': t('contact.status.read'),
      'ARCHIVED': t('contact.status.archived'),
    };
    return statusMap[status] || status;
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {status === 'NEW' && (
        <span className={`h-2 w-2 rounded-full ${config.dot} animate-pulse`} />
      )}
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        <span className="material-symbols-outlined text-sm">{config.icon}</span>
        {getStatusTranslation(status)}
      </span>
    </div>
  );
}
