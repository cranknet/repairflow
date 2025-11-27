'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  target?: string;
  color?: string;
}

export function KPICard({ title, value, change, target, color = 'blue' }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  const colorConfig = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
      border: 'border-blue-200/60',
      accent: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
      border: 'border-emerald-200/60',
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    yellow: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
      border: 'border-amber-200/60',
      accent: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
      border: 'border-purple-200/60',
      accent: 'text-purple-600',
      iconBg: 'bg-purple-100',
    },
  };

  const config = colorConfig[color as keyof typeof colorConfig] || colorConfig.blue;

  return (
    <Card className={`${config.bg} border ${config.border} overflow-hidden`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.iconBg} ${config.accent}`}>
              {isPositive ? (
                <ArrowUpIcon className="h-3 w-3" />
              ) : (
                <ArrowDownIcon className="h-3 w-3" />
              )}
              <span className="text-xs font-semibold">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
        {target && (
          <p className="text-xs text-gray-500 font-medium">Target: {target}</p>
        )}
      </CardContent>
    </Card>
  );
}

