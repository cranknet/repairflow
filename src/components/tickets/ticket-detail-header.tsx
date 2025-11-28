'use client';

import { format } from 'date-fns';
import { useState, useEffect } from 'react';
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
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    setFormattedDate(format(new Date(createdAt), 'MMM dd, yyyy HH:mm'));
  }, [createdAt]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {ticketNumber}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('createdAt')} {formattedDate}
          </p>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <Link href="/tickets">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            {t('backToList')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

