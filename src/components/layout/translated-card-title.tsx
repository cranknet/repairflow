'use client';

import { useLanguage } from '@/contexts/language-context';
import { CardTitle } from '@/components/ui/card';

interface TranslatedCardTitleProps {
  translationKey: string;
  children?: React.ReactNode;
  className?: string;
}

export function TranslatedCardTitle({ translationKey, children, className }: TranslatedCardTitleProps) {
  const { t } = useLanguage();
  
  return (
    <CardTitle className={className}>
      {t(translationKey)}
      {children}
    </CardTitle>
  );
}

