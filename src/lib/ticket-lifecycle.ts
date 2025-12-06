/**
 * Ticket Status Lifecycle Module
 * Central module for managing ticket status transitions with guards and role-based permissions
 */

import { prisma } from '@/lib/prisma';

// Status constants matching schema.prisma
export const TicketStatus = {
    RECEIVED: 'RECEIVED',
    IN_PROGRESS: 'IN_PROGRESS',
    WAITING_FOR_PARTS: 'WAITING_FOR_PARTS',
    REPAIRED: 'REPAIRED',
    COMPLETED: 'COMPLETED',
    RETURNED: 'RETURNED',
    CANCELLED: 'CANCELLED',
} as const;

export type TicketStatusType = (typeof TicketStatus)[keyof typeof TicketStatus];

// Valid status transitions map
// RETURNED is excluded - it's only accessible via the Return approval flow
const VALID_TRANSITIONS: Record<string, string[]> = {
    [TicketStatus.RECEIVED]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
    [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_FOR_PARTS, TicketStatus.REPAIRED, TicketStatus.CANCELLED],
    [TicketStatus.WAITING_FOR_PARTS]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
    [TicketStatus.REPAIRED]: [TicketStatus.COMPLETED], // RETURNED only via Return flow
    [TicketStatus.COMPLETED]: [], // RETURNED only via Return flow, terminal otherwise
    [TicketStatus.RETURNED]: [], // Terminal state
    [TicketStatus.CANCELLED]: [], // Terminal state
};

// Role-based permissions for transitions
// Format: 'FROM→TO' or '*' for all transitions
const ROLE_PERMISSIONS: Record<string, string[]> = {
    ADMIN: ['*'], // Admin can do all transitions
    STAFF: [
        `${TicketStatus.RECEIVED}→${TicketStatus.IN_PROGRESS}`,
        `${TicketStatus.RECEIVED}→${TicketStatus.CANCELLED}`,
        `${TicketStatus.IN_PROGRESS}→${TicketStatus.WAITING_FOR_PARTS}`,
        `${TicketStatus.IN_PROGRESS}→${TicketStatus.REPAIRED}`,
        `${TicketStatus.IN_PROGRESS}→${TicketStatus.CANCELLED}`,
        `${TicketStatus.WAITING_FOR_PARTS}→${TicketStatus.IN_PROGRESS}`,
        `${TicketStatus.WAITING_FOR_PARTS}→${TicketStatus.CANCELLED}`,
        `${TicketStatus.REPAIRED}→${TicketStatus.COMPLETED}`,
    ],
    TECHNICIAN: [
        `${TicketStatus.RECEIVED}→${TicketStatus.IN_PROGRESS}`,
        `${TicketStatus.IN_PROGRESS}→${TicketStatus.WAITING_FOR_PARTS}`,
        `${TicketStatus.IN_PROGRESS}→${TicketStatus.REPAIRED}`,
        `${TicketStatus.WAITING_FOR_PARTS}→${TicketStatus.IN_PROGRESS}`,
    ],
};

export interface TransitionContext {
    current: TicketStatusType;
    target: TicketStatusType;
    role: string;
    ticketId?: string;
    paymentStatus?: {
        paid: boolean;
        outstandingAmount: number;
    };
}

export interface TransitionResult {
    allowed: boolean;
    reason?: string;
    code?: 'INVALID_TRANSITION' | 'INSUFFICIENT_PERMISSIONS' | 'PAYMENT_REQUIRED' | 'TERMINAL_STATE' | 'RETURN_FLOW_REQUIRED';
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(current: string, target: string): boolean {
    const validTargets = VALID_TRANSITIONS[current] || [];
    return validTargets.includes(target);
}

/**
 * Check if a role has permission for a specific transition
 */
export function hasPermission(role: string, current: string, target: string): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];

    // Admin has all permissions
    if (permissions.includes('*')) {
        return true;
    }

    const transitionKey = `${current}→${target}`;
    return permissions.includes(transitionKey);
}

/**
 * Get allowed transitions for a status
 */
export function getAllowedTransitions(current: string): string[] {
    return VALID_TRANSITIONS[current] || [];
}

/**
 * Get allowed transitions for a status filtered by role
 */
export function getAllowedTransitionsForRole(current: string, role: string): string[] {
    const allAllowed = getAllowedTransitions(current);
    return allAllowed.filter(target => hasPermission(role, current, target));
}

/**
 * Main transition guard function
 * Validates if a transition can be performed based on:
 * 1. Valid transition path
 * 2. Role-based permissions
 * 3. Business rules (payment status, etc.)
 */
