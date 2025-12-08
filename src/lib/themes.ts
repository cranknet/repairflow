/**
 * Theme Configuration
 * 
 * Centralized theme definitions for the application.
 * Each theme defines HSL color values for all CSS variables.
 * Colors are designed to meet WCAG AA contrast requirements.
 */

export const THEME_IDS = ['light', 'dark', 'professional', 'vibrant', 'minimal', 'system'] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeColors {
    // Background & Foreground
    background: string;
    foreground: string;

    // Card & Popover
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;

    // Primary (brand)
    primary: string;
    primaryForeground: string;

    // Secondary
    secondary: string;
    secondaryForeground: string;

    // Muted
    muted: string;
    mutedForeground: string;

    // Accent
    accent: string;
    accentForeground: string;

    // Destructive
    destructive: string;
    destructiveForeground: string;

    // Success
    success: string;
    successForeground: string;

    // Warning
    warning: string;
    warningForeground: string;

    // Border & Input
    border: string;
    input: string;
    ring: string;

    // Shadows
    shadowXs: string;
    shadowSm: string;
    shadowMd: string;
    shadowLg: string;
    shadowXl: string;
    shadowFocus: string;
}

export interface ThemeDefinition {
    id: ThemeId;
    name: string;
    description: string;
    isDark: boolean;
    colors: ThemeColors;
    // Preview colors for the theme selector UI
    previewColors: {
        primary: string;
        secondary: string;
        background: string;
        accent: string;
    };
}

/**
 * Light Theme - Clean white/gray with teal accent (default)
 */
const lightTheme: ThemeDefinition = {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright interface',
    isDark: false,
    colors: {
        background: '210 20% 98%',
        foreground: '220 26% 14%',
        card: '0 0% 100%',
        cardForeground: '220 26% 14%',
        popover: '0 0% 100%',
        popoverForeground: '220 26% 14%',
        primary: '173 80% 40%',
        primaryForeground: '0 0% 100%',
        secondary: '220 14% 96%',
        secondaryForeground: '220 26% 14%',
        muted: '220 14% 96%',
        mutedForeground: '220 9% 46%',
        accent: '173 80% 96%',
        accentForeground: '173 80% 40%',
        destructive: '4 80% 59%',
        destructiveForeground: '0 0% 100%',
        success: '152 69% 39%',
        successForeground: '0 0% 100%',
        warning: '36 91% 50%',
        warningForeground: '0 0% 100%',
        border: '220 13% 91%',
        input: '220 13% 91%',
        ring: '173 80% 40%',
        shadowXs: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
        shadowSm: '0px 1px 3px 0px rgba(16, 24, 40, 0.1), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)',
        shadowMd: '0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
        shadowLg: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
        shadowXl: '0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)',
        shadowFocus: '0px 0px 0px 4px rgba(20, 184, 166, 0.12)',
    },
    previewColors: {
        primary: '#14b8a6',
        secondary: '#f3f4f6',
        background: '#fafbfc',
        accent: '#ccfbf1',
    },
};

/**
 * Dark Theme - Deep navy/gray with teal accent
 */
const darkTheme: ThemeDefinition = {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes for low light',
    isDark: true,
    colors: {
        background: '222 47% 11%',
        foreground: '210 40% 98%',
        card: '220 26% 14%',
        cardForeground: '210 40% 98%',
        popover: '220 26% 14%',
        popoverForeground: '210 40% 98%',
        primary: '168 76% 50%',
        primaryForeground: '222 47% 11%',
        secondary: '217 33% 17%',
        secondaryForeground: '210 40% 98%',
        muted: '217 33% 17%',
        mutedForeground: '215 20% 65%',
        accent: '168 76% 15%',
        accentForeground: '168 76% 50%',
        destructive: '0 63% 31%',
        destructiveForeground: '210 40% 98%',
        success: '152 56% 34%',
        successForeground: '210 40% 98%',
        warning: '33 78% 40%',
        warningForeground: '210 40% 98%',
        border: '217 33% 17%',
        input: '217 33% 17%',
        ring: '168 76% 50%',
        shadowXs: '0px 1px 2px 0px rgba(0, 0, 0, 0.2)',
        shadowSm: '0px 1px 3px 0px rgba(0, 0, 0, 0.25), 0px 1px 2px 0px rgba(0, 0, 0, 0.15)',
        shadowMd: '0px 4px 8px -2px rgba(0, 0, 0, 0.25), 0px 2px 4px -2px rgba(0, 0, 0, 0.15)',
        shadowLg: '0px 12px 16px -4px rgba(0, 0, 0, 0.2), 0px 4px 6px -2px rgba(0, 0, 0, 0.1)',
        shadowXl: '0px 20px 24px -4px rgba(0, 0, 0, 0.2), 0px 8px 8px -4px rgba(0, 0, 0, 0.1)',
        shadowFocus: '0px 0px 0px 4px rgba(45, 212, 191, 0.24)',
    },
    previewColors: {
        primary: '#2dd4bf',
        secondary: '#1e293b',
        background: '#0f172a',
        accent: '#134e4a',
    },
};

