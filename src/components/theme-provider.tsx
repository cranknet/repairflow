'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ThemeId,
  THEME_IDS,
  getTheme,
  applyThemeToDocument,
  THEME_STORAGE_KEY,
  ThemeDefinition
} from '@/lib/themes';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeId;
  storageKey?: string;
}

interface ThemeProviderState {
  /** The user-selected theme (can be 'system') */
  theme: ThemeId;
  /** The actual theme being applied (never 'system', resolved to actual theme) */
  resolvedTheme: Exclude<ThemeId, 'system'>;
  /** Set the theme */
  setTheme: (theme: ThemeId) => void;
  /** Get the current theme definition */
  themeDefinition: ThemeDefinition;
}

const initialState: ThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => null,
  themeDefinition: getTheme('light'),
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Determine the system preferred theme
 */
function getSystemTheme(): Exclude<ThemeId, 'system'> {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Validate that a string is a valid ThemeId
 */
function isValidThemeId(value: string | null): value is ThemeId {
  if (!value) return false;
  return THEME_IDS.includes(value as ThemeId);
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  // Initialize theme from storage or default
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    const stored = localStorage.getItem(storageKey);
    return isValidThemeId(stored) ? stored : defaultTheme;
  });

  // Resolved theme (actual theme applied, never 'system')
  const [resolvedTheme, setResolvedTheme] = useState<Exclude<ThemeId, 'system'>>(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme as Exclude<ThemeId, 'system'>;
  });

  // The current theme definition
  const themeDefinition = getTheme(resolvedTheme);

  // Resolve and apply theme
  const applyTheme = useCallback((themeId: ThemeId) => {
    let actualTheme: Exclude<ThemeId, 'system'>;

    if (themeId === 'system') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = themeId;
    }

    setResolvedTheme(actualTheme);
    const themeDef = getTheme(actualTheme);
    applyThemeToDocument(themeDef);
  }, []);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes when 'system' is selected
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newSystemTheme);
      applyThemeToDocument(getTheme(newSystemTheme));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Set theme and persist
  const setTheme = useCallback((newTheme: ThemeId) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  }, [storageKey]);

  const value: ThemeProviderState = {
    theme,
    resolvedTheme,
    setTheme,
    themeDefinition,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
