'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/contexts/language-context';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

/**
 * Theme Customizer Component
 * 
 * Simple light/dark/system mode selector.
 */

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

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
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="flex items-center gap-2"
            >
              <SunIcon className="h-4 w-4" />
              {t('light')}
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="flex items-center gap-2"
            >
              <MoonIcon className="h-4 w-4" />
              {t('dark')}
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="flex items-center gap-2"
            >
              <ComputerDesktopIcon className="h-4 w-4" />
              {t('system')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
