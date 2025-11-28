'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  companyLogo: string;
  companyFavicon: string;
  companyName: string;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyFavicon, setCompanyFavicon] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('RepairFlow');
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshSettings = async () => {
    try {
      const response = await fetch('/api/settings/public', { cache: 'no-store' });
      const data = await response.json();

      if (data.company_logo) {
        const logoPath = data.company_logo.startsWith('http')
          ? data.company_logo
          : data.company_logo.startsWith('/')
            ? data.company_logo
            : `/${data.company_logo}`;
        setCompanyLogo(logoPath);
        localStorage.setItem('company_logo', logoPath);
      } else {
        // Use default logo if not in settings
        const defaultLogo = '/default-logo.png';
        setCompanyLogo(defaultLogo);
        localStorage.setItem('company_logo', defaultLogo);
      }

      if (data.company_favicon) {
        const faviconPath = data.company_favicon.startsWith('http')
          ? data.company_favicon
          : data.company_favicon.startsWith('/')
            ? data.company_favicon
            : `/${data.company_favicon}`;
        setCompanyFavicon(faviconPath);
        localStorage.setItem('company_favicon', faviconPath);
      } else {
        // Use default favicon if not in settings
        const defaultFavicon = '/default-favicon.png';
        setCompanyFavicon(defaultFavicon);
        localStorage.setItem('company_favicon', defaultFavicon);
      }

      if (data.company_name) {
        setCompanyName(data.company_name);
        localStorage.setItem('company_name', data.company_name);
      } else {
        // Reset to default if not in settings
        setCompanyName('RepairFlow');
        localStorage.removeItem('company_name');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Load settings from localStorage first (instant), then fetch from API
  useEffect(() => {
    // Load from localStorage immediately (no flicker)
    const savedLogo = localStorage.getItem('company_logo');
    const savedName = localStorage.getItem('company_name');

    if (savedLogo) {
      setCompanyLogo(savedLogo);
    }
    if (savedName) {
      setCompanyName(savedName);
    }

    const savedFavicon = localStorage.getItem('company_favicon');
    if (savedFavicon) {
      setCompanyFavicon(savedFavicon);
    }

    setIsInitialized(true);

    // Then fetch from API to get latest values
    refreshSettings();
  }, []);

  // Update favicon when it changes
  useEffect(() => {
    if (!companyFavicon) return;

    const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement;
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = companyFavicon;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [companyFavicon]);

  return (
    <SettingsContext.Provider value={{ companyLogo, companyFavicon, companyName, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

