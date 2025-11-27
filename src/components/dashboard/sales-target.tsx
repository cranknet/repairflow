'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';

interface SalesTargetProps {
  current: number;
  target: number;
  storeName?: string;
  date?: string;
}

export function SalesTarget({ current, target, storeName, date }: SalesTargetProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<'today' | 'month' | 'lastMonth'>('today');

  const periods = [
    { id: 'today', label: t('today').toUpperCase() },
    { id: 'month', label: t('thisMonth').toUpperCase() },
    { id: 'lastMonth', label: t('lastMonth').toUpperCase() },
  ];

  const percentage = Math.min((current / target) * 100, 100);
  const remaining = target - current;

  const data = [
    { name: 'Current', value: current },
    { name: 'Remaining', value: Math.max(remaining, 0) },
  ];

  const COLORS = ['#3B82F6', '#E5E7EB'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">{t('salesTarget')}</CardTitle>
        </div>
        <div className="flex gap-2 mt-4">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === p.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {storeName && (
          <div className="mt-3 text-xs text-gray-500">
            <p className="font-medium">Store: {storeName}</p>
            {date && <p className="text-gray-400">{date}</p>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{percentage.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Complete</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-center">
          <div>
            <p className="text-xs text-gray-600">Current Sales</p>
            <p className="text-lg font-bold">${current.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Target</p>
            <p className="text-lg font-bold">${target.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

