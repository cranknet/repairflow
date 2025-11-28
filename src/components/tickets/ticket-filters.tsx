'use client';

import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TicketFiltersProps {
  currentStatus?: string;
}

export function TicketFilters({ currentStatus }: TicketFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2 flex-wrap">
      <Link href="/tickets">
        <Button variant={!currentStatus ? 'filled' : 'outlined'}>{t('all')}</Button>
      </Link>
      <Link href="/tickets?status=active">
        <Button variant={currentStatus === 'active' ? 'filled' : 'outlined'}>
          {t('active')}
        </Button>
      </Link>
      <Link href="/tickets?status=IN_PROGRESS">
        <Button variant={currentStatus === 'IN_PROGRESS' ? 'filled' : 'outlined'}>
          {t('inProgress')}
        </Button>
      </Link>
      <Link href="/tickets?status=REPAIRED">
        <Button variant={currentStatus === 'REPAIRED' ? 'filled' : 'outlined'}>
          {t('repaired')}
        </Button>
      </Link>
      <Link href="/tickets?status=RETURNED">
        <Button variant={currentStatus === 'RETURNED' ? 'filled' : 'outlined'}>
          {t('returned') || 'Returned'}
        </Button>
      </Link>
      <Link href="/tickets?status=CANCELLED">
        <Button variant={currentStatus === 'CANCELLED' ? 'filled' : 'outlined'}>
          {t('cancelled')}
        </Button>
      </Link>
    </div>
  );
}

