'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';

interface FinanceSummary {
    dailyRevenue: number;
    dailyRefunds: number;
    dailyExpenses: number;
    grossMargin: number;
    netProfit: number;
    partsUsed: number;
    returnsPending: number;
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
            const response = await fetch('/api/v2/dashboard/finance');
            if (!response.ok) throw new Error('Failed to fetch summary');
            const data = await response.json();
            setSummary(data.summary);
        } catch (error) {
            console.error('Error fetching finance summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        {
            title: 'Payments',
            description: 'View all payment transactions',
            icon: 'payments',
            href: '/finance/payments',
            color: 'bg-primary-container text-on-primary-container',
        },
        {
            title: 'Refunds & Returns',
            description: 'Manage return requests and refunds',
            icon: 'receipt_long',
            href: '/finance/refunds',
            color: 'bg-secondary-container text-on-secondary-container',
        },
        {
            title: 'Expenses',
            description: 'Track business expenses',
            icon: 'shopping_cart',
            href: '/finance/expenses',
            color: 'bg-tertiary-container text-on-tertiary-container',
        },
        {
            title: 'Inventory Adjustments',
            description: 'Monitor inventory changes',
            icon: 'inventory',
            href: '/finance/inventory-adjustments',
            color: 'bg-error-container text-on-error-container',
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-display-small font-bold text-on-surface mb-2">
                    {t('finance') || 'Finance'}
                </h1>
                <p className="text-body-large text-on-surface-variant">
                    Manage payments, expenses, and financial transactions
                </p>
            </div>

            {/* Today's Summary */}
            {loading ? (
                <div className="bg-surface rounded-lg shadow-md-level1 p-12 text-center mb-8">
                    <span className="material-symbols-outlined animate-spin text-4xl text-on-surface-variant">
                        progress_activity
                    </span>
                    <p className="mt-2 text-body-medium text-on-surface-variant">Loading financial summary...</p>
                </div>
            ) : summary ? (
                <div className="mb-8">
                    <h2 className="text-headline-medium font-bold text-on-surface mb-4">Today's Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-surface rounded-lg shadow-md-level1 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-label-large text-on-surface-variant">Revenue</span>
                                <span className="material-symbols-outlined text-primary">trending_up</span>
                            </div>
                            <p className="text-display-small font-bold text-primary">
                                ${summary.dailyRevenue.toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-surface rounded-lg shadow-md-level1 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-label-large text-on-surface-variant">Refunds</span>
                                <span className="material-symbols-outlined text-error">trending_down</span>
                            </div>
                            <p className="text-display-small font-bold text-error">
                                ${summary.dailyRefunds.toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-surface rounded-lg shadow-md-level1 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-label-large text-on-surface-variant">Expenses</span>
                                <span className="material-symbols-outlined text-on-surface-variant">shopping_cart</span>
                            </div>
                            <p className="text-display-small font-bold text-on-surface">
                                ${summary.dailyExpenses.toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-surface rounded-lg shadow-md-level1 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-label-large text-on-surface-variant">Net Profit</span>
                                <span className={`material-symbols-outlined ${summary.netProfit >= 0 ? 'text-primary' : 'text-error'}`}>
                                    {summary.netProfit >= 0 ? 'arrow_upward' : 'arrow_downward'}
                                </span>
                            </div>
                            <p className={`text-display-small font-bold ${summary.netProfit >= 0 ? 'text-primary' : 'text-error'}`}>
                                ${summary.netProfit.toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-surface rounded-lg shadow-md-level1 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-label-large text-on-surface-variant">Gross Margin</span>
                                <span className="material-symbols-outlined text-tertiary">percent</span>
                            </div>
                            <p className="text-display-small font-bold text-tertiary">
                                {summary.grossMargin.toFixed(1)}%
                            </p>
                        </div>

                        <div className="bg-surface rounded-lg shadow-md-level1 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-label-large text-on-surface-variant">Parts Used</span>
                                <span className="material-symbols-outlined text-secondary">inventory_2</span>
                            </div>
                            <p className="text-display-small font-bold text-secondary">
                                {summary.partsUsed}
                            </p>
                        </div>

                        <div className="bg-surface rounded-lg shadow-md-level1 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-label-large text-on-surface-variant">Pending Returns</span>
                                <span className="material-symbols-outlined text-tertiary">pending</span>
                            </div>
                            <p className="text-display-small font-bold text-tertiary">
                                {summary.returnsPending}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Quick Access Cards */}
            <div>
                <h2 className="text-headline-medium font-bold text-on-surface mb-4">Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card) => (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group bg-surface rounded-xl shadow-md-level1 hover:shadow-md-level3 transition-all duration-medium2 overflow-hidden"
                        >
                            <div className={`${card.color} p-6`}>
                                <span className="material-symbols-outlined text-6xl">
                                    {card.icon}
                                </span>
                            </div>
                            <div className="p-6">
                                <h3 className="text-title-large font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-body-medium text-on-surface-variant">
                                    {card.description}
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-primary">
                                    <span className="text-label-large">View details</span>
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                                        arrow_forward
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
