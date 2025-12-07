'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { ExpenseFormModal } from '@/components/finance/ExpenseFormModal';
import Link from 'next/link';

interface Expense {
    id: string;
    name: string;
    amount: number;
    type: string;
    notes: string | null;
    createdAt: string;
    part?: {
        name: string;
        sku: string;
    };
    createdByUser: {
        name: string | null;
        username: string;
    };
}

const typeConfig: Record<string, { icon: string; gradient: string; bgLight: string }> = {
    PURCHASE: {
        icon: 'shopping_bag',
        gradient: 'from-blue-500 to-indigo-600',
        bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    },
    SHOP: {
        icon: 'store',
        gradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    PART_LOSS: {
        icon: 'warning',
        gradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50 dark:bg-red-900/20',
    },
    MISC: {
        icon: 'category',
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    },
};

export default function ExpensesPage() {
    const { t } = useLanguage();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [typeFilter, setTypeFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const limit = 25;

    useEffect(() => {
        fetchExpenses();
    }, [page, typeFilter, searchTerm]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (typeFilter) params.append('type', typeFilter);
            if (searchTerm) params.append('search', searchTerm);

            const response = await fetch(`/api/v2/expenses?${params}`);
            if (!response.ok) throw new Error('Failed to fetch expenses');

            const data = await response.json();
            setExpenses(data.data);
            setTotal(data.pagination.total);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('finance.messages.deleteExpenseConfirm'))) return;

        try {
            const response = await fetch(`/api/v2/expenses/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete expense');
            fetchExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert(t('finance.messages.deleteExpenseConfirm'));
        }
    };

    // Calculate stats
    const stats = useMemo(() => {
        const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
        const typeTotals = expenses.reduce((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + e.amount;
            return acc;
        }, {} as Record<string, number>);

        return { totalAmount, typeTotals, count: expenses.length };
    }, [expenses]);

    const types = ['PURCHASE', 'SHOP', 'PART_LOSS', 'MISC'];

    // Group expenses by date
    const groupedExpenses = useMemo(() => {
        const groups: Record<string, Expense[]> = {};
        expenses.forEach((expense) => {
            const date = new Date(expense.createdAt).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(expense);
        });
        return groups;
    }, [expenses]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-rose-950">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/finance"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-6 group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        <span className="text-sm font-medium">{t('finance.backToFinance')}</span>
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                {t('finance.expenses') || 'Business Expenses'}
                            </h1>
                            <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl">
                                {t('finance.expenses.pageDescription')}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-theme-sm">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards'
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">view_timeline</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">table_rows</span>
                                </button>
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
                            >
                                <span className="material-symbols-outlined">add</span>
                                {t('finance.expenses.addExpense')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl">account_balance_wallet</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.expenses.totalExpenses') || 'Total'}</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">${stats.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {types.map((type) => {
                        const config = typeConfig[type];
                        return (
                            <div key={type} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                                        <span className="material-symbols-outlined text-white text-xl">{config.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t(`finance.expenseTypes.${type}`)}</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">${(stats.typeTotals[type] || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                        {/* Search */}
                        <div className="flex-1 w-full lg:w-auto">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('finance.expenses.searchPlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Type Filter Pills */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setTypeFilter('')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${typeFilter === ''
                                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {t('finance.expenses.allTypes')}
                            </button>
                            {types.map((type) => {
                                const config = typeConfig[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(type)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${typeFilter === type
                                                ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{config.icon}</span>
                                        {t(`finance.expenseTypes.${type}`)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-white text-3xl animate-spin">progress_activity</span>
                        </div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('finance.expenses.loading')}</p>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">receipt</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('finance.expenses.noExpenses')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">{t('finance.expenses.createOne')}</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
                        >
                            <span className="material-symbols-outlined">add</span>
                            {t('finance.expenses.addExpense')}
                        </button>
                    </div>
                ) : viewMode === 'cards' ? (
                    /* Timeline Cards View */
                    <div className="space-y-6">
                        {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
                            <div key={date}>
                                {/* Date Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-500">calendar_today</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{date}</p>
                                        <p className="text-xs text-gray-500">{dateExpenses.length} expense{dateExpenses.length > 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-4" />
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                        ${dateExpenses.reduce((acc, e) => acc + e.amount, 0).toFixed(2)}
                                    </p>
                                </div>

                                {/* Expense Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ml-5 pl-8 border-l-2 border-gray-200 dark:border-gray-700">
                                    {dateExpenses.map((expense) => {
                                        const config = typeConfig[expense.type] || typeConfig.MISC;
                                        return (
                                            <div
                                                key={expense.id}
                                                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-theme-lg hover:border-primary/20 transition-all duration-300"
                                            >
                                                <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

                                                <div className="p-5">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                                                                <span className="material-symbols-outlined text-white text-xl">{config.icon}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900 dark:text-white">{expense.name}</p>
                                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${config.bgLight} text-gray-700 dark:text-gray-300`}>
                                                                    {expense.type.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <p className="text-xl font-bold text-red-500">-${expense.amount.toFixed(2)}</p>
                                                    </div>

                                                    {expense.notes && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{expense.notes}</p>
                                                    )}

                                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {expense.part && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="material-symbols-outlined text-lg">inventory_2</span>
                                                                    <span>{expense.part.name}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="material-symbols-outlined text-lg">person</span>
                                                                <span>{expense.createdByUser.name || expense.createdByUser.username}</span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => handleDelete(expense.id)}
                                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                                            title={t('finance.expenses.deleteTitle')}
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View */
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.expenseName')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.amount')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.type')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.expenses.part')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.date')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.expenses.createdBy')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {expenses.map((expense) => {
                                        const config = typeConfig[expense.type] || typeConfig.MISC;
                                        return (
                                            <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900 dark:text-white">{expense.name}</p>
                                                    {expense.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{expense.notes}</p>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-base font-semibold text-red-500">-${expense.amount.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.gradient} text-white`}>
                                                        <span className="material-symbols-outlined text-sm">{config.icon}</span>
                                                        {expense.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {expense.part ? (
                                                        <div>
                                                            <p className="text-sm text-gray-900 dark:text-white">{expense.part.name}</p>
                                                            <p className="text-xs text-gray-500">{expense.part.sku}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">{t('finance.common.na')}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                    {new Date(expense.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                    {expense.createdByUser.name || expense.createdByUser.username}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title={t('finance.expenses.deleteTitle')}
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {total > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('finance.expenses.showing', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Page {page} of {Math.ceil(total / limit)}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page * limit >= total}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                Next
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Add Expense Modal */}
                {showAddModal && (
                    <ExpenseFormModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchExpenses();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
