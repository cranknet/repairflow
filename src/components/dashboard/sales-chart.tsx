'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { DateRangePicker, DateRangeType } from './date-range-picker';
import { format, eachDayOfInterval, differenceInDays } from 'date-fns';

// Dynamic import Recharts to reduce initial bundle size (~200KB savings)
const RechartsChart = dynamic(
  () => import('recharts').then((mod) => {
    const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = mod;
    return function ChartComponent({ data, salesLabel, cogsLabel }: { data: any[], salesLabel: string, cogsLabel: string }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} name={salesLabel} />
            <Line type="monotone" dataKey="cogs" stroke="#EF4444" strokeWidth={2} name={cogsLabel} />
          </LineChart>
        </ResponsiveContainer>
      );
    };
  }),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded" />
  }
);


interface SalesChartProps {
  initialData?: Array<{
    date: string;
    sales: number;
    cogs: number;
  }>;
  initialInvoices?: number;
  initialTotalSales?: number;
  initialTotalCogs?: number;
}

export function SalesChart({
  initialData = [],
  initialInvoices = 0,
  initialTotalSales = 0,
  initialTotalCogs = 0
}: SalesChartProps) {
  const { t } = useLanguage();
  const [data, setData] = useState(initialData);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [totalSales, setTotalSales] = useState(initialTotalSales);
  const [totalCogs, setTotalCogs] = useState(initialTotalCogs);
  const [loading, setLoading] = useState(false);
  const [dateRangeLabel, setDateRangeLabel] = useState('');

  const fetchSalesData = useCallback(async (startDate: Date, endDate: Date, rangeType: DateRangeType) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/dashboard/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&rangeType=${rangeType}`
      );
      if (!response.ok) throw new Error('Failed to fetch sales data');

      const result = await response.json();
      setData(result.data);
      setInvoices(result.invoices);
      setTotalSales(result.totalSales);
      setTotalCogs(result.totalCogs);
      setDateRangeLabel(result.dateRangeLabel);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDateRangeChange = useCallback((startDate: Date, endDate: Date, rangeType: DateRangeType) => {
    fetchSalesData(startDate, endDate, rangeType);
  }, [fetchSalesData]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">{t('salesVsCogs')}</CardTitle>
          <DateRangePicker
            onDateRangeChange={handleDateRangeChange}
            defaultRange="lastWeek"
          />
        </div>
        {dateRangeLabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {dateRangeLabel}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500">{t('loading')}</p>
          </div>
        ) : (
          <>
            <RechartsChart data={data} salesLabel={t('sales')} cogsLabel={t('cogs')} />
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium uppercase tracking-wide">{t('numberOfInvoices')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{invoices}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium uppercase tracking-wide">{t('sales')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">${totalSales.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium uppercase tracking-wide">{t('cogs')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">${totalCogs.toFixed(2)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

