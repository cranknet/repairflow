'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import {
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    TicketIcon,
    UserGroupIcon,
    ArchiveBoxIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface DashboardHeroProps {
    initialWeeklyRevenue: number;
    initialRevenueChange: number;
    activeTickets: number;
    activeTicketsChange: number;
    totalCustomers: number;
    customersChange: number;
    lowStockItems: number;
}

interface PeriodData {
    revenue: number;
    revenueChange: number;
    profit: number;
    profitChange: number;
}

export function DashboardHero({
    initialWeeklyRevenue,
    initialRevenueChange,
    activeTickets,
    activeTicketsChange,
    totalCustomers,
    customersChange,
    lowStockItems,
}: DashboardHeroProps) {
    const { t } = useLanguage();
    const [period, setPeriod] = useState<PeriodType>('weekly');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PeriodData>({
        revenue: initialWeeklyRevenue,
        revenueChange: initialRevenueChange,
        profit: 0,
        profitChange: 0,
    });

    const periods: { id: PeriodType; label: string }[] = [
        { id: 'daily', label: t('dashboard.period.daily') },
        { id: 'weekly', label: t('dashboard.period.weekly') },
        { id: 'monthly', label: t('dashboard.period.monthly') },
        { id: 'yearly', label: t('dashboard.period.yearly') },
    ];

    const fetchPeriodData = useCallback(async (selectedPeriod: PeriodType) => {
        setLoading(true);
        try {
            // Use unified finance metrics endpoint
            const response = await fetch(`/api/finance/metrics?period=${selectedPeriod}`);
            if (response.ok) {
                const result = await response.json();
                setData({
                    revenue: result.revenue || 0,
                    revenueChange: result.revenueChange || 0,
                    profit: result.netProfit || 0,
                    profitChange: result.profitChange || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching period data:', error);
            // Fallback to initial values on error
            setData({
                revenue: initialWeeklyRevenue,
                revenueChange: initialRevenueChange,
                profit: 0,
                profitChange: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [initialWeeklyRevenue, initialRevenueChange]);

    useEffect(() => {
        fetchPeriodData(period);
    }, [period, fetchPeriodData]);

    const isPositiveRevenue = data.revenueChange >= 0;

    const getPeriodLabel = () => {
        switch (period) {
            case 'daily': return t('dashboard.today');
            case 'weekly': return t('dashboard.thisWeek');
            case 'monthly': return t('dashboard.thisMonth');
            case 'yearly': return t('dashboard.thisYear');
            default: return t('dashboard.thisWeek');
        }
    };

    const getComparisonLabel = () => {
        switch (period) {
            case 'daily': return t('dashboard.fromYesterday');
            case 'weekly': return t('dashboard.fromLastWeek');
            case 'monthly': return t('dashboard.fromLastMonth');
            case 'yearly': return t('dashboard.fromLastYear');
            default: return t('dashboard.fromLastWeek');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Hero Card */}
            <div className={cn(
                'relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-theme-md',
                'bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/5',
                'border border-brand-200 dark:border-brand-500/20'
            )}>
                {/* Period Selector */}
                <div className="flex gap-1.5 mb-6 p-1 bg-white/50 dark:bg-gray-800/50 rounded-lg w-fit backdrop-blur-sm">
                    {periods.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPeriod(p.id)}
                            disabled={loading}
                            className={cn(
                                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                                period === p.id
                                    ? 'bg-brand-500 text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Background pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    {isPositiveRevenue ? (
                        <ArrowTrendingUpIcon className="w-32 h-32 text-brand-500" />
                    ) : (
                        <ArrowTrendingDownIcon className="w-32 h-32 text-brand-500" />
                    )}
                </div>

                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            isPositiveRevenue
                                ? 'bg-success-500/20 text-success-600 dark:text-success-400'
                                : 'bg-error-500/20 text-error-600 dark:text-error-400'
                        )}>
                            {isPositiveRevenue ? (
                                <ArrowUpIcon className="h-6 w-6" />
                            ) : (
                                <ArrowDownIcon className="h-6 w-6" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {t('totalRevenue')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {getPeriodLabel()}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-3 mb-3">
                            <ArrowPathIcon className="h-8 w-8 animate-spin text-brand-500" />
                        </div>
                    ) : (
                        <>
                            <p className="text-4xl sm:text-5xl font-bold text-brand-600 dark:text-brand-400 mb-2">
                                ${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {t('finance.netProfit') || 'Net Profit'}:
                                </span>
                                <span className={cn(
                                    'text-lg font-bold',
                                    data.profit >= 0
                                        ? 'text-success-600 dark:text-success-400'
                                        : 'text-error-600 dark:text-error-400'
                                )}>
                                    ${Math.abs(data.profit).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        </>
                    )}

                    <div className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                        isPositiveRevenue
                            ? 'bg-success-500/20 text-success-700 dark:text-success-300'
                            : 'bg-error-500/20 text-error-700 dark:text-error-300'
                    )}>
                        {isPositiveRevenue ? (
                            <ArrowTrendingUpIcon className="h-4 w-4" />
                        ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4" />
                        )}
                        {isPositiveRevenue ? '+' : ''}{data.revenueChange}% {getComparisonLabel()}
                    </div>
                </div>
            </div>

            {/* Business Health Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-theme-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    {t('dashboard.businessHealth')}
                </h3>

                <div className="space-y-5">
                    {/* Active Tickets */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                                <TicketIcon className="h-5 w-5 text-brand-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {t('activeTickets')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {activeTickets}
                            </span>
                            {activeTicketsChange !== 0 && (
                                <span className={cn(
                                    'text-xs font-medium px-2 py-0.5 rounded-full',
                                    activeTicketsChange > 0
                                        ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400'
                                        : 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                                )}>
                                    {activeTicketsChange > 0 ? '+' : ''}{activeTicketsChange}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Total Customers */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-success-50 dark:bg-success-500/10 flex items-center justify-center">
                                <UserGroupIcon className="h-5 w-5 text-success-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {t('totalCustomers')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {totalCustomers}
                            </span>
                            {customersChange !== 0 && (
                                <span className={cn(
                                    'text-xs font-medium px-2 py-0.5 rounded-full',
                                    customersChange > 0
                                        ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                                        : 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
                                )}>
                                    {customersChange > 0 ? '+' : ''}{customersChange}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Items */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                lowStockItems > 0
                                    ? 'bg-warning-50 dark:bg-warning-500/10'
                                    : 'bg-gray-100 dark:bg-gray-800'
                            )}>
                                <ArchiveBoxIcon className={cn(
                                    'h-5 w-5',
                                    lowStockItems > 0 ? 'text-warning-500' : 'text-gray-500'
                                )} />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {t('lowStockItems')}
                            </span>
                        </div>
                        <span className={cn(
                            'text-2xl font-bold',
                            lowStockItems > 0
                                ? 'text-warning-600 dark:text-warning-400'
                                : 'text-gray-900 dark:text-white'
                        )}>
                            {lowStockItems}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
