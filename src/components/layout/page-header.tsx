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
    <div className="flex-between flex-wrap gap-4">
      <div>
        <h1 className="text-fluid-4xl font-bold text-gray-900 dark:text-white">{t(titleKey)}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t(descriptionKey)}</p>
      </div>
      {actionButton && (
        <Link href={actionButton.href}>
          <Button>{t(actionButton.labelKey)}</Button>
        </Link>
      )}
    </div>
  );
}

