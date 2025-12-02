'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  defaultMaterialTheme,
  applyMaterialTheme,
  type MaterialTheme
} from '@/lib/material-theme';
import {
  applyDynamicTheme,
  isDynamicThemeEnabled,
  getStoredSeedColor
} from '@/lib/dynamic-color';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDynamic: boolean;
  setIsDynamic: (dynamic: boolean) => void;
  seedColor: string | null;
  setSeedColor: (color: string) => void;
  currentTheme: MaterialTheme;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  isDynamic: false,
  setIsDynamic: () => null,
  seedColor: null,
  setSeedColor: () => null,
  currentTheme: defaultMaterialTheme,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'repairflow-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (typeof window !== 'undefined' && localStorage.getItem(storageKey)) as Theme || defaultTheme
  );

  const [isDynamic, setIsDynamic] = useState(() =>
    typeof window !== 'undefined' ? isDynamicThemeEnabled() : false
  );

  const [seedColor, setSeedColor] = useState<string | null>(() =>
    typeof window !== 'undefined' ? getStoredSeedColor() : null
  );

  // Derive current theme using useMemo
  const currentTheme = useMemo(() => {
    if (typeof window === 'undefined') return defaultMaterialTheme;

    if (isDynamic && seedColor) {
      const dynamicTheme = applyDynamicTheme();
      return dynamicTheme || defaultMaterialTheme;
    }

    return defaultMaterialTheme;
  }, [isDynamic, seedColor]);

  // Apply theme changes (side effects only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Determine effective theme mode
    let effectiveMode: 'light' | 'dark' = 'light';
    if (theme === 'system') {
      effectiveMode = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      effectiveMode = theme;
    }

    // Apply theme class
    root.classList.add(effectiveMode);

    // Apply Material Design theme CSS variables
    applyMaterialTheme(currentTheme, effectiveMode);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newMode = e.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newMode);
        applyMaterialTheme(currentTheme, newMode);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, currentTheme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    isDynamic,
    setIsDynamic,
    seedColor,
    setSeedColor,
    currentTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
