'use client';

import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import {
    TicketStatus,
    getAllowedTransitionsForRole,
    canTransition,
    type TicketStatusType,
    type TransitionResult,
} from '@/lib/ticket-lifecycle';

interface PaymentStatus {
    paid: boolean;
    outstandingAmount: number;
    totalPaid: number;
    finalPrice: number;
}

interface TransitionRequirements {
    requiresConfirmation: boolean;
    requiresReason: boolean;
    requiresPayment: boolean;
    warningMessage?: string;
}

interface UseTicketLifecycleOptions {
    ticketId: string;
    currentStatus: string;
    userRole: string;
    paymentStatus?: PaymentStatus;
    onTransitionComplete?: () => void;
}

interface UseTicketLifecycleReturn {
    // State
    isTransitioning: boolean;
    transitionError: string | null;

    // Computed values
    allowedTransitions: string[];
    isTerminalState: boolean;
    canComplete: boolean;

    // Methods
    checkTransition: (targetStatus: string) => TransitionResult;
    getTransitionRequirements: (targetStatus: string) => TransitionRequirements;
    executeTransition: (targetStatus: string, notes?: string) => Promise<boolean>;

    // Helpers
    getStatusDisplayName: (status: string) => string;
    getStatusColor: (status: string) => string;
}

/**
 * Custom hook for managing ticket lifecycle transitions
 * Provides validation, execution, and UI helpers for status changes
 */
export function useTicketLifecycle({
    ticketId,
    currentStatus,
    userRole,
    paymentStatus,
    onTransitionComplete,
}: UseTicketLifecycleOptions): UseTicketLifecycleReturn {
    const { toast } = useToast();
    const { t } = useLanguage();

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionError, setTransitionError] = useState<string | null>(null);

    // Compute allowed transitions based on current status and role
    const allowedTransitions = useMemo(() => {
        return getAllowedTransitionsForRole(currentStatus, userRole);
    }, [currentStatus, userRole]);

    // Check if current status is terminal
    const isTerminalState = useMemo(() => {
        return currentStatus === TicketStatus.RETURNED || currentStatus === TicketStatus.CANCELLED;
    }, [currentStatus]);

    // Check if ticket can be completed (payment cleared)
    const canComplete = useMemo(() => {
        if (!paymentStatus) return true;
        return paymentStatus.outstandingAmount <= 0;
    }, [paymentStatus]);

    // Check if a transition is valid
    const checkTransition = useCallback((targetStatus: string): TransitionResult => {
        return canTransition({
            current: currentStatus as TicketStatusType,
            target: targetStatus as TicketStatusType,
            role: userRole,
            ticketId,
            paymentStatus: paymentStatus ? {
                paid: paymentStatus.paid,
                outstandingAmount: paymentStatus.outstandingAmount,
            } : undefined,
        });
    }, [currentStatus, userRole, ticketId, paymentStatus]);

    // Get requirements for a transition
    const getTransitionRequirements = useCallback((targetStatus: string): TransitionRequirements => {
        const requirements: TransitionRequirements = {
            requiresConfirmation: false,
            requiresReason: false,
            requiresPayment: false,
        };

        switch (targetStatus) {
            case TicketStatus.CANCELLED:
                requirements.requiresConfirmation = true;
                requirements.requiresReason = true;
                requirements.warningMessage = t('cancelWarning') || 'Cancelled tickets cannot be reopened.';
                break;

            case TicketStatus.COMPLETED:
                if (paymentStatus && paymentStatus.outstandingAmount > 0) {
                    requirements.requiresPayment = true;
                    requirements.warningMessage = t('paymentRequiredMessage') ||
                        `Outstanding balance of $${paymentStatus.outstandingAmount.toFixed(2)} must be cleared.`;
                }
                break;

            case TicketStatus.REPAIRED:
                requirements.warningMessage = t('confirmPartsUsed') || 'Confirm all parts used have been added.';
                break;
        }

        return requirements;
    }, [paymentStatus, t]);

    // Execute a status transition
    const executeTransition = useCallback(async (
        targetStatus: string,
        notes?: string
    ): Promise<boolean> => {
        setIsTransitioning(true);
        setTransitionError(null);

        try {
            // Validate transition first
            const validationResult = checkTransition(targetStatus);
            if (!validationResult.allowed) {
                setTransitionError(validationResult.reason || 'Transition not allowed');
                toast({
                    title: t('error'),
                    description: validationResult.reason || t('transitionNotAllowed') || 'This transition is not allowed',
                    variant: 'destructive',
                });
                return false;
            }

            // Execute the API call
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: targetStatus,
                    statusNotes: notes || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || 'Failed to update status';
                setTransitionError(errorMessage);
                toast({
                    title: t('error'),
                    description: errorMessage,
                    variant: 'destructive',
                });
                return false;
            }

            toast({
                title: t('success'),
                description: t('ticketStatusUpdated'),
            });

            onTransitionComplete?.();
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setTransitionError(errorMessage);
            toast({
                title: t('error'),
                description: errorMessage,
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsTransitioning(false);
        }
    }, [ticketId, checkTransition, toast, t, onTransitionComplete]);

    // Get translated status display name
    const getStatusDisplayName = useCallback((status: string): string => {
        const statusKeys: Record<string, string> = {
            [TicketStatus.RECEIVED]: 'received',
            [TicketStatus.IN_PROGRESS]: 'inProgress',
            [TicketStatus.WAITING_FOR_PARTS]: 'waitingForParts',
            [TicketStatus.REPAIRED]: 'repaired',
            [TicketStatus.COMPLETED]: 'completed',
            [TicketStatus.RETURNED]: 'returned',
            [TicketStatus.CANCELLED]: 'cancelled',
        };

        const key = statusKeys[status];
        return key ? t(key) : status.replace('_', ' ');
    }, [t]);

    // Get status color class
    const getStatusColor = useCallback((status: string): string => {
        const colors: Record<string, string> = {
            [TicketStatus.RECEIVED]: 'blue',
            [TicketStatus.IN_PROGRESS]: 'yellow',
            [TicketStatus.WAITING_FOR_PARTS]: 'orange',
            [TicketStatus.REPAIRED]: 'green',
            [TicketStatus.COMPLETED]: 'emerald',
            [TicketStatus.RETURNED]: 'purple',
            [TicketStatus.CANCELLED]: 'red',
        };

        return colors[status] || 'gray';
    }, []);

    return {
        // State
        isTransitioning,
        transitionError,

        // Computed values
        allowedTransitions,
        isTerminalState,
        canComplete,

        // Methods
        checkTransition,
        getTransitionRequirements,
        executeTransition,

        // Helpers
        getStatusDisplayName,
        getStatusColor,
    };
}
