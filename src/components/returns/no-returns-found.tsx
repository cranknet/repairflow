'use client';

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent } from '@/components/ui/card';

export function NoReturnsFound() {
  const { t } = useLanguage();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {t('noReturnsFound')}
        </p>
      </CardContent>
    </Card>
  );
}

