'use client';

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/**
 * KPI Card Component - TailAdmin Pro Style
 * 
 * Displays key performance indicators with clean white cards,
 * subtle shadows, and semantic color badges.
 */

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  target?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
  icon?: React.ReactNode;
}

export function KPICard({ title, value, change, target, color = 'primary', icon }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  const colorConfig = {
    primary: {
      badge: isPositive
        ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
        : 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400',
      iconBg: 'bg-brand-50 dark:bg-brand-500/10',
      iconColor: 'text-brand-500 dark:text-brand-400',
    },
    secondary: {
      badge: isPositive
        ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
        : 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400',
      iconBg: 'bg-gray-100 dark:bg-gray-800',
      iconColor: 'text-gray-600 dark:text-gray-400',
    },
    success: {
      badge: isPositive
        ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
        : 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400',
      iconBg: 'bg-success-50 dark:bg-success-500/10',
      iconColor: 'text-success-500 dark:text-success-400',
    },
    warning: {
      badge: isPositive
        ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
        : 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400',
      iconBg: 'bg-warning-50 dark:bg-warning-500/10',
      iconColor: 'text-warning-500 dark:text-warning-400',
    },
  };

  const config = colorConfig[color];

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-theme-sm">
      <div className="flex items-center justify-between">
        {/* Icon */}
        {icon && (
          <div className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl',
            config.iconBg
          )}>
            <div className={cn('w-6 h-6', config.iconColor)}>
              {icon}
            </div>
          </div>
        )}

        {/* Change Badge */}
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
            config.badge
          )}>
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="mt-5">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </h4>
        {target && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Target: {target}
          </p>
        )}
      </div>
    </div>
  );
}

