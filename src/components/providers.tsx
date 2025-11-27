'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme-provider';
import { LanguageProvider } from '@/contexts/language-context';
import { SettingsProvider } from '@/contexts/settings-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>
          <SettingsProvider>{children}</SettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

