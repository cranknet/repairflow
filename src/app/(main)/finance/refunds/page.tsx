'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { ApproveReturnModal } from '@/components/finance/ApproveReturnModal';
import Link from 'next/link';
import { CreateReturnModal } from '@/components/returns/create-return-modal';
import {
    ArrowLeftIcon,
    PlusIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    HandThumbUpIcon,
    NoSymbolIcon,
    ArrowPathIcon,
    ArrowUturnLeftIcon,
    UserIcon,
    ChatBubbleLeftIcon,
    CalendarIcon,
    IdentificationIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface Return {
    id: string;
    ticketId: string;
    reason: string;
    refundAmount: number;
    status: string;
    notes: string | null;
    createdAt: string;
    handledAt: string | null;
    isRefunded: boolean;
    refundedAt: string | null;
    ticket: {
        ticketNumber: string;
        customer: {
            name: string;
            phone: string;
        };
    };
    createdByUser: {
        name: string | null;
        username: string;
    };
    handledByUser?: {
        name: string | null;
        username: string;
    };
}

const statusConfig: Record<string, { Icon: HeroIcon; gradient: string; bgLight: string; text: string }> = {
    PENDING: {
        Icon: ClockIcon,
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
    },
    APPROVED: {
        Icon: CheckCircleIcon,
        gradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
    },
    REJECTED: {
        Icon: XCircleIcon,
        gradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
    },
    REFUNDED: {
        Icon: ShieldCheckIcon,
        gradient: 'from-blue-500 to-indigo-600',
        bgLight: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
    },
};

export default function RefundsPage() {
    const { t } = useLanguage();
    const [returns, setReturns] = useState<Return[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchReturns = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/returns?${params}`);
            if (!response.ok) throw new Error('Failed to fetch returns');

            const data = await response.json();
            setReturns(data);
        } catch (error) {
            console.error('Error fetching returns:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const handleApprove = (returnData: Return) => {
        setSelectedReturn(returnData);
        setShowApproveModal(true);
    };

    const handleReject = async (returnId: string) => {
        const reason = prompt(t('finance.refunds.rejectReasonPrompt'));
        if (!reason) return;

        try {
            const response = await fetch(`/api/v2/returns/${returnId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });

            if (!response.ok) throw new Error('Failed to reject return');
            fetchReturns();
        } catch (error) {
            console.error('Error rejecting return:', error);
            alert(t('finance.refunds.rejectFailed'));
        }
    };

    // Calculate stats
    const stats = useMemo(() => {
        const pending = returns.filter((r) => r.status === 'PENDING');
        const approved = returns.filter((r) => r.status === 'APPROVED');
        const rejected = returns.filter((r) => r.status === 'REJECTED');
        const refunded = returns.filter((r) => r.isRefunded);
        const totalRefundAmount = refunded.reduce((acc, r) => acc + r.refundAmount, 0);
        const pendingAmount = pending.reduce((acc, r) => acc + r.refundAmount, 0);

        return {
            pending: pending.length,
            approved: approved.length,
            rejected: rejected.length,
            refunded: refunded.length,
            totalRefundAmount,
            pendingAmount,
            total: returns.length,
        };
    }, [returns]);

    const getDisplayStatus = (returnItem: Return) => {
        if (returnItem.isRefunded) return 'REFUNDED';
        return returnItem.status;
    };

    const statuses = ['PENDING', 'APPROVED', 'REJECTED'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-amber-950">
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
                                {t('finance.refunds') || 'Returns & Refunds'}
                            </h1>
                            <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl">
                                {t('finance.refunds.pageDescription')}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
                        >
                            <PlusIcon className="h-5 w-5" />
                            {t('createReturn')}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center relative">
                                <ClockIcon className="h-6 w-6 text-white" />
                                {stats.pending > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {stats.pending}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.statuses.PENDING') || 'Pending'}</p>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">${stats.pendingAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <HandThumbUpIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.statuses.APPROVED') || 'Approved'}</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <ShieldCheckIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.refunds.totalRefunded') || 'Refunded'}</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${stats.totalRefundAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                                <NoSymbolIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.statuses.REJECTED') || 'Rejected'}</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Filter Pills */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStatusFilter('')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === ''
                                ? 'bg-primary text-white shadow-md shadow-primary/25'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {t('finance.refunds.allStatus')} ({stats.total})
                        </button>
                        {statuses.map((status) => {
                            const config = statusConfig[status];
                            const count = status === 'PENDING' ? stats.pending : status === 'APPROVED' ? stats.approved : stats.rejected;
                            return (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === status
                                        ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <config.Icon className="h-5 w-5" />
                                    {t(`finance.statuses.${status}`)} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center animate-pulse">
                            <ArrowPathIcon className="h-8 w-8 text-white animate-spin" />
                        </div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('finance.refunds.loading')}</p>
                    </div>
                ) : returns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-6">
                            <ArrowUturnLeftIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('finance.refunds.noReturns')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">No return requests found for the selected filter.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
                        >
                            <PlusIcon className="h-5 w-5" />
                            {t('createReturn')}
                        </button>
                    </div>
                ) : (
                    /* Returns Cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {returns.map((returnItem) => {
                            const displayStatus = getDisplayStatus(returnItem);
                            const config = statusConfig[displayStatus];

                            return (
                                <div
                                    key={returnItem.id}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-theme-lg transition-all duration-300"
                                >
                                    {/* Status Bar */}
                                    <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

                                    <div className="p-5">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                                                    <config.Icon className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/tickets/${returnItem.ticketId}`}
                                                        className="font-semibold text-primary hover:underline"
                                                    >
                                                        {returnItem.ticket.ticketNumber}
                                                    </Link>
                                                    <span className={`block px-2 py-0.5 rounded-full text-xs font-medium ${config.bgLight} ${config.text} w-fit mt-1`}>
                                                        {displayStatus}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xl font-bold text-red-500">-${returnItem.refundAmount.toFixed(2)}</p>
                                                {returnItem.isRefunded && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                        <ShieldCheckIcon className="h-4 w-4" />
                                                        {t('finance.refunds.refunded')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Customer Info */}
                                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <UserIcon className="h-5 w-5 text-gray-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{returnItem.ticket.customer.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{returnItem.ticket.customer.phone}</p>
                                                </div>
                                            </div>

                                            {/* Reason */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                    <ChatBubbleLeftIcon className="h-5 w-5 text-gray-500" />
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{returnItem.reason}</p>
                                            </div>

                                            {/* Meta Info */}
                                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    {new Date(returnItem.createdAt).toLocaleDateString()}
                                                </div>
                                                {returnItem.handledByUser && (
                                                    <div className="flex items-center gap-1.5">
                                                        <IdentificationIcon className="h-4 w-4" />
                                                        {returnItem.handledByUser.name || returnItem.handledByUser.username}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {returnItem.status === 'PENDING' && !returnItem.isRefunded && (
                                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <button
                                                    onClick={() => handleApprove(returnItem)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium text-sm"
                                                >
                                                    <CheckIcon className="h-5 w-5" />
                                                    {t('finance.approveReturn')}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(returnItem.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all font-medium text-sm"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                    {t('finance.rejectReturn')}
                                                </button>
                                            </div>
                                        )}

                                        {returnItem.status === 'APPROVED' && returnItem.isRefunded && (
                                            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('finance.refunds.complete')}</span>
                                            </div>
                                        )}

                                        {returnItem.status === 'REJECTED' && (
                                            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <XCircleIcon className="h-5 w-5 text-red-500" />
                                                <span className="text-sm font-medium text-red-600 dark:text-red-400">{t('finance.refunds.rejected')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Approve Modal */}
                {showApproveModal && selectedReturn && (
                    <ApproveReturnModal
                        returnData={{
                            id: selectedReturn.id,
                            refundAmount: selectedReturn.refundAmount,
                            ticketId: selectedReturn.ticketId,
                            reason: selectedReturn.reason,
                        }}
                        onClose={() => {
                            setShowApproveModal(false);
                            setSelectedReturn(null);
                        }}
                        onSuccess={() => {
                            setShowApproveModal(false);
                            setSelectedReturn(null);
                            fetchReturns();
                        }}
                    />
                )}

                {/* Create Return Modal */}
                <CreateReturnModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={fetchReturns}
                />
            </div>
        </div>
    );
}
