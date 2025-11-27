/**
 * Material Design 3 Theme Configuration
 * 
 * This file defines the static Material Design 3 color scheme and theme utilities.
 * Based on Google's Material Design 3 specifications.
 * 
 * @see https://m3.material.io/styles/color/system/overview
 */

export interface MaterialTheme {
  light: ColorScheme;
  dark: ColorScheme;
}

export interface ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixed: string;
  onSecondaryFixedVariant: string;
  
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixed: string;
  onTertiaryFixedVariant: string;
  
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  scrim: string;
  shadow: string;
}

/**
 * Default Material Design 3 theme (Blue)
 * Based on Material You baseline color scheme
 */
export const defaultMaterialTheme: MaterialTheme = {
  light: {
    primary: 'rgb(64, 126, 201)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(213, 227, 247)',
    onPrimaryContainer: 'rgb(0, 28, 58)',
    primaryFixed: 'rgb(213, 227, 247)',
    primaryFixedDim: 'rgb(165, 200, 234)',
    onPrimaryFixed: 'rgb(0, 28, 58)',
    onPrimaryFixedVariant: 'rgb(40, 98, 155)',
    
    secondary: 'rgb(88, 94, 113)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(220, 226, 249)',
    onSecondaryContainer: 'rgb(21, 27, 44)',
    secondaryFixed: 'rgb(220, 226, 249)',
    secondaryFixedDim: 'rgb(192, 198, 220)',
    onSecondaryFixed: 'rgb(21, 27, 44)',
    onSecondaryFixedVariant: 'rgb(64, 70, 89)',
    
    tertiary: 'rgb(112, 85, 127)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(241, 219, 255)',
    onTertiaryContainer: 'rgb(39, 16, 53)',
    tertiaryFixed: 'rgb(241, 219, 255)',
    tertiaryFixedDim: 'rgb(213, 188, 229)',
    onTertiaryFixed: 'rgb(39, 16, 53)',
    onTertiaryFixedVariant: 'rgb(86, 61, 101)',
    
    error: 'rgb(186, 26, 26)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 218, 214)',
    onErrorContainer: 'rgb(65, 0, 2)',
    
    background: 'rgb(250, 249, 253)',
    onBackground: 'rgb(26, 28, 30)',
    surface: 'rgb(250, 249, 253)',
    onSurface: 'rgb(26, 28, 30)',
    surfaceVariant: 'rgb(224, 226, 236)',
    onSurfaceVariant: 'rgb(67, 71, 78)',
    surfaceDim: 'rgb(218, 217, 221)',
    surfaceBright: 'rgb(250, 249, 253)',
    surfaceContainerLowest: 'rgb(255, 255, 255)',
    surfaceContainerLow: 'rgb(244, 243, 247)',
    surfaceContainer: 'rgb(238, 238, 242)',
    surfaceContainerHigh: 'rgb(232, 232, 236)',
    surfaceContainerHighest: 'rgb(227, 227, 230)',
    
    outline: 'rgb(116, 119, 127)',
    outlineVariant: 'rgb(196, 199, 208)',
    inverseSurface: 'rgb(47, 48, 51)',
    inverseOnSurface: 'rgb(241, 240, 244)',
    inversePrimary: 'rgb(165, 200, 234)',
    scrim: 'rgb(0, 0, 0)',
    shadow: 'rgb(0, 0, 0)',
  },
  dark: {
    primary: 'rgb(165, 200, 234)',
    onPrimary: 'rgb(11, 54, 90)',
    primaryContainer: 'rgb(40, 98, 155)',
    onPrimaryContainer: 'rgb(213, 227, 247)',
    primaryFixed: 'rgb(213, 227, 247)',
    primaryFixedDim: 'rgb(165, 200, 234)',
    onPrimaryFixed: 'rgb(0, 28, 58)',
    onPrimaryFixedVariant: 'rgb(40, 98, 155)',
    
    secondary: 'rgb(192, 198, 220)',
    onSecondary: 'rgb(42, 48, 65)',
    secondaryContainer: 'rgb(64, 70, 89)',
    onSecondaryContainer: 'rgb(220, 226, 249)',
    secondaryFixed: 'rgb(220, 226, 249)',
    secondaryFixedDim: 'rgb(192, 198, 220)',
    onSecondaryFixed: 'rgb(21, 27, 44)',
    onSecondaryFixedVariant: 'rgb(64, 70, 89)',
    
    tertiary: 'rgb(213, 188, 229)',
    onTertiary: 'rgb(60, 37, 76)',
    tertiaryContainer: 'rgb(86, 61, 101)',
    onTertiaryContainer: 'rgb(241, 219, 255)',
    tertiaryFixed: 'rgb(241, 219, 255)',
    tertiaryFixedDim: 'rgb(213, 188, 229)',
    onTertiaryFixed: 'rgb(39, 16, 53)',
    onTertiaryFixedVariant: 'rgb(86, 61, 101)',
    
    error: 'rgb(255, 180, 171)',
    onError: 'rgb(105, 0, 5)',
    errorContainer: 'rgb(147, 0, 10)',
    onErrorContainer: 'rgb(255, 218, 214)',
    
    background: 'rgb(26, 28, 30)',
    onBackground: 'rgb(227, 227, 230)',
    surface: 'rgb(26, 28, 30)',
    onSurface: 'rgb(227, 227, 230)',
    surfaceVariant: 'rgb(67, 71, 78)',
    onSurfaceVariant: 'rgb(196, 199, 208)',
    surfaceDim: 'rgb(26, 28, 30)',
    surfaceBright: 'rgb(54, 57, 60)',
    surfaceContainerLowest: 'rgb(20, 22, 25)',
    surfaceContainerLow: 'rgb(34, 36, 39)',
    surfaceContainer: 'rgb(38, 41, 43)',
    surfaceContainerHigh: 'rgb(49, 51, 54)',
    surfaceContainerHighest: 'rgb(60, 62, 65)',
    
    outline: 'rgb(142, 145, 153)',
    outlineVariant: 'rgb(67, 71, 78)',
    inverseSurface: 'rgb(227, 227, 230)',
    inverseOnSurface: 'rgb(47, 48, 51)',
    inversePrimary: 'rgb(40, 98, 155)',
    scrim: 'rgb(0, 0, 0)',
    shadow: 'rgb(0, 0, 0)',
  },
};

