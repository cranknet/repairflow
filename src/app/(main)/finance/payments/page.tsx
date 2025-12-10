'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';
import { formatId } from '@/lib/utils';
import {
    ArrowLeftIcon,
    Squares2X2Icon,
    TableCellsIcon,
    DocumentTextIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    WalletIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    BanknotesIcon,
    CreditCardIcon,
    DevicePhoneMobileIcon,
    CurrencyDollarIcon,
    ArrowUturnLeftIcon,
    UserIcon,
    TicketIcon,
    ReceiptPercentIcon,
    IdentificationIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface Payment {
    id: string;
    ticketId: string | null;
    amount: number;
    method: string;
    currency: string | null;
    reference: string | null;
    createdAt: string;
    paymentNumber?: string;
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

const methodIcons: Record<string, HeroIcon> = {
    CASH: BanknotesIcon,
    CARD: CreditCardIcon,
    MOBILE: DevicePhoneMobileIcon,
    OTHER: CurrencyDollarIcon,
};

const methodGradients: Record<string, string> = {
    CASH: 'from-emerald-500 to-teal-600',
    CARD: 'from-violet-500 to-purple-600',
    MOBILE: 'from-blue-500 to-cyan-600',
    OTHER: 'from-amber-500 to-orange-600',
};

export default function PaymentsPage() {
    const { t } = useLanguage();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
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

    // Calculate stats
    const stats = useMemo(() => {
        const totalAmount = payments.reduce((acc, p) => acc + (p.amount > 0 ? p.amount : 0), 0);
        const totalRefunds = payments.reduce((acc, p) => acc + (p.amount < 0 ? Math.abs(p.amount) : 0), 0);
        const methodCounts = payments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { totalAmount, totalRefunds, methodCounts, count: payments.length };
    }, [payments]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchPayments();
    };

    const methods = ['CASH', 'CARD', 'MOBILE', 'OTHER'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/finance"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-6 group"
                    >
                        <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">{t('finance.backToFinance')}</span>
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                {t('finance.payments') || 'Payment History'}
                            </h1>
                            <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl">
                                {t('finance.payments.pageDescription')}
                            </p>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-theme-sm">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Squares2X2Icon className="h-5 w-5" />
                                Cards
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <TableCellsIcon className="h-5 w-5" />
                                Table
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                                <DocumentTextIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.payments.totalPayments') || 'Total Payments'}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.payments.collected') || 'Collected'}</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${stats.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                                <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.payments.refunds') || 'Refunds'}</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">${stats.totalRefunds.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <WalletIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.payments.netAmount') || 'Net Amount'}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">${(stats.totalAmount - stats.totalRefunds).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1 w-full lg:w-auto">
                            <div className="relative">
                                <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('finance.payments.searchPlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                />
                            </div>
                        </form>

                        {/* Method Filter Pills */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setMethodFilter('')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${methodFilter === ''
                                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {t('finance.payments.allMethods')}
                            </button>
                            {methods.map((method) => (
                                <button
                                    key={method}
                                    onClick={() => setMethodFilter(method)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${methodFilter === method
                                        ? `bg-gradient-to-r ${methodGradients[method]} text-white shadow-md`
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {(() => { const Icon = methodIcons[method]; return <Icon className="h-5 w-5" />; })()}
                                    {t(`finance.paymentMethods.${method}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center animate-pulse">
                            <ArrowPathIcon className="h-8 w-8 text-white animate-spin" />
                        </div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('finance.payments.loading')}</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-6">
                            <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('finance.payments.noPayments')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">{t('finance.payments.adjustFilters')}</p>
                    </div>
                ) : viewMode === 'cards' ? (
                    /* Cards View */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-theme-lg hover:border-primary/20 transition-all duration-300"
                            >
                                {/* Card Header with Method Badge */}
                                <div className={`h-2 bg-gradient-to-r ${methodGradients[payment.method] || methodGradients.OTHER}`} />

                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${methodGradients[payment.method] || methodGradients.OTHER} flex items-center justify-center shadow-lg`}>
                                                {(() => { const Icon = methodIcons[payment.method] || CurrencyDollarIcon; return <Icon className="h-5 w-5 text-white" />; })()}
                                            </div>
                                            <div>
                                                <p className="font-mono text-sm text-gray-500 dark:text-gray-400">
                                                    {payment.paymentNumber || formatId(payment.id)}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {new Date(payment.createdAt).toLocaleDateString()} • {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className={`text-xl font-bold ${payment.amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {payment.amount < 0 ? '-' : '+'}${Math.abs(payment.amount).toFixed(2)}
                                            </p>
                                            {payment.amount < 0 && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                                                    <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                                                    {t('finance.payments.refund')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer & Ticket Info */}
                                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        {payment.ticket ? (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                        <UserIcon className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{payment.ticket.customer.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{payment.ticket.customer.phone}</p>
                                                    </div>
                                                </div>

                                                <Link
                                                    href={`/tickets/${payment.ticketId}`}
                                                    className="flex items-center gap-3 group/link"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <TicketIcon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <span className="text-sm font-medium text-primary group-hover/link:underline">{payment.ticket.ticketNumber}</span>
                                                </Link>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <ReceiptPercentIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <span className="text-sm text-gray-400">{t('finance.common.na')}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                <IdentificationIcon className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {payment.performedByUser.name || payment.performedByUser.username}
                                            </p>
                                        </div>
                                    </div>
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
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.payments.paymentId')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.ticket')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.customer')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.amount')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.method')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.date')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.performedBy')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm text-gray-900 dark:text-white">{payment.paymentNumber || formatId(payment.id)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {payment.ticket ? (
                                                    <Link href={`/tickets/${payment.ticketId}`} className="text-sm font-medium text-primary hover:underline">
                                                        {payment.ticket.ticketNumber}
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400">{t('finance.common.na')}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{payment.ticket?.customer.name || 'N/A'}</p>
                                                {payment.ticket?.customer.phone && (
                                                    <p className="text-xs text-gray-500">{payment.ticket.customer.phone}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-base font-semibold ${payment.amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {payment.amount < 0 ? '-' : ''}${Math.abs(payment.amount).toFixed(2)}
                                                </span>
                                                {payment.amount < 0 && (
                                                    <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                                                        Refund
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${methodGradients[payment.method]} text-white`}>
                                                    {(() => { const Icon = methodIcons[payment.method]; return <Icon className="h-3.5 w-3.5" />; })()}
                                                    {payment.method}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                {payment.performedByUser.name || payment.performedByUser.username}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {total > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('finance.payments.showing', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                <ChevronLeftIcon className="h-5 w-5" />
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
                                <ChevronRightIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
