'use client';

import { useLanguage } from '@/contexts/language-context';

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t('welcomeBack')}, {userName}!
        </h1>
        <p className="text-gray-600">{t('whatsHappening')}</p>
      </div>
    </div>
  );
}