/**
 * Convert RGB string to RGB tuple for CSS custom properties
 * @param rgbString RGB string like "rgb(255, 255, 255)"
 * @returns RGB tuple like "255 255 255"
 */
export function rgbToTuple(rgbString: string): string {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '0 0 0';
  return `${match[1]} ${match[2]} ${match[3]}`;
}

/**
 * Apply Material Design 3 theme to the document
 * @param theme The theme to apply
 * @param mode 'light' or 'dark'
 */
export function applyMaterialTheme(theme: MaterialTheme, mode: 'light' | 'dark') {
  const scheme = theme[mode];
  const root = document.documentElement;
  
  // Apply color tokens as CSS custom properties
  Object.entries(scheme).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    const varName = `--md-sys-color-${cssKey}`;
    root.style.setProperty(varName, rgbToTuple(value));
  });
}

/**
 * Get current theme mode from system or user preference
 */
export function getSystemThemeMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  // Check for manual preference first
  const stored = localStorage.getItem('theme-mode');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  
  // Fall back to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Set theme mode and persist to localStorage
 */
export function setThemeMode(mode: 'light' | 'dark') {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('theme-mode', mode);
  
  // Apply or remove dark class
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Apply the theme
  applyMaterialTheme(defaultMaterialTheme, mode);
}

/**
 * Initialize theme on app load
 */
export function initializeTheme() {
  if (typeof window === 'undefined') return;
  
  const mode = getSystemThemeMode();
  setThemeMode(mode);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only auto-switch if user hasn't set a manual preference
    if (!localStorage.getItem('theme-mode')) {
      setThemeMode(e.matches ? 'dark' : 'light');
    }
  });
}