export function canTransition(context: TransitionContext): TransitionResult {
    const { current, target, role, paymentStatus } = context;

    // Check if trying to transition to same status (no-op)
    if (current === target) {
        return { allowed: true };
    }

    // Check for terminal states
    if (current === TicketStatus.RETURNED || current === TicketStatus.CANCELLED) {
        return {
            allowed: false,
            reason: `Cannot transition from terminal state: ${current}`,
            code: 'TERMINAL_STATE',
        };
    }

    // Block direct transitions to RETURNED (must use Return flow)
    if (target === TicketStatus.RETURNED) {
        return {
            allowed: false,
            reason: 'RETURNED status can only be set via the Return approval flow',
            code: 'RETURN_FLOW_REQUIRED',
        };
    }

    // Check if transition is valid
    if (!isValidTransition(current, target)) {
        const allowedTargets = getAllowedTransitions(current);
        return {
            allowed: false,
            reason: `Invalid transition from ${current} to ${target}. Allowed: ${allowedTargets.join(', ') || 'none'}`,
            code: 'INVALID_TRANSITION',
        };
    }

    // Check role permissions
    if (!hasPermission(role, current, target)) {
        return {
            allowed: false,
            reason: `Role ${role} does not have permission to transition from ${current} to ${target}`,
            code: 'INSUFFICIENT_PERMISSIONS',
        };
    }

    // Business rule: REPAIRED → COMPLETED requires payment
    if (current === TicketStatus.REPAIRED && target === TicketStatus.COMPLETED) {
        if (paymentStatus && paymentStatus.outstandingAmount > 0) {
            return {
                allowed: false,
                reason: `Cannot complete ticket with outstanding balance of ${paymentStatus.outstandingAmount}. Payment required.`,
                code: 'PAYMENT_REQUIRED',
            };
        }
    }

    return { allowed: true };
}

/**
 * Settings key for return window configuration
 */
export const RETURN_WINDOW_SETTING_KEY = 'return_window_days';
export const DEFAULT_RETURN_WINDOW_DAYS = 30;

/**
 * Get the configured return window in days
 */
export async function getReturnWindowDays(): Promise<number> {
    try {
        const setting = await prisma.settings.findUnique({
            where: { key: RETURN_WINDOW_SETTING_KEY },
        });
        if (setting?.value) {
            const days = parseInt(setting.value, 10);
            if (!isNaN(days) && days > 0) {
                return days;
            }
        }
    } catch (error) {
        console.error('Error fetching return window setting:', error);
    }
    return DEFAULT_RETURN_WINDOW_DAYS;
}

/**
 * Check if a ticket is within the return window
 */
export async function isWithinReturnWindow(completedAt: Date | null): Promise<{ allowed: boolean; reason?: string }> {
    if (!completedAt) {
        return { allowed: false, reason: 'Ticket has no completion date' };
    }

    const returnWindowDays = await getReturnWindowDays();
    const now = new Date();
    const completedDate = new Date(completedAt);
    const daysSinceCompletion = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCompletion > returnWindowDays) {
        return {
            allowed: false,
            reason: `Return window of ${returnWindowDays} days has expired. Ticket was completed ${daysSinceCompletion} days ago.`,
        };
    }

    return { allowed: true };
}

/**
 * Get status display info for UI
 */
export function getStatusDisplayInfo(status: string): { label: string; color: string; description: string } {
    const statusInfo: Record<string, { label: string; color: string; description: string }> = {
        [TicketStatus.RECEIVED]: {
            label: 'Received',
            color: 'blue',
            description: 'Device handed in, ticket created',
        },
        [TicketStatus.IN_PROGRESS]: {
            label: 'In Progress',
            color: 'yellow',
            description: 'Technician has begun diagnostics/repair',
        },
        [TicketStatus.WAITING_FOR_PARTS]: {
            label: 'Waiting for Parts',
            color: 'orange',
            description: 'Awaiting required inventory parts',
        },
        [TicketStatus.REPAIRED]: {
            label: 'Repaired',
            color: 'green',
            description: 'Repair completed, awaiting pickup',
        },
        [TicketStatus.COMPLETED]: {
            label: 'Completed',
            color: 'emerald',
            description: 'Device picked up by customer',
        },
        [TicketStatus.RETURNED]: {
            label: 'Returned',
            color: 'purple',
            description: 'Customer returned repaired device',
        },
        [TicketStatus.CANCELLED]: {
            label: 'Cancelled',
            color: 'red',
            description: 'Job aborted',
        },
    };

    return statusInfo[status] || { label: status, color: 'gray', description: '' };
}
