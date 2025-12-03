'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';

interface InventoryAdjustment {
    id: string;
    partId: string;
    qtyChange: number;
    cost: number;
    costPerUnit: number | null;
    reason: string;
    relatedReturnId: string | null;
    createdAt: string;
    part: {
        name: string;
        sku: string;
        quantity: number;
    };
    createdByUser: {
        name: string | null;
        username: string;
    };
}

export default function InventoryAdjustmentsPage() {
    const { t } = useLanguage();
    const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 25;

    useEffect(() => {
        fetchAdjustments();
    }, [page]);

    const fetchAdjustments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await fetch(`/api/v2/inventory-adjustments?${params}`);
            if (!response.ok) throw new Error('Failed to fetch inventory adjustments');

            const data = await response.json();
            setAdjustments(data.data);
            setTotal(data.pagination.total);
        } catch (error) {
            console.error('Error fetching inventory adjustments:', error);
        } finally {
            setLoading(false);
        }
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
                    {t('finance.inventory') || 'Inventory Adjustments'}
                </h1>
                <p className="text-body-medium text-on-surface-variant">
                    {t('finance.inventory.pageDescription')}
                </p>
            </div>

            {/* Adjustments Table */}
            <div className="bg-surface rounded-lg shadow-md-level1 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-outline-variant">
                        <thead className="bg-surface-variant">
                            <tr>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.expenses.part')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.inventory.sku')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.qtyChange')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.inventory.totalCost')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.costPerUnit')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.currentStock')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.reason')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.date')}
                                </th>
                                <th className="px-6 py-3 text-left text-label-small text-on-surface-variant uppercase tracking-wider">
                                    {t('finance.expenses.createdBy')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-outline-variant">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-body-medium text-on-surface-variant">
                                        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                                        <p className="mt-2">{t('finance.inventory.loading')}</p>
                                    </td>
                                </tr>
                            ) : adjustments.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <span className="material-symbols-outlined text-6xl text-on-surface-variant">inventory</span>
                                        <p className="mt-2 text-body-large text-on-surface-variant">{t('finance.inventory.noAdjustments')}</p>
                                    </td>
                                </tr>
                            ) : (
                                adjustments.map((adjustment) => (
                                    <tr key={adjustment.id} className="hover:bg-surface-variant/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-body-medium font-medium text-on-surface">
                                                {adjustment.part.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-surface-variant text-on-surface text-label-small font-mono rounded">
                                                {adjustment.part.sku}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-title-medium font-semibold flex items-center gap-1 ${adjustment.qtyChange > 0 ? 'text-primary' : 'text-error'
                                                }`}>
                                                <span className="material-symbols-outlined text-base">
                                                    {adjustment.qtyChange > 0 ? 'add' : 'remove'}
                                                </span>
                                                {Math.abs(adjustment.qtyChange)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-body-medium font-medium ${adjustment.qtyChange > 0 ? 'text-error' : 'text-primary'
                                                }`}>
                                                ${adjustment.cost.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-body-medium text-on-surface">
                                            ${(adjustment.costPerUnit || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-label-medium rounded-full">
                                                {adjustment.part.quantity} {t('finance.inventory.units')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="text-body-medium text-on-surface line-clamp-2">
                                                {adjustment.reason}
                                            </div>
                                            {adjustment.relatedReturnId && (
                                                <div className="mt-1 flex items-center gap-1 text-label-small text-primary">
                                                    <span className="material-symbols-outlined text-sm">link</span>
                                                    {t('finance.linkedToReturn')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-body-medium text-on-surface">
                                            {new Date(adjustment.createdAt).toLocaleDateString()}
                                            <div className="text-body-small text-on-surface-variant">
                                                {new Date(adjustment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-body-medium text-on-surface">
                                            {adjustment.createdByUser.name || adjustment.createdByUser.username}
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
                            {t('finance.inventory.showing', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
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
