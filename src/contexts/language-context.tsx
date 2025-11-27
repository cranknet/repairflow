'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, languages, getTranslation } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language from localStorage and settings API on mount
  useEffect(() => {
    const loadLanguage = async () => {
      // First, try localStorage (fastest)
      const savedLang = localStorage.getItem('app_language') as Language;
      if (savedLang && languages.some((l) => l.code === savedLang)) {
        setLanguageState(savedLang);
        setIsInitialized(true);
      }

      // Then, try to load from settings API (may override localStorage)
      try {
        const response = await fetch('/api/settings/public');
        const data = await response.json();
        if (data.language && languages.some((l) => l.code === data.language)) {
          setLanguageState(data.language);
          localStorage.setItem('app_language', data.language);
        } else if (!savedLang) {
          // If no saved language, use default
          setLanguageState('en');
          localStorage.setItem('app_language', 'en');
        }
      } catch (error) {
        // If API fails and no localStorage, use default
        if (!savedLang) {
          setLanguageState('en');
          localStorage.setItem('app_language', 'en');
        }
      } finally {
        setIsInitialized(true);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    
    // Try to save to settings (only works if user is admin, but that's OK)
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang }),
    }).catch(() => {
      // Ignore errors if not admin - localStorage is enough
    });
  };

  const t = (key: string) => getTranslation(key, language);

  // Always provide the context, even during initialization
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

