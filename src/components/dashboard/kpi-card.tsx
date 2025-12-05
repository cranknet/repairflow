'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/**
 * KPI Card Component
 * 
 * Displays key performance indicators with proper styling
 * and color semantics.
 */

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  target?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

export function KPICard({ title, value, change, target, color = 'primary' }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  const colorConfig = {
    primary: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      badge: 'bg-primary text-primary-foreground',
    },
    secondary: {
      bg: 'bg-secondary',
      text: 'text-secondary-foreground',
      badge: 'bg-secondary-foreground text-secondary',
    },
    success: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-400',
      badge: 'bg-green-500 text-white',
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      badge: 'bg-yellow-500 text-white',
    },
  };

  const config = colorConfig[color];

  return (
    <Card className={cn(config.bg, 'overflow-hidden transition-all hover:shadow-md')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm uppercase tracking-wide font-medium text-muted-foreground">
            {title}
          </p>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              config.badge
            )}>
              {isPositive ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        <p className={cn('text-3xl font-normal mb-2', config.text)}>
          {value}
        </p>

        {target && (
          <p className="text-xs text-muted-foreground font-medium">
            Target: {target}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
