'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/contexts/language-context';
import { getAllThemes, ThemeId, ThemeDefinition } from '@/lib/themes';
import { CheckCircleIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid';
import { SwatchIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/**
 * Theme Card Component
 * Displays a single theme option with color preview
 */
interface ThemeCardProps {
  theme: ThemeDefinition;
  isActive: boolean;
  onClick: () => void;
  t: (key: string) => string;
}

function ThemeCard({ theme, isActive, onClick, t }: ThemeCardProps) {
  const { previewColors } = theme;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all duration-200',
        'hover:shadow-theme-md hover:scale-[1.02]',
        isActive
          ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
      )}
      aria-pressed={isActive}
      aria-label={t(`theme.${theme.id}`) + (isActive ? ' - ' + t('current') : '')}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -right-2 -top-2">
          <CheckCircleIcon className="h-6 w-6 text-brand-500 dark:text-brand-400" />
        </div>
      )}

      {/* Color preview swatches */}
      <div className="mb-3 flex gap-1.5">
        <div
          className="h-8 w-8 rounded-lg shadow-theme-xs ring-1 ring-black/5"
          style={{ backgroundColor: previewColors.primary }}
          title="Primary"
        />
        <div
          className="h-8 w-8 rounded-lg shadow-theme-xs ring-1 ring-black/5"
          style={{ backgroundColor: previewColors.secondary }}
          title="Secondary"
        />
        <div
          className="h-8 w-8 rounded-lg shadow-theme-xs ring-1 ring-black/5"
          style={{ backgroundColor: previewColors.background }}
          title="Background"
        />
        <div
          className="h-8 w-8 rounded-lg shadow-theme-xs ring-1 ring-black/5"
          style={{ backgroundColor: previewColors.accent }}
          title="Accent"
        />
      </div>

      {/* Theme name and description */}
      <h3 className="font-semibold text-gray-900 dark:text-white">
        {t(`theme.${theme.id}`)}
      </h3>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
        {t(`theme.description.${theme.id}`)}
      </p>
    </button>
  );
}

/**
 * System Theme Card
 * Special card for "follow system preference" option
 */
interface SystemThemeCardProps {
  isActive: boolean;
  onClick: () => void;
  t: (key: string) => string;
}

function SystemThemeCard({ isActive, onClick, t }: SystemThemeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all duration-200',
        'hover:shadow-theme-md hover:scale-[1.02]',
        isActive
          ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
      )}
      aria-pressed={isActive}
      aria-label={t('theme.system') + (isActive ? ' - ' + t('current') : '')}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -right-2 -top-2">
          <CheckCircleIcon className="h-6 w-6 text-brand-500 dark:text-brand-400" />
        </div>
      )}

      {/* System icon preview */}
      <div className="mb-3 flex h-8 items-center gap-1.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
          <ComputerDesktopIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
        {/* Light/Dark split indicator */}
        <div className="flex h-8 overflow-hidden rounded-lg shadow-theme-xs ring-1 ring-black/5">
          <div className="h-full w-4 bg-white" />
          <div className="h-full w-4 bg-gray-900" />
        </div>
      </div>

      {/* Theme name and description */}
      <h3 className="font-semibold text-gray-900 dark:text-white">
        {t('theme.system')}
      </h3>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
        {t('theme.description.system')}
      </p>
    </button>
  );
}

/**
 * Theme Customizer Component
 * 
 * Displays a grid of theme cards for the user to select their preferred theme.
 * Supports 5 themes (Light, Dark, Professional, Vibrant, Minimal) plus System.
 */
export function ThemeCustomizer() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const themes = getAllThemes();

  const handleThemeSelect = (themeId: ThemeId) => {
    setTheme(themeId);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-fuchsia-500/10 via-pink-500/10 to-rose-500/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25">
              <SwatchIcon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('settings.themes.title') || 'Theme Settings'}</CardTitle>
              <CardDescription>
                {t('settings.themes.description') || 'Customize the look and feel of your application'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('theme.selectTheme')}</CardTitle>
          <CardDescription>
            {t('chooseThemeMode')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Theme grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {/* Regular themes */}
            {themes.map((themeOption) => (
              <ThemeCard
                key={themeOption.id}
                theme={themeOption}
                isActive={theme === themeOption.id}
                onClick={() => handleThemeSelect(themeOption.id)}
                t={t}
              />
            ))}

            {/* System theme option */}
            <SystemThemeCard
              isActive={theme === 'system'}
              onClick={() => handleThemeSelect('system')}
              t={t}
            />
          </div>

          {/* Current theme indicator */}
          {theme === 'system' && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {t('theme.currentlyUsing')}: <span className="font-medium">{t(`theme.${resolvedTheme}`)}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
