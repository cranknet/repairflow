'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import {
    TicketStatus,
    getAllowedTransitionsForRole,
    canTransition,
    hasPermission,
} from '@/lib/ticket-lifecycle';
import { TicketPrintButtons } from './ticket-print-buttons';

// Extended ticket type for full functionality
interface TicketPart {
    id: string;
    partId: string;
    quantity: number;
    part: {
        id: string;
        name: string;
        sku: string;
        unitPrice: number;
    };
}

interface StatusProgressBarProps {
    ticket: {
        id: string;
        ticketNumber: string;
        status: string;
        paid: boolean;
        finalPrice: number | null;
        estimatedPrice: number;
        outstandingAmount?: number;
        totalPaid?: number;
        customer: {
            name: string;
            phone: string;
        };
        parts?: TicketPart[];
        returns?: any[];
        trackingCode: string;
    };
    userRole: string;
    onStatusChange?: () => void;
    // Modal callbacks - parent controls modal rendering
    onOpenPartsModal?: () => void;
    onOpenPaymentModal?: () => void;
    onOpenReturnModal?: () => void;
    onOpenSMSPrompt?: () => void;
}

// Define the 5-step progress flow
const PROGRESS_STEPS = [
    {
        status: TicketStatus.RECEIVED,
        icon: 'inbox',
        label: 'received',
        description: 'Device received',
    },
    {
        status: TicketStatus.IN_PROGRESS,
        icon: 'build',
        label: 'inProgress',
        description: 'Repair in progress',
    },
    {
        status: TicketStatus.WAITING_FOR_PARTS,
        icon: 'hourglass_empty',
        label: 'waitingForParts',
        description: 'Awaiting parts',
    },
    {
        status: TicketStatus.REPAIRED,
        icon: 'check_circle',
        label: 'repaired',
        description: 'Repair complete',
    },
    {
        status: TicketStatus.COMPLETED,
        icon: 'verified',
        label: 'completed',
        description: 'Delivered to customer',
    },
];

// Terminal states
const TERMINAL_STATES = [TicketStatus.CANCELLED, TicketStatus.RETURNED];

// Modal trigger mapping
type ModalType = 'parts' | 'payment' | 'return' | 'cancel' | null;

const STATUS_MODAL_MAP: Record<string, ModalType> = {
    [TicketStatus.IN_PROGRESS]: 'parts',
    [TicketStatus.WAITING_FOR_PARTS]: 'parts',
    [TicketStatus.REPAIRED]: 'payment',
    [TicketStatus.COMPLETED]: 'return',
};

