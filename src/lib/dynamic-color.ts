/**
 * Material Design 3 Dynamic Color System (Material You)
 * 
 * This file implements dynamic color theming using Material Color Utilities.
 * It generates complete color schemes from a seed color based on user preferences.
 * 
 * @see https://m3.material.io/styles/color/dynamic-color/overview
 */

import {
  argbFromHex,
  themeFromSourceColor,
  applyTheme,
  hexFromArgb,
  Hct,
  TonalPalette,
  type Theme,
} from '@material/material-color-utilities';
import { type MaterialTheme, type ColorScheme } from './material-theme';

/**
 * Generate a Material You theme from a seed color
 * @param seedColor Hex color string (e.g., "#0ea5e9")
 * @returns Complete Material Design 3 theme
 */
export function generateDynamicTheme(seedColor: string): MaterialTheme {
  // Convert hex to ARGB
  const sourceColor = argbFromHex(seedColor);
  
  // Generate theme using Material Color Utilities
  const theme = themeFromSourceColor(sourceColor);
  
  // Convert to our MaterialTheme format
  return {
    light: convertScheme(theme.schemes.light),
    dark: convertScheme(theme.schemes.dark),
  };
}

/**
 * Convert Material Color Utilities scheme to our ColorScheme format
 */
function convertScheme(scheme: any): ColorScheme {
  const toRgb = (argb: number): string => {
    const hex = hexFromArgb(argb);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  return {
    primary: toRgb(scheme.primary),
    onPrimary: toRgb(scheme.onPrimary),
    primaryContainer: toRgb(scheme.primaryContainer),
    onPrimaryContainer: toRgb(scheme.onPrimaryContainer),
    primaryFixed: toRgb(scheme.primaryFixed),
    primaryFixedDim: toRgb(scheme.primaryFixedDim),
    onPrimaryFixed: toRgb(scheme.onPrimaryFixed),
    onPrimaryFixedVariant: toRgb(scheme.onPrimaryFixedVariant),
    
    secondary: toRgb(scheme.secondary),
    onSecondary: toRgb(scheme.onSecondary),
    secondaryContainer: toRgb(scheme.secondaryContainer),
    onSecondaryContainer: toRgb(scheme.onSecondaryContainer),
    secondaryFixed: toRgb(scheme.secondaryFixed),
    secondaryFixedDim: toRgb(scheme.secondaryFixedDim),
    onSecondaryFixed: toRgb(scheme.onSecondaryFixed),
    onSecondaryFixedVariant: toRgb(scheme.onSecondaryFixedVariant),
    
    tertiary: toRgb(scheme.tertiary),
    onTertiary: toRgb(scheme.onTertiary),
    tertiaryContainer: toRgb(scheme.tertiaryContainer),
    onTertiaryContainer: toRgb(scheme.onTertiaryContainer),
    tertiaryFixed: toRgb(scheme.tertiaryFixed),
    tertiaryFixedDim: toRgb(scheme.tertiaryFixedDim),
    onTertiaryFixed: toRgb(scheme.onTertiaryFixed),
    onTertiaryFixedVariant: toRgb(scheme.onTertiaryFixedVariant),
    
    error: toRgb(scheme.error),
    onError: toRgb(scheme.onError),
    errorContainer: toRgb(scheme.errorContainer),
    onErrorContainer: toRgb(scheme.onErrorContainer),
    
    background: toRgb(scheme.background),
    onBackground: toRgb(scheme.onBackground),
    surface: toRgb(scheme.surface),
    onSurface: toRgb(scheme.onSurface),
    surfaceVariant: toRgb(scheme.surfaceVariant),
    onSurfaceVariant: toRgb(scheme.onSurfaceVariant),
    surfaceDim: toRgb(scheme.surfaceDim),
    surfaceBright: toRgb(scheme.surfaceBright),
    surfaceContainerLowest: toRgb(scheme.surfaceContainerLowest),
    surfaceContainerLow: toRgb(scheme.surfaceContainerLow),
    surfaceContainer: toRgb(scheme.surfaceContainer),
    surfaceContainerHigh: toRgb(scheme.surfaceContainerHigh),
    surfaceContainerHighest: toRgb(scheme.surfaceContainerHighest),
    
    outline: toRgb(scheme.outline),
    outlineVariant: toRgb(scheme.outlineVariant),
    inverseSurface: toRgb(scheme.inverseSurface),
    inverseOnSurface: toRgb(scheme.inverseOnSurface),
    inversePrimary: toRgb(scheme.inversePrimary),
    scrim: toRgb(scheme.scrim),
    shadow: toRgb(scheme.shadow),
  };
}

/**
 * Extract seed color from an image (for wallpaper-based theming)
 * @param imageUrl URL or data URL of the image
 * @returns Dominant color as hex string
 */
export async function extractSeedColorFromImage(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      // Create canvas to analyze image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Scale down for performance
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Simple color extraction: find most vibrant color
      let maxSaturation = 0;
      let dominantColor = { r: 0, g: 0, b: 0 };
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Calculate saturation (simplified)
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        
        if (saturation > maxSaturation && max > 50) {
          maxSaturation = saturation;
          dominantColor = { r, g, b };
        }
      }
      
      // Convert to hex
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      const hex = `#${toHex(dominantColor.r)}${toHex(dominantColor.g)}${toHex(dominantColor.b)}`;
      
      resolve(hex);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Popular Material You seed colors (presets)
 */
export const PRESET_SEED_COLORS = {
  blue: '#0ea5e9',
  indigo: '#4f46e5',
  purple: '#9333ea',
  pink: '#ec4899',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  gray: '#6b7280',
} as const;

/**
 * Get stored seed color from localStorage
 */
export function getStoredSeedColor(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dynamic-theme-seed-color');
}

/**
 * Store seed color to localStorage
 */
export function storeSeedColor(seedColor: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dynamic-theme-seed-color', seedColor);
}

/**
 * Check if dynamic theming is enabled
 */
export function isDynamicThemeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('dynamic-theme-enabled') === 'true';
}

/**
 * Enable or disable dynamic theming
 */
export function setDynamicThemeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dynamic-theme-enabled', enabled ? 'true' : 'false');
}

/**
 * Apply dynamic theme based on stored preferences
 */
export function applyDynamicTheme(): MaterialTheme | null {
  if (!isDynamicThemeEnabled()) return null;
  
  const seedColor = getStoredSeedColor();
  if (!seedColor) return null;
  
  return generateDynamicTheme(seedColor);
}

/**
 * Generate tonal palette for preview
 * Useful for showing color swatches in the theme customizer
 */
export function generateTonalPalette(seedColor: string): { tone: number; hex: string }[] {
  const argb = argbFromHex(seedColor);
  const hct = Hct.fromInt(argb);
  const palette = TonalPalette.fromHct(hct);
  
  const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
  
  return tones.map(tone => ({
    tone,
    hex: hexFromArgb(palette.tone(tone)),
  }));
}

/**
 * Validate if a hex color is valid
 */
export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Get contrast ratio between two colors (for accessibility)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const argb1 = argbFromHex(color1);
  const argb2 = argbFromHex(color2);
  
  const getLuminance = (argb: number): number => {
    const r = ((argb >> 16) & 0xff) / 255;
    const g = ((argb >> 8) & 0xff) / 255;
    const b = (argb & 0xff) / 255;
    
    const toLinear = (c: number) => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };
  
  const l1 = getLuminance(argb1);
  const l2 = getLuminance(argb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

