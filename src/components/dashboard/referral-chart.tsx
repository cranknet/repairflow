'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReferralData {
  name: string;
  value: number;
  color: string;
}

interface ReferralChartProps {
  data: ReferralData[];
  storeName?: string;
  date?: string;
}

const COLORS = ['#14B8A6', '#84CC16', '#94A3B8', '#EF4444'];

export function ReferralChart({ data, storeName, date }: ReferralChartProps) {
  const [period, setPeriod] = useState<'week' | 'twoWeeks' | 'month'>('week');

  const periods = [
    { id: 'week', label: 'LAST WEEK' },
    { id: 'twoWeeks', label: 'LAST TWO WEEKS' },
    { id: 'month', label: 'LAST MONTH' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">How did you hear about us?</CardTitle>
        </div>
        <div className="flex gap-2 mt-4">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${period === p.id
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
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                />
                <span>{item.name}</span>
              </div>
              <span className="font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

