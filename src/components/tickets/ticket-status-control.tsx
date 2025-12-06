'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    TicketStatus,
    getAllowedTransitionsForRole,
    canTransition,
    type TicketStatusType,
} from '@/lib/ticket-lifecycle';
import { TicketPrintButtons } from './ticket-print-buttons';

interface TicketStatusControlProps {
    ticket: {
        id: string;
        ticketNumber: string;
        status: string;
        paid: boolean;
        finalPrice: number | null;
        estimatedPrice: number;
        outstandingAmount?: number;
        customer: {
            name: string;
            phone: string;
        };
        returns?: any[];
    };
    userRole: string;
    onStatusChange?: () => void;
}

interface TransitionModalState {
    isOpen: boolean;
    targetStatus: string | null;
    requiresConfirmation: boolean;
    requiresReason: boolean;
    requiresPayment: boolean;
}

export function TicketStatusControl({ ticket, userRole, onStatusChange }: TicketStatusControlProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLanguage();

    const [isUpdating, setIsUpdating] = useState(false);
    const [transitionNotes, setTransitionNotes] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [modalState, setModalState] = useState<TransitionModalState>({
        isOpen: false,
        targetStatus: null,
        requiresConfirmation: false,
        requiresReason: false,
        requiresPayment: false,
    });

    // Get allowed transitions based on current status and user role
    const allowedTransitions = useMemo(() => {
        return getAllowedTransitionsForRole(ticket.status, userRole);
    }, [ticket.status, userRole]);

    // Calculate outstanding amount
    const outstandingAmount = ticket.outstandingAmount ??
        (ticket.finalPrice ?? ticket.estimatedPrice) - (ticket.paid ? (ticket.finalPrice ?? ticket.estimatedPrice) : 0);

    // Check if a transition requires special handling
    const getTransitionRequirements = (targetStatus: string) => {
        return {
            requiresConfirmation: targetStatus === TicketStatus.CANCELLED,
            requiresReason: targetStatus === TicketStatus.CANCELLED,
            requiresPayment: targetStatus === TicketStatus.COMPLETED && outstandingAmount > 0,
        };
    };

    // Status display configuration
    const statusConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
        [TicketStatus.RECEIVED]: {
            color: 'text-blue-700 dark:text-blue-300',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
            icon: 'inbox'
        },
        [TicketStatus.IN_PROGRESS]: {
            color: 'text-yellow-700 dark:text-yellow-300',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            icon: 'build'
        },
        [TicketStatus.WAITING_FOR_PARTS]: {
            color: 'text-orange-700 dark:text-orange-300',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
            icon: 'hourglass_empty'
        },
        [TicketStatus.REPAIRED]: {
            color: 'text-green-700 dark:text-green-300',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            icon: 'check_circle'
        },
        [TicketStatus.COMPLETED]: {
            color: 'text-emerald-700 dark:text-emerald-300',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
            icon: 'verified'
        },
        [TicketStatus.RETURNED]: {
            color: 'text-purple-700 dark:text-purple-300',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
            icon: 'undo'
        },
        [TicketStatus.CANCELLED]: {
            color: 'text-red-700 dark:text-red-300',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
            icon: 'cancel'
        },
    };

    const currentStatusConfig = statusConfig[ticket.status] || statusConfig[TicketStatus.RECEIVED];

    // Handle status change request
    const handleStatusChangeRequest = (targetStatus: string) => {
        const requirements = getTransitionRequirements(targetStatus);

        // Check if payment is required but not cleared
        if (requirements.requiresPayment) {
            toast({
                title: t('paymentRequired') || 'Payment Required',
                description: t('paymentRequiredMessage') || 'Payment must be cleared before marking as completed.',
                variant: 'destructive',
            });
            return;
        }

        // Check if confirmation is needed
        if (requirements.requiresConfirmation || requirements.requiresReason) {
            setModalState({
                isOpen: true,
                targetStatus,
                ...requirements,
            });
            return;
        }

        // Direct transition
        executeTransition(targetStatus);
    };

    // Execute the status transition
    const executeTransition = async (targetStatus: string, notes?: string) => {
        setIsUpdating(true);

        try {
            const response = await fetch(`/api/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: targetStatus,
                    statusNotes: notes || transitionNotes || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update status');
            }

            toast({
                title: t('success'),
                description: t('ticketStatusUpdated'),
            });

            setTransitionNotes('');
            setCancelReason('');
            setModalState({ isOpen: false, targetStatus: null, requiresConfirmation: false, requiresReason: false, requiresPayment: false });

            onStatusChange?.();
            router.refresh();
        } catch (error) {
            toast({
                title: t('error'),
                description: error instanceof Error ? error.message : t('failedToUpdateTicketStatus'),
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle confirmation modal submit
    const handleConfirmTransition = () => {
        if (modalState.requiresReason && !cancelReason.trim()) {
            toast({
                title: t('error'),
                description: t('cancelReasonRequired') || 'Please provide a reason for cancellation',
                variant: 'destructive',
            });
            return;
        }

        const notes = modalState.requiresReason ? cancelReason : transitionNotes;
        executeTransition(modalState.targetStatus!, notes);
    };

    // Check if current status is terminal
    const isTerminalState = ticket.status === TicketStatus.RETURNED || ticket.status === TicketStatus.CANCELLED;

    // Get quick action button config based on current status
    const getQuickActions = () => {
        const actions: Array<{
            status: string;
            label: string;
            variant: 'default' | 'outline' | 'destructive';
            icon: string;
            disabled?: boolean;
            tooltip?: string;
        }> = [];

        if (isTerminalState) return actions;

        switch (ticket.status) {
            case TicketStatus.RECEIVED:
                actions.push({
                    status: TicketStatus.IN_PROGRESS,
                    label: t('startRepair'),
                    variant: 'default',
                    icon: 'play_arrow',
                });
                if (userRole !== 'TECHNICIAN') {
                    actions.push({
                        status: TicketStatus.CANCELLED,
                        label: t('cancel') || 'Cancel',
                        variant: 'destructive',
                        icon: 'close',
                    });
                }
                break;

            case TicketStatus.IN_PROGRESS:
                actions.push({
                    status: TicketStatus.WAITING_FOR_PARTS,
                    label: t('waitingForParts'),
                    variant: 'outline',
                    icon: 'hourglass_empty',
                });
                actions.push({
                    status: TicketStatus.REPAIRED,
                    label: t('markRepaired'),
                    variant: 'default',
                    icon: 'check',
                });
                if (userRole !== 'TECHNICIAN') {
                    actions.push({
                        status: TicketStatus.CANCELLED,
                        label: t('cancel') || 'Cancel',
                        variant: 'destructive',
                        icon: 'close',
                    });
                }
                break;

            case TicketStatus.WAITING_FOR_PARTS:
                actions.push({
                    status: TicketStatus.IN_PROGRESS,
                    label: t('partsArrived'),
                    variant: 'default',
                    icon: 'inventory_2',
                });
                if (userRole !== 'TECHNICIAN') {
                    actions.push({
                        status: TicketStatus.CANCELLED,
                        label: t('cancel') || 'Cancel',
                        variant: 'destructive',
                        icon: 'close',
                    });
                }
                break;

            case TicketStatus.REPAIRED:
                if (userRole !== 'TECHNICIAN') {
                    actions.push({
                        status: TicketStatus.COMPLETED,
                        label: t('markCompleted'),
                        variant: 'default',
                        icon: 'done_all',
                        disabled: outstandingAmount > 0,
                        tooltip: outstandingAmount > 0 ? t('paymentRequiredToComplete') : undefined,
                    });
                }
                break;
        }

        return actions;
    };

    const quickActions = getQuickActions();

    // Helper to format status text properly
    const formatStatus = (status: string) => {
        const key = status.toLowerCase().replace(/_/g, '');
        // Try to translate with simplified key, fallback to Title Case with spaces
        return t(key) || status.replace(/_/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
    };

    return (
        <div className="space-y-4">
            {/* Current Status Display */}
            <div className="flex justify-center w-full">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${currentStatusConfig.bgColor} ${currentStatusConfig.color.replace('text-', 'border-').replace('700', '200').replace('300', '800')}`}>
                    <span className={`material-symbols-outlined ${currentStatusConfig.color}`}>
                        {currentStatusConfig.icon}
                    </span>
                    <span className={`font-medium ${currentStatusConfig.color} uppercase tracking-wide text-sm`}>
                        {formatStatus(ticket.status)}
                    </span>
                </div>
            </div>

            {isTerminalState && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {t('ticketTerminalState')}
                </div>
            )}

            {/* Payment Warning for REPAIRED status */}
            {ticket.status === TicketStatus.REPAIRED && outstandingAmount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            {t('outstandingBalance') || 'Outstanding Balance'}: ${outstandingAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            {t('paymentRequiredMessage') || 'Payment must be cleared before marking as completed.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Print Button Integrated */}
                <TicketPrintButtons ticket={ticket} />

                {quickActions.map((action) => (
                    <Button
                        key={action.status}
                        onClick={() => handleStatusChangeRequest(action.status)}
                        disabled={isUpdating || action.disabled}
                        variant={action.variant}
                        size="sm"
                        title={action.tooltip}
                        className="gap-1"
                    >
                        <span className="material-symbols-outlined text-base">{action.icon}</span>
                        {action.label}
                    </Button>
                ))}
            </div>

            {/* Status Transition Dropdown (for less common transitions) */}
            {!isTerminalState && allowedTransitions.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="relative flex-1 max-w-[200px]">
                        <select
                            value=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleStatusChangeRequest(e.target.value);
                                }
                            }}
                            disabled={isUpdating}
                            className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
                        >
                            <option value="">{t('changeStatus') || 'Change Status...'}</option>
                            {allowedTransitions.map((status) => {
                                const requirements = getTransitionRequirements(status);
                                const isDisabled = requirements.requiresPayment;
                                return (
                                    <option
                                        key={status}
                                        value={status}
                                        disabled={isDisabled}
                                    >
                                        {formatStatus(status)}
                                        {isDisabled ? ` (${t('paymentRequired') || 'Payment Required'})` : ''}
                                    </option>
                                );
                            })}
                        </select>

                        {/* Optional transition notes */}
                        <input
                            type="text"
                            value={transitionNotes}
                            onChange={(e) => setTransitionNotes(e.target.value)}
                            placeholder={t('transitionNotesPlaceholder') || 'Optional notes...'}
                            className="flex-1 h-9 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>
            )}

                    {/* Cancellation Confirmation Modal */}
                    <ConfirmDialog
                        open={modalState.isOpen && modalState.targetStatus === TicketStatus.CANCELLED}
                        onOpenChange={(open) => {
                            if (!open) {
                                setModalState({ ...modalState, isOpen: false });
                                setCancelReason('');
                            }
                        }}
                        title={t('confirmCancellation') || 'Confirm Cancellation'}
                        description={t('cancelWarning') || 'Cancelled tickets cannot be reopened. Any deposits must be refunded manually.'}
                        confirmText={t('confirmCancel') || 'Cancel Ticket'}
                        cancelText={t('goBack') || 'Go Back'}
                        variant="destructive"
                        onConfirm={handleConfirmTransition}
                        isLoading={isUpdating}
                    />

                    {/* Cancellation Reason Input (shown before confirmation) */}
                    {modalState.isOpen && modalState.requiresReason && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                                <h3 className="text-lg font-semibold mb-2">
                                    {t('cancelTicket') || 'Cancel Ticket'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {t('cancelReasonPrompt') || 'Please provide a reason for cancelling this ticket.'}
                                </p>

                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder={t('cancelReasonPlaceholder') || 'Enter cancellation reason...'}
                                    className="w-full h-24 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    autoFocus
                                />

                                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-sm">info</span>
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        {t('refundWarningForCancelled') || 'Any deposits must be refunded manually.'}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setModalState({ ...modalState, isOpen: false });
                                            setCancelReason('');
                                        }}
                                        disabled={isUpdating}
                                    >
                                        {t('goBack') || 'Go Back'}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleConfirmTransition}
                                        disabled={isUpdating || !cancelReason.trim()}
                                    >
                                        {isUpdating ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                                                {t('cancelling') || 'Cancelling...'}
                                            </>
                                        ) : (
                                            t('confirmCancel') || 'Cancel Ticket'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
}
