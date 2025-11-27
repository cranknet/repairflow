'use client';

import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageHeaderProps {
  titleKey: string;
  descriptionKey: string;
  actionButton?: {
    labelKey: string;
    href: string;
  };
}

export function PageHeader({ titleKey, descriptionKey, actionButton }: PageHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t(titleKey)}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t(descriptionKey)}</p>
      </div>
      {actionButton && (
        <Link href={actionButton.href} className="mr-4">
          <Button>{t(actionButton.labelKey)}</Button>
        </Link>
      )}
    </div>
  );
}

