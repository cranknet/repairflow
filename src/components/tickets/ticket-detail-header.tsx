'use client';

import { format } from 'date-fns';
import { useMemo } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

interface TicketDetailHeaderProps {
  ticketNumber: string;
  createdAt: Date | string;
}

export function TicketDetailHeader({ ticketNumber, createdAt }: TicketDetailHeaderProps) {
  const { t } = useLanguage();

  const formattedDate = useMemo(() => {
    return format(new Date(createdAt), 'MMM dd, yyyy HH:mm');
  }, [createdAt]);

  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      {/* Left side - Back button and ticket info */}
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {ticketNumber}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('createdAt')} {formattedDate}
          </p>
        </div>
      </div>

      {/* Right side - Action buttons (can be expanded later) */}
      <div className="flex items-center gap-2">
        {/* Print button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="hidden sm:inline-flex"
        >
          <span className="material-symbols-outlined text-sm mr-1">print</span>
          {t('print')}
        </Button>
      </div>
    </div>
  );
}

