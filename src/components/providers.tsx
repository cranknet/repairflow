'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme-provider';
import { LanguageProvider } from '@/contexts/language-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { I18nProviderWrapper } from '@/components/providers/i18n-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <I18nProviderWrapper>
          <LanguageProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </LanguageProvider>
        </I18nProviderWrapper>
      </ThemeProvider>
    </SessionProvider>
  );
}
