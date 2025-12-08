'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { languages, type Language, getLanguageDirection } from '@/lib/i18n-config';

// Re-export for backward compatibility
export type { Language };
export { languages };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t: i18nT, i18n: i18nInstance } = useTranslation();
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync language state with i18next
  useEffect(() => {
    const currentLang = i18nInstance.language as Language;
    if (languages.some((l) => l.code === currentLang)) {
      setLanguageState(currentLang);
    }
    setIsInitialized(true);
  }, [i18nInstance.language]);

  // Load language from settings API on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const response = await fetch('/api/settings/public');
        const data = await response.json();
        if (data.language && languages.some((l) => l.code === data.language)) {
          i18nInstance.changeLanguage(data.language);
          setLanguageState(data.language);
          localStorage.setItem('app_language', data.language);
        }
      } catch (error) {
        // Ignore errors, use detected/default language
        console.debug('Could not load language from settings:', error);
      }
    };

    loadLanguage();
  }, [i18nInstance]);

  // Update document direction when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = getLanguageDirection(language);
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    i18nInstance.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);

    // Update document direction
    if (typeof document !== 'undefined') {
      document.documentElement.dir = getLanguageDirection(lang);
      document.documentElement.lang = lang;
    }

    // Try to save to settings (only works if user is admin, but that's OK)
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang }),
    }).catch(() => {
      // Ignore errors if not admin - localStorage is enough
    });
  }, [i18nInstance]);

  // Translation function with parameter support (backward compatible)
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    if (params) {
      return i18nT(key, params) as string;
    }
    return i18nT(key) as string;
  }, [i18nT]);

  const dir = getLanguageDirection(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
