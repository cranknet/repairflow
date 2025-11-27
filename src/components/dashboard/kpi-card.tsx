'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Material Design 3 KPI Card Component
 * 
 * Displays key performance indicators with proper MD3 styling,
 * elevation, and color semantics.
 */

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  target?: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning';
}

export function KPICard({ title, value, change, target, color = 'primary' }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  const colorConfig = {
    primary: {
      bg: 'bg-primary-container',
      text: 'text-on-primary-container',
      icon: 'text-primary',
      badge: 'bg-primary',
    },
    secondary: {
      bg: 'bg-secondary-container',
      text: 'text-on-secondary-container',
      icon: 'text-secondary',
      badge: 'bg-secondary',
    },
    tertiary: {
      bg: 'bg-tertiary-container',
      text: 'text-on-tertiary-container',
      icon: 'text-tertiary',
      badge: 'bg-tertiary',
    },
    success: {
      bg: 'bg-tertiary-container',
      text: 'text-on-tertiary-container',
      icon: 'text-tertiary',
      badge: 'bg-tertiary',
    },
    warning: {
      bg: 'bg-error-container',
      text: 'text-on-error-container',
      icon: 'text-error',
      badge: 'bg-error',
    },
  };

  const config = colorConfig[color];

  return (
    <Card variant="filled" className={cn(config.bg, 'overflow-hidden transition-all duration-short2 ease-standard hover:shadow-md-level1')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-label-large uppercase tracking-wide font-medium text-on-surface-variant">
            {title}
          </p>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-label-small font-medium',
              config.badge,
              isPositive ? 'text-on-primary' : 'text-on-error'
            )}>
              <span className="material-symbols-outlined text-[16px]">
                {isPositive ? 'trending_up' : 'trending_down'}
              </span>
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        
        <p className={cn('text-display-small font-normal mb-2', config.text)}>
          {value}
        </p>
        
        {target && (
          <p className="text-body-small text-on-surface-variant font-medium">
            Target: {target}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
