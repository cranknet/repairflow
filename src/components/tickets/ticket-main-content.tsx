'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { DevicePhotos } from './device-photos';
import { ReturnHandler } from './return-handler';
import { PriceAdjustment } from './price-adjustment';
import { SMSSender } from '@/components/sms/sms-sender';

interface StatusHistoryEntry {
    id: string;
    status: string;
    notes: string | null;
    createdAt: Date | string;
}

interface TicketPart {
    id: string;
    quantity: number;
    part: {
        id: string;
        name: string;
        sku: string;
        unitPrice: number;
        quantity?: number;
    };
}

interface PriceAdjustmentEntry {
    id: string;
    ticketId: string;
    userId: string;
    oldPrice: number;
    newPrice: number;
    reason: string;
    createdAt: Date | string;
    user: { name: string | null; username: string };
}

interface TicketMainContentProps {
    ticket: {
        id: string;
        ticketNumber: string;
        status: string;
        trackingCode: string;
        deviceBrand: string;
        deviceModel: string;
        deviceIssue: string;
        deviceConditionFront: string | null;
        deviceConditionBack: string | null;
        estimatedPrice: number;
        finalPrice: number | null;
        paid: boolean;
        notes: string | null;
        customer: {
            id: string;
            name: string;
            phone: string;
            email: string | null;
        };
        statusHistory: StatusHistoryEntry[];
        parts: TicketPart[];
        priceAdjustments: PriceAdjustmentEntry[];
    };
    userRole: string;
}

