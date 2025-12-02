'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/contexts/language-context';
import {
  PRESET_SEED_COLORS,
  generateDynamicTheme,
  generateTonalPalette,
  isValidHexColor,
  storeSeedColor,
  setDynamicThemeEnabled,
} from '@/lib/dynamic-color';
import { cn } from '@/lib/utils';

/**
 * Material Design 3 Theme Customizer Component
 * 
 * Allows users to customize the app theme with dynamic color generation
 * based on Material You principles.
 */

export function ThemeCustomizer() {
  const { theme, setTheme, isDynamic, setIsDynamic, seedColor, setSeedColor } = useTheme();
  const { t } = useLanguage();
  const [customColor, setCustomColor] = useState(seedColor || PRESET_SEED_COLORS.blue);
  const [showPalette, setShowPalette] = useState(false);

  // Use useMemo to derive palette when custom color changes
  const palette = useMemo(() => {
    if (isValidHexColor(customColor)) {
      return generateTonalPalette(customColor);
    }
    return [];
  }, [customColor]);

  const handleThemeModeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handleDynamicToggle = (enabled: boolean) => {
    setIsDynamic(enabled);
    setDynamicThemeEnabled(enabled);
    if (enabled && customColor) {
      handleApplySeedColor(customColor);
    }
  };

  const handlePresetColorSelect = (color: string) => {
    setCustomColor(color);
    if (isDynamic) {
      handleApplySeedColor(color);
    }
  };

  const handleApplySeedColor = (color: string) => {
    if (!isValidHexColor(color)) {
      alert(t('validHexColorRequired'));
      return;
    }

    setSeedColor(color);
    storeSeedColor(color);
    setDynamicThemeEnabled(true);
    setIsDynamic(true);

    // Force re-render by updating the color
    setCustomColor(color);
  };

  return (
    <div className="space-y-6">
      {/* Theme Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t('themeMode')}</CardTitle>
          <CardDescription>
            {t('chooseThemeMode')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={theme === 'light' ? 'filled' : 'outlined'}
              onClick={() => handleThemeModeChange('light')}
              icon={<span className="material-symbols-outlined">light_mode</span>}
              iconPosition="start"
            >
              {t('light')}
            </Button>
            <Button
              variant={theme === 'dark' ? 'filled' : 'outlined'}
              onClick={() => handleThemeModeChange('dark')}
              icon={<span className="material-symbols-outlined">dark_mode</span>}
              iconPosition="start"
            >
              {t('dark')}
            </Button>
            <Button
              variant={theme === 'system' ? 'filled' : 'outlined'}
              onClick={() => handleThemeModeChange('system')}
              icon={<span className="material-symbols-outlined">brightness_auto</span>}
              iconPosition="start"
            >
              {t('system')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Color Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined">palette</span>
            {t('materialYouDynamicColor')}
          </CardTitle>
          <CardDescription>
            {t('generateDynamicColorSchemes')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDynamicToggle(!isDynamic)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isDynamic ? "bg-primary" : "bg-surface-variant"
              )}
              role="switch"
              aria-checked={isDynamic}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-surface transition-transform shadow-md-level1",
                  isDynamic ? "translate-x-6" : "translate-x-0.5"
                )}
              />
            </button>
            <span className="text-body-large text-on-surface">
              {isDynamic ? t('enabled') : t('disabled')}
            </span>
          </div>

          {isDynamic && (
            <>
              {/* Preset Colors */}
              <div className="space-y-2">
                <label className="text-title-small text-on-surface block">
                  {t('presetColors')}
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(PRESET_SEED_COLORS).map(([name, color]) => (
                    <button
                      key={name}
                      onClick={() => handlePresetColorSelect(color)}
                      className={cn(
                        "h-12 w-12 rounded-lg transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary",
                        customColor === color && "ring-3 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color }}
                      title={name}
                      aria-label={`Select ${name} color`}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Color Input */}
              <div className="space-y-2">
                <label htmlFor="custom-color" className="text-title-small text-on-surface block">
                  {t('customColor')}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <input
                      id="custom-color"
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-10 w-16 rounded-md border-2 border-outline cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#0ea5e9"
                      className="flex-1 h-10 px-4 rounded-md border-2 border-outline bg-surface text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <Button
                    variant="filled"
                    onClick={() => handleApplySeedColor(customColor)}
                    disabled={!isValidHexColor(customColor)}
                  >
                    {t('apply')}
                  </Button>
                </div>
              </div>

              {/* Tonal Palette Preview */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowPalette(!showPalette)}
                  className="flex items-center gap-2 text-title-small text-on-surface hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPalette ? 'expand_less' : 'expand_more'}
                  </span>
                  {t('tonalPalettePreview')}
                </button>

                {showPalette && palette.length > 0 && (
                  <div className="grid grid-cols-13 gap-1 p-4 bg-surface-container-low rounded-lg">
                    {palette.map(({ tone, hex }) => (
                      <div key={tone} className="flex flex-col items-center gap-1">
                        <div
                          className="h-12 w-full rounded-md shadow-md-level1"
                          style={{ backgroundColor: hex }}
                          title={`Tone ${tone}: ${hex}`}
                        />
                        <span className="text-label-small text-on-surface-variant">
                          {tone}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card variant="outlined">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-2xl text-primary flex-shrink-0">
              info
            </span>
            <div className="space-y-1">
              <p className="text-body-medium text-on-surface">
                {t('materialYouInfo')}
              </p>
              <p className="text-body-small text-on-surface-variant">
                {t('disableDynamicColors')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

