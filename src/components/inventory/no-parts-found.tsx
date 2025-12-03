'use client';

import { useLanguage } from '@/contexts/language-context';

export function NoPartsFound() {
  const { t } = useLanguage();
  return <p className="text-center text-gray-500 py-8">{t('noPartsFound')}</p>;
}

