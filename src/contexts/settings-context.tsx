'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  companyLogo: string;
  companyName: string;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('RepairFlow');
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshSettings = async () => {
    try {
      const response = await fetch('/api/settings/public');
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
        // Clear logo if not in settings
        setCompanyLogo('');
        localStorage.removeItem('company_logo');
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
    
    setIsInitialized(true);
    
    // Then fetch from API to get latest values
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ companyLogo, companyName, refreshSettings }}>
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