/**
 * Professional Theme - Corporate blue-slate
 */
const professionalTheme: ThemeDefinition = {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate blue-slate theme',
    isDark: false,
    colors: {
        background: '210 40% 98%',
        foreground: '222 47% 11%',
        card: '0 0% 100%',
        cardForeground: '222 47% 11%',
        popover: '0 0% 100%',
        popoverForeground: '222 47% 11%',
        primary: '217 91% 60%',
        primaryForeground: '0 0% 100%',
        secondary: '214 32% 91%',
        secondaryForeground: '222 47% 11%',
        muted: '214 32% 91%',
        mutedForeground: '215 16% 47%',
        accent: '214 95% 93%',
        accentForeground: '217 91% 60%',
        destructive: '0 84% 60%',
        destructiveForeground: '0 0% 100%',
        success: '142 76% 36%',
        successForeground: '0 0% 100%',
        warning: '38 92% 50%',
        warningForeground: '0 0% 100%',
        border: '214 32% 91%',
        input: '214 32% 91%',
        ring: '217 91% 60%',
        shadowXs: '0px 1px 2px 0px rgba(15, 23, 42, 0.05)',
        shadowSm: '0px 1px 3px 0px rgba(15, 23, 42, 0.1), 0px 1px 2px 0px rgba(15, 23, 42, 0.06)',
        shadowMd: '0px 4px 8px -2px rgba(15, 23, 42, 0.1), 0px 2px 4px -2px rgba(15, 23, 42, 0.06)',
        shadowLg: '0px 12px 16px -4px rgba(15, 23, 42, 0.08), 0px 4px 6px -2px rgba(15, 23, 42, 0.03)',
        shadowXl: '0px 20px 24px -4px rgba(15, 23, 42, 0.08), 0px 8px 8px -4px rgba(15, 23, 42, 0.03)',
        shadowFocus: '0px 0px 0px 4px rgba(59, 130, 246, 0.15)',
    },
    previewColors: {
        primary: '#3b82f6',
        secondary: '#e2e8f0',
        background: '#f8fafc',
        accent: '#dbeafe',
    },
};

/**
 * Vibrant Theme - Energetic orange/amber warm tones
 */
const vibrantTheme: ThemeDefinition = {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Energetic warm tones',
    isDark: false,
    colors: {
        background: '40 33% 98%',
        foreground: '20 14% 10%',
        card: '0 0% 100%',
        cardForeground: '20 14% 10%',
        popover: '0 0% 100%',
        popoverForeground: '20 14% 10%',
        primary: '24 95% 53%',
        primaryForeground: '0 0% 100%',
        secondary: '33 100% 96%',
        secondaryForeground: '20 14% 10%',
        muted: '40 33% 96%',
        mutedForeground: '25 5% 45%',
        accent: '33 100% 96%',
        accentForeground: '24 95% 53%',
        destructive: '0 84% 60%',
        destructiveForeground: '0 0% 100%',
        success: '142 76% 36%',
        successForeground: '0 0% 100%',
        warning: '45 93% 47%',
        warningForeground: '20 14% 10%',
        border: '40 20% 88%',
        input: '40 20% 88%',
        ring: '24 95% 53%',
        shadowXs: '0px 1px 2px 0px rgba(120, 53, 15, 0.05)',
        shadowSm: '0px 1px 3px 0px rgba(120, 53, 15, 0.1), 0px 1px 2px 0px rgba(120, 53, 15, 0.06)',
        shadowMd: '0px 4px 8px -2px rgba(120, 53, 15, 0.1), 0px 2px 4px -2px rgba(120, 53, 15, 0.06)',
        shadowLg: '0px 12px 16px -4px rgba(120, 53, 15, 0.08), 0px 4px 6px -2px rgba(120, 53, 15, 0.03)',
        shadowXl: '0px 20px 24px -4px rgba(120, 53, 15, 0.08), 0px 8px 8px -4px rgba(120, 53, 15, 0.03)',
        shadowFocus: '0px 0px 0px 4px rgba(249, 115, 22, 0.15)',
    },
    previewColors: {
        primary: '#f97316',
        secondary: '#fefce8',
        background: '#fffbf5',
        accent: '#fed7aa',
    },
};

