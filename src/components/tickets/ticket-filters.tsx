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
        <Button variant={!currentStatus ? 'default' : 'outline'}>{t('all')}</Button>
      </Link>
      <Link href="/tickets?status=active">
        <Button variant={currentStatus === 'active' ? 'default' : 'outline'}>
          {t('active')}
        </Button>
      </Link>
      <Link href="/tickets?status=IN_PROGRESS">
        <Button variant={currentStatus === 'IN_PROGRESS' ? 'default' : 'outline'}>
          {t('inProgress')}
        </Button>
      </Link>
      <Link href="/tickets?status=REPAIRED">
        <Button variant={currentStatus === 'REPAIRED' ? 'default' : 'outline'}>
          {t('repaired')}
        </Button>
      </Link>
      <Link href="/tickets?status=RETURNED">
        <Button variant={currentStatus === 'RETURNED' ? 'default' : 'outline'}>
          {t('returned') || 'Returned'}
        </Button>
      </Link>
      <Link href="/tickets?status=CANCELLED">
        <Button variant={currentStatus === 'CANCELLED' ? 'default' : 'outline'}>
          {t('cancelled')}
        </Button>
      </Link>
    </div>
  );
}

