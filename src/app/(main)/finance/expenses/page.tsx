'use client';

import { useState, useEffect } from 'react';
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

export default function ExpensesPage() {
    const { t } = useLanguage();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [typeFilter, setTypeFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
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

            // Refresh the list
            fetchExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert(t('finance.messages.deleteExpenseConfirm'));
        }
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'PURCHASE': 'bg-primary-container text-on-primary-container',
            'SHOP': 'bg-secondary-container text-on-secondary-container',
            'PART_LOSS': 'bg-error-container text-on-error-container',
            'MISC': 'bg-tertiary-container text-on-tertiary-container',
        };
        return colors[type] || colors['MISC'];
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link
                    href="/finance"
                    className="flex items-center gap-2 text-primary hover:underline mb-4"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span className="text-label-large">{t('finance.backToFinance')}</span>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-display-small font-bold text-on-surface mb-2">
                            {t('finance.expenses') || 'Business Expenses'}
                        </h1>
                        <p className="text-body-medium text-on-surface-variant">
                            {t('finance.expenses.pageDescription')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full hover:shadow-md-level2 transition-shadow"
                    >
                        <span className="material-symbols-outlined">add</span>
                        {t('finance.expenses.addExpense')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-surface rounded-lg shadow-md-level1 p-4 mb-6">
                <div className="flex gap-4 flex-wrap items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-label-medium text-on-surface-variant mb-1">
                            {t('finance.payments.search')}
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('finance.expenses.searchPlaceholder')}
                            className="w-full px-3 py-2 border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="min-w-[150px]">
                        <label className="block text-label-medium text-on-surface-variant mb-1">
                            {t('finance.type')}
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">{t('finance.expenses.allTypes')}</option>
                            <option value="PURCHASE">{t('finance.expenseTypes.PURCHASE')}</option>
                            <option value="SHOP">{t('finance.expenseTypes.SHOP')}</option>
                            <option value="PART_LOSS">{t('finance.expenseTypes.PART_LOSS')}</option>
                            <option value="MISC">{t('finance.expenseTypes.MISC')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-surface rounded-lg shadow-md-level1 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-outline-variant">
                        <thead className="bg-surface-variant">
                            <tr>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.expenseName')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.amount')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.type')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.expenses.part')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.date')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.expenses.createdBy')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-outline-variant">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-body-medium text-on-surface-variant">
                                        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                                        <p className="mt-2">{t('finance.expenses.loading')}</p>
                                    </td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <span className="material-symbols-outlined text-6xl text-on-surface-variant">shopping_cart</span>
                                        <p className="mt-2 text-body-large text-on-surface-variant">{t('finance.expenses.noExpenses')}</p>
                                        <p className="text-body-small text-on-surface-variant">{t('finance.expenses.createOne')}</p>
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-surface-variant/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-body-medium font-medium text-on-surface">{expense.name}</div>
                                            {expense.notes && (
                                                <div className="text-body-small text-on-surface-variant mt-1 line-clamp-1">
                                                    {expense.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-title-medium font-semibold text-error">
                                                ${expense.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-label-medium rounded-full ${getTypeColor(expense.type)}`}>
                                                {expense.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-body-medium text-on-surface">
                                            {expense.part ? (
                                                <div>
                                                    <div>{expense.part.name}</div>
                                                    <div className="text-body-small text-on-surface-variant">{expense.part.sku}</div>
                                                </div>
                                            ) : (
                                                t('finance.common.na')
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-body-medium text-on-surface">
                                            {new Date(expense.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-body-medium text-on-surface">
                                            {expense.createdByUser.name || expense.createdByUser.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-2 rounded-full text-error hover:bg-error-container transition-colors"
                                                title={t('finance.expenses.deleteTitle')}
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {total > 0 && (
                    <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
                        <div className="text-body-medium text-on-surface-variant">
                            {t('finance.expenses.showing', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-surface-variant text-on-surface rounded-full hover:bg-on-surface/8 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <span className="px-4 py-2 text-body-medium text-on-surface flex items-center">
                                {t('finance.payments.page', { current: page, total: Math.ceil(total / limit) })}
                            </span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * limit >= total}
                                className="px-4 py-2 bg-surface-variant text-on-surface rounded-full hover:bg-on-surface/8 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
    );
}