export function StatusProgressBar({
    ticket,
    userRole,
    onStatusChange,
    onOpenPartsModal,
    onOpenPaymentModal,
    onOpenReturnModal,
    onOpenSMSPrompt,
}: StatusProgressBarProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLanguage();

    const [isUpdating, setIsUpdating] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Calculate outstanding amount
    const outstandingAmount = useMemo(() => {
        if (ticket.outstandingAmount !== undefined) return ticket.outstandingAmount;
        const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice;
        const totalPaid = ticket.totalPaid ?? (ticket.paid ? finalPrice : 0);
        return Math.max(0, finalPrice - totalPaid);
    }, [ticket]);

    // Check if payment is due
    const isPaymentDue = outstandingAmount > 0;

    // Check if parts are linked
    const hasParts = (ticket.parts?.length ?? 0) > 0;

    // Check if in terminal state
    const isTerminal = TERMINAL_STATES.includes(ticket.status as any);

    // Role checks for UI restrictions
    const isAdmin = userRole === 'ADMIN';
    const isTechnician = userRole === 'TECHNICIAN';

    // Get current step index - handle flow where WAITING_FOR_PARTS can be skipped
    const currentStepIndex = useMemo(() => {
        const idx = PROGRESS_STEPS.findIndex(s => s.status === ticket.status);
        return idx >= 0 ? idx : 0;
    }, [ticket.status]);

    // Get progress percentage for the connecting line
    const progressPercentage = useMemo(() => {
        // Skip WAITING_FOR_PARTS in calculation if we went directly to REPAIRED
        if (ticket.status === TicketStatus.REPAIRED || ticket.status === TicketStatus.COMPLETED) {
            // If no parts, we skipped WAITING_FOR_PARTS
            const actualSteps = hasParts ? currentStepIndex : currentStepIndex - 1;
            const totalSteps = hasParts ? PROGRESS_STEPS.length - 1 : PROGRESS_STEPS.length - 2;
            return (actualSteps / totalSteps) * 100;
        }
        return (currentStepIndex / (PROGRESS_STEPS.length - 1)) * 100;
    }, [currentStepIndex, ticket.status, hasParts]);

    // Get allowed transitions for current user
    const allowedTransitions = useMemo(() => {
        return getAllowedTransitionsForRole(ticket.status, userRole);
    }, [ticket.status, userRole]);

    // Check if a transition is valid
    const checkTransition = useCallback((targetStatus: string) => {
        return canTransition({
            current: ticket.status as any,
            target: targetStatus as any,
            role: userRole,
            paymentStatus: {
                paid: ticket.paid,
                outstandingAmount,
            },
        });
    }, [ticket.status, ticket.paid, outstandingAmount, userRole]);

    // Get step visual state
    const getStepState = useCallback((stepIndex: number, stepStatus: string) => {
        if (isTerminal) return 'terminal';

        // Special case: When COMPLETED, all steps show as completed
        if (ticket.status === TicketStatus.COMPLETED) {
            // WAITING_FOR_PARTS might have been skipped
            if (stepStatus === TicketStatus.WAITING_FOR_PARTS && !hasParts) {
                return 'skipped';
            }
            return 'completed';
        }

        // Check if this step was completed
        if (stepIndex < currentStepIndex) {
            // Special case: WAITING_FOR_PARTS was skipped
            if (stepStatus === TicketStatus.WAITING_FOR_PARTS && !hasParts &&
                (ticket.status === TicketStatus.REPAIRED || ticket.status === TicketStatus.COMPLETED)) {
                return 'skipped';
            }
            return 'completed';
        }

        // Current step
        if (stepStatus === ticket.status) {
            // Show warning indicator if payment is due on REPAIRED
            if (stepStatus === TicketStatus.REPAIRED && isPaymentDue) {
                return 'current-warning';
            }
            return 'current';
        }

        // Check if clickable
        const result = checkTransition(stepStatus);
        if (result.allowed) return 'available';

        return 'locked';
    }, [currentStepIndex, ticket.status, isTerminal, hasParts, isPaymentDue, checkTransition]);

    // Determine which modal to open for a status click/re-click
    const getModalForStatus = useCallback((status: string, isReClick: boolean): ModalType => {
        if (status === TicketStatus.CANCELLED) return 'cancel';

        // Re-click opens modal for current status
        if (isReClick) {
            return STATUS_MODAL_MAP[status] || null;
        }

        // Forward click: WAITING_FOR_PARTS opens parts modal
        if (status === TicketStatus.WAITING_FOR_PARTS) return 'parts';

        // COMPLETED requires payment check
        if (status === TicketStatus.COMPLETED && isPaymentDue) return 'payment';

        return null;
    }, [isPaymentDue]);

    // Handle step click/re-click
    const handleStepClick = useCallback(async (stepStatus: string) => {
        if (isUpdating || isTerminal) return;

        const isReClick = stepStatus === ticket.status;
        const modalType = getModalForStatus(stepStatus, isReClick);

        // Handle re-click behavior - open corresponding modal
        if (isReClick) {
            switch (modalType) {
                case 'parts':
                    onOpenPartsModal?.();
                    return;
                case 'payment':
                    onOpenPaymentModal?.();
                    return;
                case 'return':
                    onOpenReturnModal?.();
                    return;
                default:
                    return; // No modal for this status
            }
        }

        // Forward click - check if allowed
        const result = checkTransition(stepStatus);
        if (!result.allowed) {
            toast({
                title: t('error'),
                description: result.reason || t('transitionNotAllowed'),
                variant: 'destructive',
            });
            return;
        }

        // Open modal if needed before transition
        switch (modalType) {
            case 'cancel':
                setShowCancelModal(true);
                return;
            case 'parts':
                onOpenPartsModal?.();
                return;
            case 'payment':
                onOpenPaymentModal?.();
                return;
        }

        // Direct transition without modal
        await executeTransition(stepStatus);
    }, [ticket.status, isUpdating, isTerminal, getModalForStatus, checkTransition, onOpenPartsModal, onOpenPaymentModal, onOpenReturnModal, toast, t]);

    // Execute status transition
    const executeTransition = async (targetStatus: string, notes?: string) => {
        setIsUpdating(true);

        try {
            const response = await fetch(`/api/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: targetStatus,
                    statusNotes: notes || undefined,
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

            setShowCancelModal(false);
            setCancelReason('');

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

    // Handle "No Parts Required" skip
    const handleSkipParts = useCallback(async () => {
        // Transition directly to REPAIRED
        const result = checkTransition(TicketStatus.REPAIRED);
        if (result.allowed) {
            await executeTransition(TicketStatus.REPAIRED, 'No parts required');
        } else {
            toast({
                title: t('error'),
                description: result.reason || t('transitionNotAllowed'),
                variant: 'destructive',
            });
        }
    }, [checkTransition, toast, t]);

    // Handle cancel confirmation
    const handleCancelConfirm = () => {
        if (!cancelReason.trim()) {
            toast({
                title: t('error'),
                description: t('cancelReasonRequired') || 'Please provide a reason for cancellation',
                variant: 'destructive',
            });
            return;
        }
        executeTransition(TicketStatus.CANCELLED, cancelReason);
    };

    // Get tooltip for step
    const getStepTooltip = (step: typeof PROGRESS_STEPS[0], stepState: string) => {
        if (stepState === 'completed') return `✓ ${t(step.label) || step.description}`;
        if (stepState === 'skipped') return t('skippedNoParts') || 'Skipped - no parts needed';
        if (stepState === 'current') return t('currentStatus') || 'Current status';
        if (stepState === 'current-warning') return t('paymentRequiredToComplete') || 'Payment due';
        if (stepState === 'available') return t('clickToAdvance') || 'Click to advance';
        if (stepState === 'locked') {
            // Show role-specific message for TECHNICIAN trying to access COMPLETED
            if (step.status === TicketStatus.COMPLETED && isTechnician) {
                return t('staffOnlyAction') || 'Staff or Admin only';
            }
            if (step.status === TicketStatus.COMPLETED && isPaymentDue) {
                return t('paymentRequiredToComplete') || 'Clear payment first';
            }
            return t('stepLocked') || 'Complete previous steps first';
        }
        return step.description;
    };

    // Get step circle classes
    const getStepClasses = (stepState: string) => {
        const base = 'relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300';

        switch (stepState) {
            case 'completed':
                return `${base} bg-green-500 border-green-500 text-white`;
            case 'skipped':
                return `${base} bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500`;
            case 'current':
                return `${base} bg-primary-500 border-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900 cursor-pointer`;
            case 'current-warning':
                return `${base} bg-amber-500 border-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-900 cursor-pointer`;
            case 'available':
                return `${base} bg-white dark:bg-gray-800 border-primary-400 dark:border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer hover:scale-110`;
            case 'terminal':
                return `${base} bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400`;
            default:
                return `${base} bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500`;
        }
    };

    // Get step icon
    const getStepIcon = (step: typeof PROGRESS_STEPS[0], stepState: string) => {
        if (stepState === 'completed') return 'check';
        if (stepState === 'skipped') return 'remove';
        if (stepState === 'current-warning') return 'warning';
        return step.icon;
    };

    // Format status label
    const formatStatus = (key: string) => {
        return t(key) || key.replace(/_/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
    };

    return (
        <div className="w-full space-y-4">
            {/* Terminal State Banner */}
            {isTerminal && (
                <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${ticket.status === TicketStatus.CANCELLED
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    }`}>
                    <span className="material-symbols-outlined">
                        {ticket.status === TicketStatus.CANCELLED ? 'cancel' : 'undo'}
                    </span>
                    <span className="font-medium uppercase tracking-wide text-sm">
                        {formatStatus(ticket.status.toLowerCase().replace(/_/g, ''))}
                    </span>
                    <span className="text-sm opacity-75">— {t('ticketTerminalState')}</span>
                </div>
            )}

            {/* Progress Bar - Responsive: vertical on mobile, horizontal on desktop */}
            {!isTerminal && (
                <div className="relative pb-2">
                    {/* Desktop: Horizontal Connection Line Background */}
                    <div className="hidden md:block absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700" />

                    {/* Desktop: Horizontal Connection Line Progress */}
                    <div
                        className="hidden md:block absolute top-6 left-6 h-0.5 bg-primary-500 transition-all duration-500"
                        style={{ width: `calc(${progressPercentage}% - 3rem)` }}
                    />

                    {/* Mobile: Vertical Connection Line Background */}
                    <div className="md:hidden absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200 dark:bg-gray-700" />

                    {/* Mobile: Vertical Connection Line Progress */}
                    <div
                        className="md:hidden absolute top-0 left-6 w-0.5 bg-primary-500 transition-all duration-500"
                        style={{ height: `calc(${progressPercentage}%)` }}
                    />

                    {/* Steps - Responsive flex direction */}
                    <div className="relative flex flex-col md:flex-row md:justify-between gap-4 md:gap-0">
                        {PROGRESS_STEPS.map((step, index) => {
                            const stepState = getStepState(index, step.status);
                            const isClickable = stepState === 'available' || stepState === 'current' || stepState === 'current-warning';

                            return (
                                <div
                                    key={step.status}
                                    className="flex items-center md:flex-col md:items-center group gap-3 md:gap-0"
                                >
                                    {/* Step Circle */}
                                    <button
                                        onClick={() => handleStepClick(step.status)}
                                        disabled={isUpdating || (!isClickable && stepState !== 'completed')}
                                        title={getStepTooltip(step, stepState)}
                                        className={`${getStepClasses(stepState)} ${isUpdating ? 'opacity-50 cursor-wait' : ''} shrink-0`}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {getStepIcon(step, stepState)}
                                        </span>

                                        {/* Parts count badge - positioned on circle */}
                                        {step.status === TicketStatus.WAITING_FOR_PARTS && hasParts && (
                                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                                {ticket.parts?.length}
                                            </span>
                                        )}
                                    </button>

                                    {/* Step Content - Label and indicators */}
                                    <div className="flex flex-col md:items-center">
                                        {/* Step Label */}
                                        <span className={`md:mt-2 text-sm md:text-xs font-medium md:text-center md:max-w-[70px] leading-tight ${stepState === 'current' || stepState === 'current-warning'
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : stepState === 'completed'
                                                ? 'text-green-600 dark:text-green-400'
                                                : stepState === 'skipped'
                                                    ? 'text-gray-400 dark:text-gray-500 line-through'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {formatStatus(step.label)}
                                        </span>

                                        {/* Mobile: Step description */}
                                        <span className="md:hidden text-xs text-gray-400 dark:text-gray-500">
                                            {step.description}
                                        </span>

                                        {/* Payment due indicator on REPAIRED */}
                                        {step.status === TicketStatus.REPAIRED && stepState === 'current-warning' && (
                                            <span className="text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap font-medium mt-0.5">
                                                ${outstandingAmount.toFixed(0)} {t('due') || 'due'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Desktop: Tooltip on hover */}
                                    <div className="hidden md:block absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-20">
                                        {getStepTooltip(step, stepState)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Payment Warning Banner */}
            {ticket.status === TicketStatus.REPAIRED && isPaymentDue && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">payments</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            {t('outstandingBalance') || 'Outstanding Balance'}: ${outstandingAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            {t('paymentRequiredMessage') || 'Payment must be cleared before marking as completed.'}
                        </p>
                    </div>
                    <button
                        onClick={() => onOpenPaymentModal?.()}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors"
                    >
                        {t('collectPayment') || 'Collect Payment'}
                    </button>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <TicketPrintButtons ticket={ticket} />

                {/* Current status-specific actions */}
                {ticket.status === TicketStatus.IN_PROGRESS && (
                    <>
                        <button
                            onClick={() => onOpenPartsModal?.()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-md transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">add_circle</span>
                            {t('addParts') || 'Add Parts'}
                        </button>
                        <button
                            onClick={handleSkipParts}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            {t('markRepaired') || 'Mark Repaired'}
                        </button>
                    </>
                )}

                {ticket.status === TicketStatus.WAITING_FOR_PARTS && (
                    <>
                        <button
                            onClick={() => onOpenPartsModal?.()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-md transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">edit</span>
                            {t('manageParts') || 'Manage Parts'}
                        </button>
                        <button
                            onClick={() => handleStepClick(TicketStatus.IN_PROGRESS)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">play_arrow</span>
                            {t('resumeWork') || 'Resume Work'}
                        </button>
                        <button
                            onClick={() => handleStepClick(TicketStatus.REPAIRED)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            {t('partsInstalledComplete') || 'Parts Installed - Complete'}
                        </button>
                    </>
                )}

                {ticket.status === TicketStatus.REPAIRED && (
                    <>
                        {isPaymentDue ? (
                            <button
                                onClick={() => onOpenPaymentModal?.()}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-md transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">payments</span>
                                {t('collectPayment') || 'Collect Payment'}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStepClick(TicketStatus.COMPLETED)}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">check_circle</span>
                                {t('markCompleted') || 'Mark Completed'}
                            </button>
                        )}
                    </>
                )}

                {ticket.status === TicketStatus.COMPLETED && (
                    <>
                        <button
                            onClick={() => onOpenSMSPrompt?.()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">sms</span>
                            {t('sendSMS') || 'Send SMS'}
                        </button>
                        <button
                            onClick={() => onOpenReturnModal?.()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">undo</span>
                            {t('initiateReturn') || 'Initiate Return'}
                        </button>
                    </>
                )}

                {/* Cancel option - available for all roles */}
                {!isTerminal && ticket.status !== TicketStatus.COMPLETED && (
                    <button
                        onClick={() => setShowCancelModal(true)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                        {t('cancel') || 'Cancel'}
                    </button>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
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
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                }}
                                disabled={isUpdating}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                {t('goBack') || 'Go Back'}
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                disabled={isUpdating || !cancelReason.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center"
                            >
                                {isUpdating ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin mr-2 text-base">progress_activity</span>
                                        {t('cancelling') || 'Cancelling...'}
                                    </>
                                ) : (
                                    t('confirmCancel') || 'Cancel Ticket'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