export function TicketMainContent({ ticket, userRole }: TicketMainContentProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();
    const [showFullHistory, setShowFullHistory] = useState(false);
    const [showPriceHistory, setShowPriceHistory] = useState(false);
    const [removingPartId, setRemovingPartId] = useState<string | null>(null);
    const [clearingAllParts, setClearingAllParts] = useState(false);

    // Check if parts can be modified (only during active repair states)
    const canModifyParts = ['IN_PROGRESS', 'WAITING_FOR_PARTS'].includes(ticket.status) &&
        (userRole === 'ADMIN' || userRole === 'STAFF');

    // Remove a single part from the ticket
    const handleRemovePart = async (ticketPartId: string) => {
        setRemovingPartId(ticketPartId);
        try {
            const response = await fetch(`/api/tickets/${ticket.id}/parts?ticketPartId=${ticketPartId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove part');
            }
            toast({
                title: t('success'),
                description: t('partRemovedFromTicket') || 'Part removed from ticket',
            });
            router.refresh();
        } catch (error: any) {
            toast({
                title: t('error'),
                description: error.message || t('failedToRemovePart') || 'Failed to remove part',
                variant: 'destructive',
            });
        } finally {
            setRemovingPartId(null);
        }
    };

    // Clear all parts from the ticket
    const handleClearAllParts = async () => {
        if (!ticket.parts || ticket.parts.length === 0) return;

        setClearingAllParts(true);
        try {
            // Remove all parts one by one
            for (const part of ticket.parts) {
                const response = await fetch(`/api/tickets/${ticket.id}/parts?ticketPartId=${part.id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to remove part');
                }
            }
            toast({
                title: t('success'),
                description: t('allPartsCleared') || 'All parts cleared from ticket',
            });
            router.refresh();
        } catch (error: any) {
            toast({
                title: t('error'),
                description: error.message || t('failedToClearParts') || 'Failed to clear parts',
                variant: 'destructive',
            });
        } finally {
            setClearingAllParts(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RECEIVED':
                return 'bg-blue-500';
            case 'IN_PROGRESS':
                return 'bg-yellow-500';
            case 'WAITING_FOR_PARTS':
                return 'bg-orange-500';
            case 'REPAIRED':
                return 'bg-green-500';
            case 'COMPLETED':
                return 'bg-emerald-500';
            case 'RETURNED':
                return 'bg-purple-500';
            case 'CANCELLED':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const recentHistory = ticket.statusHistory?.slice(0, 3) || [];
    const hasMoreHistory = (ticket.statusHistory?.length || 0) > 3;
    const displayHistory = showFullHistory ? ticket.statusHistory : recentHistory;

    const partsTotal = ticket.parts?.reduce(
        (sum, tp) => sum + tp.part.unitPrice * tp.quantity,
        0
    ) || 0;

    return (
        <div className="space-y-6">
            {/* Status Timeline */}
            <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-500">history</span>
                        <h2 className="font-semibold">{t('ticketStatusHistory')}</h2>
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            {ticket.statusHistory?.length || 0}
                        </span>
                    </div>
                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${showFullHistory ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                </button>

                {(showFullHistory || recentHistory.length > 0) && (
                    <div className="px-4 pb-4">
                        <div className="relative pl-6 space-y-4">
                            {displayHistory.map((entry, index) => (
                                <div key={entry.id} className="relative">
                                    {/* Timeline line */}
                                    {index < displayHistory.length - 1 && (
                                        <div className="absolute left-[-18px] top-6 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
                                    )}
                                    {/* Timeline dot */}
                                    <div className={`absolute left-[-22px] top-1.5 w-3 h-3 rounded-full ${getStatusColor(entry.status)} ring-2 ring-white dark:ring-gray-900`} />

                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                                        <div>
                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                {entry.status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                                            </p>
                                            {entry.notes && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                                    {entry.notes.replace(/_/g, ' ').replace(/\b[A-Z]+(?:\s+[A-Z]+)*\b/g, (match) => {
                                                        // Convert all-caps segments (like status names) to Title Case
                                                        return match.split(' ').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap font-medium">
                                            {format(new Date(entry.createdAt), 'MMM d, yyyy • h:mm a')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasMoreHistory && !showFullHistory && (
                            <button
                                onClick={() => setShowFullHistory(true)}
                                className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                            >
                                {t('showMore')} ({ticket.statusHistory.length - 3} more)
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* Device Photos */}
            {(ticket.deviceConditionFront || ticket.deviceConditionBack) && (
                <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500">photo_camera</span>
                        {t('devicePhotos')}
                    </h2>
                    <DevicePhotos
                        frontImage={ticket.deviceConditionFront}
                        backImage={ticket.deviceConditionBack}
                    />
                </section>
            )}

            {/* Parts Used */}
            {ticket.parts && ticket.parts.length > 0 && (
                <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                    <h2 className="font-semibold mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-500">inventory_2</span>
                            {t('partsUsed')}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-normal text-gray-500">
                                {ticket.parts.length} {ticket.parts.length === 1 ? 'item' : 'items'}
                            </span>
                            {/* Clear All Parts button - only when parts can be modified */}
                            {canModifyParts && (
                                <button
                                    onClick={handleClearAllParts}
                                    disabled={clearingAllParts}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors disabled:opacity-50"
                                    title={t('clearAllParts') || 'Clear all parts (no parts required)'}
                                >
                                    {clearingAllParts ? (
                                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                            <span className="hidden sm:inline">{t('clearAll') || 'Clear All'}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </h2>

                    {/* Message for wrongly selected parts */}
                    {canModifyParts && (
                        <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">info</span>
                                {t('partsCanBeRemoved') || 'Parts can be removed if not required for this repair.'}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        {ticket.parts.map((tp) => (
                            <div
                                key={tp.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{tp.part.name}</p>
                                    <p className="text-xs text-gray-500 font-mono">{tp.part.sku}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-semibold">{tp.quantity}×</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            ${(tp.part.unitPrice * tp.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                    {/* Remove part button */}
                                    {canModifyParts && (
                                        <button
                                            onClick={() => handleRemovePart(tp.id)}
                                            disabled={removingPartId === tp.id}
                                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                                            title={t('removePart') || 'Remove part'}
                                        >
                                            {removingPartId === tp.id ? (
                                                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-medium">{t('total')}</span>
                            <span className="font-bold text-lg">${partsTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Notes */}
            {ticket.notes && (
                <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                    <h2 className="font-semibold mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500">notes</span>
                        {t('notes')}
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        {ticket.notes}
                    </p>
                </section>
            )}

            {/* Price Adjustments (Collapsible) */}
            {ticket.priceAdjustments && ticket.priceAdjustments.length > 0 && (
                <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setShowPriceHistory(!showPriceHistory)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-gray-500">price_change</span>
                            <h2 className="font-semibold">{t('priceAdjustmentHistory')}</h2>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                {ticket.priceAdjustments.length}
                            </span>
                        </div>
                        <span className={`material-symbols-outlined text-gray-400 transition-transform ${showPriceHistory ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    {showPriceHistory && (
                        <div className="px-4 pb-4 space-y-3">
                            {ticket.priceAdjustments.map((adj) => {
                                const diff = adj.newPrice - adj.oldPrice;
                                const isIncrease = diff > 0;
                                return (
                                    <div key={adj.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">${adj.oldPrice.toFixed(2)}</span>
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                <span className="font-medium">${adj.newPrice.toFixed(2)}</span>
                                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isIncrease
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                    {isIncrease ? '+' : ''}{diff.toFixed(2)}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(adj.createdAt), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{adj.reason}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            by {adj.user.name || adj.user.username}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* Returns Section - Only for REPAIRED/COMPLETED */}
            {(ticket.status === 'REPAIRED' || ticket.status === 'COMPLETED' || ticket.status === 'RETURNED') && (
                <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500">undo</span>
                        {t('returns')}
                    </h2>
                    <ReturnHandler ticket={ticket} />
                </section>
            )}

            {/* Quick Actions */}
            {(userRole === 'ADMIN' || userRole === 'STAFF') && (
                <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500">bolt</span>
                        {t('quickActions')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Price Adjustment - only for REPAIRED/COMPLETED */}
                        {(ticket.status === 'REPAIRED' || ticket.status === 'COMPLETED') && (
                            <PriceAdjustment ticket={ticket} userRole={userRole} />
                        )}

                        {/* SMS Sender */}
                        <div className="sm:col-span-2">
                            <SMSSender
                                phoneNumber={ticket.customer.phone}
                                customerName={ticket.customer.name}
                                ticketData={{
                                    ticketNumber: ticket.ticketNumber,
                                    trackingCode: ticket.trackingCode,
                                    finalPrice: ticket.finalPrice || undefined,
                                }}
                            />
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
