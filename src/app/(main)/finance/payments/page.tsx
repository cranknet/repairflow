'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';

interface Payment {
    id: string;
    ticketId: string | null;
    amount: number;
    method: string;
    currency: string | null;
    reference: string | null;
    createdAt: string;
    ticket?: {
        ticketNumber: string;
        customer: {
            name: string;
            phone: string;
        };
    };
    performedByUser: {
        name: string | null;
        username: string;
    };
}

export default function PaymentsPage() {
    const { t } = useLanguage();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const limit = 25;

    useEffect(() => {
        fetchPayments();
    }, [page, searchTerm, methodFilter]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (searchTerm) params.append('search', searchTerm);
            if (methodFilter) params.append('method', methodFilter);

            const response = await fetch(`/api/v2/payments?${params}`);
            if (!response.ok) throw new Error('Failed to fetch payments');

            const data = await response.json();
            setPayments(data.data);
            setTotal(data.pagination.total);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchPayments();
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
                <h1 className="text-display-small font-bold text-on-surface mb-2">
                    {t('finance.payments') || 'Payment History'}
                </h1>
                <p className="text-body-medium text-on-surface-variant">
                    {t('finance.payments.pageDescription')}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-surface rounded-lg shadow-md-level1 p-4 mb-6">
                <form onSubmit={handleSearch} className="flex gap-4 flex-wrap items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-label-medium text-on-surface-variant mb-1">
                            {t('finance.payments.search')}
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('finance.payments.searchPlaceholder')}
                            className="w-full px-3 py-2 border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="min-w-[150px]">
                        <label className="block text-label-medium text-on-surface-variant mb-1">
                            {t('finance.payments.paymentMethod')}
                        </label>
                        <select
                            value={methodFilter}
                            onChange={(e) => setMethodFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">{t('finance.payments.allMethods')}</option>
                            <option value="CASH">{t('finance.paymentMethods.CASH')}</option>
                            <option value="CARD">{t('finance.paymentMethods.CARD')}</option>
                            <option value="MOBILE">{t('finance.paymentMethods.MOBILE')}</option>
                            <option value="OTHER">{t('finance.paymentMethods.OTHER')}</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-2 bg-primary text-on-primary rounded-full hover:shadow-md-level2 transition-shadow"
                    >
                        {t('finance.payments.search')}
                    </button>
                </form>
            </div>

            {/* Payments Table */}
            <div className="bg-surface rounded-lg shadow-md-level1 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-outline-variant">
                        <thead className="bg-surface-variant">
                            <tr>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.payments.paymentId')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.ticket')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.customer')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.amount')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.method')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.date')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.performedBy')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-outline-variant">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-body-medium text-on-surface-variant">
                                        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                                        <p className="mt-2">{t('finance.payments.loading')}</p>
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <span className="material-symbols-outlined text-6xl text-on-surface-variant">receipt_long</span>
                                        <p className="mt-2 text-body-large text-on-surface-variant">{t('finance.payments.noPayments')}</p>
                                        <p className="text-body-small text-on-surface-variant">{t('finance.payments.adjustFilters')}</p>
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-surface-variant/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-body-medium font-mono text-on-surface">
                                                {payment.id.substring(0, 8)}...
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {payment.ticket ? (
                                                <Link
                                                    href={`/tickets/${payment.ticketId}`}
                                                    className="text-body-medium text-primary hover:underline"
                                                >
                                                    {payment.ticket.ticketNumber}
                                                </Link>
                                            ) : (
                                                <span className="text-body-medium text-on-surface-variant">{t('finance.common.na')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-body-medium text-on-surface">
                                                {payment.ticket?.customer.name || 'N/A'}
                                            </div>
                                            {payment.ticket?.customer.phone && (
                                                <div className="text-body-small text-on-surface-variant">
                                                    {payment.ticket.customer.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-title-medium font-semibold ${payment.amount < 0 ? 'text-error' : 'text-primary'
                                                }`}>
                                                {payment.amount < 0 ? '-' : ''}${Math.abs(payment.amount).toFixed(2)}
                                            </span>
                                            {payment.amount < 0 && (
                                                <span className="ml-2 px-2 py-1 bg-error-container text-on-error-container text-label-small rounded-full">
                                                    {t('finance.payments.refund')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-label-medium rounded-full">
                                                {payment.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-body-medium text-on-surface">
                                            {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-body-medium text-on-surface">
                                            {payment.performedByUser.name || payment.performedByUser.username}
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
                            {t('finance.payments.showing', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
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
        </div>
    );
}
