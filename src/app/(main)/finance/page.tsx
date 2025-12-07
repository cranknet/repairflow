'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FinanceSummary {
    dailyRevenue: number;
    dailyRefunds: number;
    dailyExpenses: number;
    grossMargin: number;
    netProfit: number;
    partsUsed: number;
    returnsPending: number;
    partsCost: number;       // Cost of parts used in completed tickets
    grossProfit: number;     // Revenue - Parts Cost
    inventoryLoss: number;   // Loss from negative inventory adjustments
}


// Reusable metric card for secondary KPIs
function MetricCard({
    label,
    value,
    icon,
    iconColor = 'text-gray-500',
    valueColor = 'text-gray-900 dark:text-white',
}: {
    label: string;
    value: string | number;
    icon: string;
    iconColor?: string;
    valueColor?: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-theme-sm hover:shadow-theme-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800', iconColor)}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
            </div>
            <p className={cn('text-2xl font-bold', valueColor)}>{value}</p>
        </div>
    );
}

// Quick access navigation card
function QuickAccessCard({
    title,
    description,
    icon,
    href,
    accentColor,
}: {
    title: string;
    description: string;
    icon: string;
    href: string;
    accentColor: string;
}) {
    return (
        <Link
            href={href}
            className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-theme-sm hover:shadow-theme-lg transition-all duration-300 overflow-hidden"
        >
            {/* Accent gradient on hover */}
            <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300',
                accentColor
            )} />

            <div className="relative">
                <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
                    accentColor.replace('bg-', 'bg-').replace('-500', '-50'),
                    'dark:bg-opacity-20'
                )}>
                    <span className={cn(
                        'material-symbols-outlined text-2xl',
                        accentColor.replace('bg-', 'text-')
                    )}>
                        {icon}
                    </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-500 transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {description}
                </p>

                <div className="flex items-center gap-1.5 text-brand-500 font-medium text-sm">
                    <span>View details</span>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                        arrow_forward
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default function FinancePage() {
    const { t } = useLanguage();
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            // Use unified finance metrics endpoint with daily period for today's view
            const response = await fetch('/api/finance/metrics?period=daily');
            if (!response.ok) throw new Error('Failed to fetch summary');
            const data = await response.json();
            // Map the unified response to the expected interface
            setSummary({
                dailyRevenue: data.revenue || 0,
                dailyRefunds: data.refunds || 0,
                dailyExpenses: data.expenses || 0,
                grossMargin: data.grossMargin || 0,
                netProfit: data.netProfit || 0,
                partsUsed: data.partsUsedCount || 0,
                returnsPending: data.returnsPendingCount || 0,
                partsCost: data.partsCost || 0,
                grossProfit: data.grossProfit || 0,
                inventoryLoss: data.inventoryLoss || 0,
            });
        } catch (error) {
            console.error('Error fetching finance summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickAccessCards = [
        {
            title: t('finance.payments'),
            description: t('finance.payments.description'),
            icon: 'payments',
            href: '/finance/payments',
            accentColor: 'bg-brand-500',
        },
        {
            title: t('finance.refunds'),
            description: t('finance.refunds.description'),
            icon: 'receipt_long',
            href: '/finance/refunds',
            accentColor: 'bg-warning-500',
        },
        {
            title: t('finance.expenses'),
            description: t('finance.expenses.description'),
            icon: 'shopping_cart',
            href: '/finance/expenses',
            accentColor: 'bg-error-500',
        },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('finance') || 'Finance'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {t('finance.description')}
                </p>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-theme-sm">
                    <span className="material-symbols-outlined animate-spin text-5xl text-gray-400">
                        progress_activity
                    </span>
                    <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
                        {t('finance.loadingSummary')}
                    </p>
                </div>
            ) : summary ? (
                <>
                    {/* Hero Section: Net Profit + Revenue/Expenses Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Net Profit Hero Card */}
                        <div className={cn(
                            'relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-theme-md',
                            summary.netProfit >= 0
                                ? 'bg-gradient-to-br from-success-50 to-success-100 dark:from-success-500/10 dark:to-success-500/5 border border-success-200 dark:border-success-500/20'
                                : 'bg-gradient-to-br from-error-50 to-error-100 dark:from-error-500/10 dark:to-error-500/5 border border-error-200 dark:border-error-500/20'
                        )}>
                            {/* Background pattern */}
                            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                                <span className={cn(
                                    'material-symbols-outlined text-[128px]',
                                    summary.netProfit >= 0 ? 'text-success-500' : 'text-error-500'
                                )}>
                                    {summary.netProfit >= 0 ? 'trending_up' : 'trending_down'}
                                </span>
                            </div>

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn(
                                        'w-12 h-12 rounded-xl flex items-center justify-center',
                                        summary.netProfit >= 0
                                            ? 'bg-success-500/20 text-success-600 dark:text-success-400'
                                            : 'bg-error-500/20 text-error-600 dark:text-error-400'
                                    )}>
                                        <span className="material-symbols-outlined text-2xl">
                                            {summary.netProfit >= 0 ? 'arrow_upward' : 'arrow_downward'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            {t('finance.netProfit')}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {t('finance.todaysSummary')}
                                        </p>
                                    </div>
                                </div>

                                <p className={cn(
                                    'text-4xl sm:text-5xl font-bold mb-3',
                                    summary.netProfit >= 0
                                        ? 'text-success-600 dark:text-success-400'
                                        : 'text-error-600 dark:text-error-400'
                                )}>
                                    ${Math.abs(summary.netProfit).toFixed(2)}
                                </p>

                                <div className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                                    summary.netProfit >= 0
                                        ? 'bg-success-500/20 text-success-700 dark:text-success-300'
                                        : 'bg-error-500/20 text-error-700 dark:text-error-300'
                                )}>
                                    <span className="material-symbols-outlined text-base">
                                        {summary.netProfit >= 0 ? 'check_circle' : 'warning'}
                                    </span>
                                    {summary.netProfit >= 0 ? 'Profitable' : 'Loss'}
                                </div>
                            </div>
                        </div>

                        {/* Revenue vs Expenses Comparison Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-theme-sm">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                {t('finance.todaysSummary')}
                            </h3>

                            <div className="space-y-6">
                                {/* Revenue */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-success-500">trending_up</span>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {t('finance.revenue')}
                                            </span>
                                        </div>
                                        <span className="text-lg font-bold text-success-600 dark:text-success-400">
                                            ${summary.dailyRevenue.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, (summary.dailyRevenue / (summary.dailyRevenue + summary.partsCost + summary.dailyExpenses + summary.dailyRefunds || 1)) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Parts Cost */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-brand-500">build</span>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {t('finance.partsCost') || 'Parts Cost'}
                                            </span>
                                        </div>
                                        <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                                            ${(summary.partsCost || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, ((summary.partsCost || 0) / (summary.dailyRevenue + summary.partsCost + summary.dailyExpenses + summary.dailyRefunds || 1)) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Expenses */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-500">shopping_cart</span>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {t('finance.expenses')}
                                            </span>
                                        </div>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            ${summary.dailyExpenses.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, (summary.dailyExpenses / (summary.dailyRevenue + summary.partsCost + summary.dailyExpenses + summary.dailyRefunds || 1)) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Refunds */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-error-500">trending_down</span>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {t('finance.refundsShort')}
                                            </span>
                                        </div>
                                        <span className="text-lg font-bold text-error-600 dark:text-error-400">
                                            ${summary.dailyRefunds.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-error-400 to-error-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, (summary.dailyRefunds / (summary.dailyRevenue + summary.partsCost + summary.dailyExpenses + summary.dailyRefunds || 1)) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                        <MetricCard
                            label={t('finance.grossMargin')}
                            value={`${summary.grossMargin.toFixed(1)}%`}
                            icon="percent"
                            iconColor="text-brand-500"
                            valueColor={summary.grossMargin >= 50 ? 'text-success-600 dark:text-success-400' : 'text-gray-900 dark:text-white'}
                        />
                        <MetricCard
                            label={t('finance.dailyRefunds')}
                            value={`$${summary.dailyRefunds.toFixed(2)}`}
                            icon="undo"
                            iconColor="text-warning-500"
                            valueColor="text-warning-600 dark:text-warning-400"
                        />
                        <MetricCard
                            label={t('finance.partsUsed')}
                            value={summary.partsUsed}
                            icon="inventory_2"
                            iconColor="text-gray-500"
                        />
                        <MetricCard
                            label={t('finance.returnsPending')}
                            value={summary.returnsPending}
                            icon="pending"
                            iconColor={summary.returnsPending > 0 ? 'text-warning-500' : 'text-gray-500'}
                            valueColor={summary.returnsPending > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-900 dark:text-white'}
                        />
                    </div>
                </>
            ) : null}

            {/* Quick Access Section */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1 bg-brand-500 rounded-full" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {t('finance.quickAccess')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickAccessCards.map((card) => (
                        <QuickAccessCard
                            key={card.href}
                            title={card.title}
                            description={card.description}
                            icon={card.icon}
                            href={card.href}
                            accentColor={card.accentColor}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