/**
 * Minimal Theme - Ultra-clean zinc/neutral monochromatic
 */
const minimalTheme: ThemeDefinition = {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean monochromatic',
    isDark: false,
    colors: {
        background: '0 0% 100%',
        foreground: '240 10% 4%',
        card: '0 0% 100%',
        cardForeground: '240 10% 4%',
        popover: '0 0% 100%',
        popoverForeground: '240 10% 4%',
        primary: '240 6% 10%',
        primaryForeground: '0 0% 100%',
        secondary: '240 5% 96%',
        secondaryForeground: '240 6% 10%',
        muted: '240 5% 96%',
        mutedForeground: '240 4% 46%',
        accent: '240 5% 96%',
        accentForeground: '240 6% 10%',
        destructive: '0 84% 60%',
        destructiveForeground: '0 0% 100%',
        success: '142 76% 36%',
        successForeground: '0 0% 100%',
        warning: '38 92% 50%',
        warningForeground: '240 6% 10%',
        border: '240 6% 90%',
        input: '240 6% 90%',
        ring: '240 6% 10%',
        shadowXs: '0px 1px 2px 0px rgba(0, 0, 0, 0.03)',
        shadowSm: '0px 1px 3px 0px rgba(0, 0, 0, 0.06), 0px 1px 2px 0px rgba(0, 0, 0, 0.04)',
        shadowMd: '0px 4px 8px -2px rgba(0, 0, 0, 0.06), 0px 2px 4px -2px rgba(0, 0, 0, 0.04)',
        shadowLg: '0px 12px 16px -4px rgba(0, 0, 0, 0.05), 0px 4px 6px -2px rgba(0, 0, 0, 0.02)',
        shadowXl: '0px 20px 24px -4px rgba(0, 0, 0, 0.05), 0px 8px 8px -4px rgba(0, 0, 0, 0.02)',
        shadowFocus: '0px 0px 0px 4px rgba(63, 63, 70, 0.1)',
    },
    previewColors: {
        primary: '#18181b',
        secondary: '#f4f4f5',
        background: '#ffffff',
        accent: '#e4e4e7',
    },
};

/**
 * All available themes (excluding 'system' which is a special case)
 */
export const THEMES: Record<Exclude<ThemeId, 'system'>, ThemeDefinition> = {
    light: lightTheme,
    dark: darkTheme,
    professional: professionalTheme,
    vibrant: vibrantTheme,
    minimal: minimalTheme,
};

/**
 * Get theme by ID, returns light theme if not found
 */
export function getTheme(id: ThemeId): ThemeDefinition {
    if (id === 'system') {
        return lightTheme; // Default fallback for system
    }
    return THEMES[id] ?? lightTheme;
}

/**
 * Get all themes as an array for rendering
 */
export function getAllThemes(): ThemeDefinition[] {
    return Object.values(THEMES);
}

/**
 * Apply theme CSS variables to the document
 */
export function applyThemeToDocument(theme: ThemeDefinition): void {
    const root = document.documentElement;
    const { colors } = theme;

    // Set color variables
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--card', colors.card);
    root.style.setProperty('--card-foreground', colors.cardForeground);
    root.style.setProperty('--popover', colors.popover);
    root.style.setProperty('--popover-foreground', colors.popoverForeground);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--muted-foreground', colors.mutedForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-foreground', colors.accentForeground);
    root.style.setProperty('--destructive', colors.destructive);
    root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--success-foreground', colors.successForeground);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--warning-foreground', colors.warningForeground);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--input', colors.input);
    root.style.setProperty('--ring', colors.ring);

    // Set shadow variables
    root.style.setProperty('--shadow-xs', colors.shadowXs);
    root.style.setProperty('--shadow-sm', colors.shadowSm);
    root.style.setProperty('--shadow-md', colors.shadowMd);
    root.style.setProperty('--shadow-lg', colors.shadowLg);
    root.style.setProperty('--shadow-xl', colors.shadowXl);
    root.style.setProperty('--shadow-focus', colors.shadowFocus);

    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', theme.id);

    // Handle dark class for Tailwind dark: variants
    if (theme.isDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

/**
 * Storage key for persisting theme preference
 */
export const THEME_STORAGE_KEY = 'repairflow-theme';
