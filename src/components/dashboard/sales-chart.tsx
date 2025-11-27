'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalesChartProps {
  data: Array<{
    date: string;
    sales: number;
    cogs: number;
  }>;
  invoices: number;
  totalSales: number;
  totalCogs: number;
}

export function SalesChart({ data, invoices, totalSales, totalCogs }: SalesChartProps) {
  const [period, setPeriod] = useState<'week' | 'twoWeeks' | 'month'>('week');
  const [dateRange, setDateRange] = useState('06 Aug to 12 Aug');

  const periods = [
    { id: 'week', label: 'LAST WEEK' },
    { id: 'twoWeeks', label: 'LAST TWO WEEKS' },
    { id: 'month', label: 'LAST MONTH' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">Sales vs COGS</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>06 Aug to 12 Aug</option>
            </select>
          </div>
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
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} name="Sales" />
            <Line type="monotone" dataKey="cogs" stroke="#EF4444" strokeWidth={2} name="COGS" />
          </LineChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Number of Invoices</p>
            <p className="text-xl font-bold text-gray-900">{invoices}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Sales</p>
            <p className="text-xl font-bold text-gray-900">${totalSales.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">COGS</p>
            <p className="text-xl font-bold text-gray-900">${totalCogs.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

