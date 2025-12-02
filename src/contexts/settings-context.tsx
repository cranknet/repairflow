'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  companyLogo: string;
  companyFavicon: string;
  companyName: string;
  loginBackgroundImage: string;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [companyLogo, setCompanyLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('company_logo') || '';
    }
    return '';
  });

  const [companyFavicon, setCompanyFavicon] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('company_favicon') || '';
    }
    return '';
  });

  const [companyName, setCompanyName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('company_name') || 'RepairFlow';
    }
    return 'RepairFlow';
  });

  const [loginBackgroundImage, setLoginBackgroundImage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('login_background_image') || '';
    }
    return '';
  });

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

      // Handle login background image
      const bgImage = data.login_background_image_url || data.login_background_image;
      if (bgImage) {
        const bgPath = bgImage.startsWith('http')
          ? bgImage
          : bgImage.startsWith('/')
            ? bgImage
            : `/${bgImage}`;
        setLoginBackgroundImage(bgPath);
        localStorage.setItem('login_background_image', bgPath);
      } else {
        const defaultBg = '/default-login-bg.png';
        setLoginBackgroundImage(defaultBg);
        localStorage.setItem('login_background_image', defaultBg);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Fetch from API to get latest values on mount
  useEffect(() => {
    setIsInitialized(true);
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
    <SettingsContext.Provider value={{ companyLogo, companyFavicon, companyName, loginBackgroundImage, refreshSettings }}>
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

