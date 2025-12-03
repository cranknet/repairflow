'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { ApproveReturnModal } from '@/components/finance/ApproveReturnModal';
import Link from 'next/link';

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

export default function RefundsPage() {
    const { t } = useLanguage();
    const [returns, setReturns] = useState<Return[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);

    useEffect(() => {
        fetchReturns();
    }, [statusFilter]);

    const fetchReturns = async () => {
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
    };

    const handleApprove = (returnData: Return) => {
        setSelectedReturn(returnData);
        setShowApproveModal(true);
    };

    const handleReject = async (returnId: string) => {
        const reason = prompt('Please enter rejection reason:');
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
            alert('Failed to reject return');
        }
    };

    const getStatusBadge = (status: string, isRefunded: boolean) => {
        if (status === 'PENDING') return 'bg-tertiary-container text-on-tertiary-container';
        if (status === 'APPROVED' && isRefunded) return 'bg-primary-container text-on-primary-container';
        if (status === 'APPROVED') return 'bg-secondary-container text-on-secondary-container';
        if (status === 'REJECTED') return 'bg-error-container text-on-error-container';
        return 'bg-surface-variant text-on-surface-variant';
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link
                    href="/finance"
                    className="flex items-center gap-2 text-primary hover:underline mb-4"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span className="text-label-large">Back to Finance</span>
                </Link>
                <h1 className="text-display-small font-bold text-on-surface mb-2">
                    {t('finance.refunds') || 'Refunds & Returns'}
                </h1>
                <p className="text-body-medium text-on-surface-variant">
                    Manage return requests and process refunds
                </p>
            </div>

            {/* Filters */}
            <div className="bg-surface rounded-lg shadow-md-level1 p-4 mb-6">
                <div className="flex gap-4 items-end">
                    <div className="min-w-[200px]">
                        <label className="block text-label-medium text-on-surface-variant mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Returns Table */}
            <div className="bg-surface rounded-lg shadow-md-level1 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-outline-variant">
                        <thead className="bg-surface-variant">
                            <tr>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    Ticket
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    Refund Amount
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    Handled By
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-outline-variant">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-body-medium text-on-surface-variant">
                                        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                                        <p className="mt-2">Loading returns...</p>
                                    </td>
                                </tr>
                            ) : returns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <span className="material-symbols-outlined text-6xl text-on-surface-variant">receipt_long</span>
                                        <p className="mt-2 text-body-large text-on-surface-variant">No returns found</p>
                                    </td>
                                </tr>
                            ) : (
                                returns.map((returnItem) => (
                                    <tr key={returnItem.id} className="hover:bg-surface-variant/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                href={`/tickets/${returnItem.ticketId}`}
                                                className="text-body-medium text-primary hover:underline font-medium"
                                            >
                                                {returnItem.ticket.ticketNumber}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-body-medium text-on-surface">
                                                {returnItem.ticket.customer.name}
                                            </div>
                                            <div className="text-body-small text-on-surface-variant">
                                                {returnItem.ticket.customer.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-title-medium font-semibold text-error">
                                                ${returnItem.refundAmount.toFixed(2)}
                                            </span>
                                            {returnItem.isRefunded && (
                                                <div className="text-label-small text-primary mt-1">
                                                    <span className="material-symbols-outlined text-sm align-middle">check_circle</span>
                                                    Refunded
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-label-medium rounded-full ${getStatusBadge(returnItem.status, returnItem.isRefunded)}`}>
                                                {returnItem.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-body-medium text-on-surface">
                                            {returnItem.handledByUser?.name || returnItem.handledByUser?.username || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-body-medium text-on-surface">
                                                {new Date(returnItem.createdAt).toLocaleDateString()}
                                            </div>
                                            {returnItem.handledAt && (
                                                <div className="text-body-small text-on-surface-variant">
                                                    Handled: {new Date(returnItem.handledAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {returnItem.status === 'PENDING' && !returnItem.isRefunded && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(returnItem)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-full hover:shadow-md-level2 transition-shadow text-label-medium"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">check</span>
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(returnItem.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-error text-on-error rounded-full hover:shadow-md-level2 transition-shadow text-label-medium"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                            {returnItem.status === 'APPROVED' && returnItem.isRefunded && (
                                                <span className="text-label-small text-primary flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">verified</span>
                                                    Complete
                                                </span>
                                            )}
                                            {returnItem.status === 'REJECTED' && (
                                                <span className="text-label-small text-error">Rejected</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </div>
    );
}
