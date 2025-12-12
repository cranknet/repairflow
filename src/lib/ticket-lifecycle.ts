/**
 * Ticket Status Lifecycle Utilities (Client-safe)
 * Pure utility functions for managing ticket status transitions - no database access
 */

import { getServerTranslation, type Language } from './server-translation';

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
    [TicketStatus.WAITING_FOR_PARTS]: [TicketStatus.IN_PROGRESS, TicketStatus.REPAIRED, TicketStatus.CANCELLED],
    [TicketStatus.REPAIRED]: [TicketStatus.COMPLETED], // RETURNED only via Return flow
    [TicketStatus.COMPLETED]: [], // RETURNED only via Return flow, terminal otherwise
    [TicketStatus.RETURNED]: [], // Terminal state
    [TicketStatus.CANCELLED]: [], // Terminal state
};

// Role-based permissions for transitions
// Format: 'FROM→TO' or '*' for all transitions

const BASE_TECHNICAL_PERMISSIONS = [
    `${TicketStatus.RECEIVED}→${TicketStatus.IN_PROGRESS}`,
    `${TicketStatus.RECEIVED}→${TicketStatus.CANCELLED}`,
    `${TicketStatus.IN_PROGRESS}→${TicketStatus.WAITING_FOR_PARTS}`,
    `${TicketStatus.IN_PROGRESS}→${TicketStatus.REPAIRED}`,
    `${TicketStatus.IN_PROGRESS}→${TicketStatus.CANCELLED}`,
    `${TicketStatus.WAITING_FOR_PARTS}→${TicketStatus.IN_PROGRESS}`,
    `${TicketStatus.WAITING_FOR_PARTS}→${TicketStatus.REPAIRED}`,
    `${TicketStatus.WAITING_FOR_PARTS}→${TicketStatus.CANCELLED}`,
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
    ADMIN: ['*'], // Admin can do all transitions
    STAFF: [
        ...BASE_TECHNICAL_PERMISSIONS,
        `${TicketStatus.REPAIRED}→${TicketStatus.COMPLETED}`,
    ],
    TECHNICIAN: [
        ...BASE_TECHNICAL_PERMISSIONS,
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
 * Status color mapping (colors don't need translation)
 */
const STATUS_COLORS: Record<string, string> = {
    [TicketStatus.RECEIVED]: 'blue',
    [TicketStatus.IN_PROGRESS]: 'yellow',
    [TicketStatus.WAITING_FOR_PARTS]: 'orange',
    [TicketStatus.REPAIRED]: 'green',
    [TicketStatus.COMPLETED]: 'emerald',
    [TicketStatus.RETURNED]: 'purple',
    [TicketStatus.CANCELLED]: 'red',
};

/**
 * Status translation key mapping
 */
const STATUS_KEYS: Record<string, string> = {
    [TicketStatus.RECEIVED]: 'received',
    [TicketStatus.IN_PROGRESS]: 'inProgress',
    [TicketStatus.WAITING_FOR_PARTS]: 'waitingForParts',
    [TicketStatus.REPAIRED]: 'repaired',
    [TicketStatus.COMPLETED]: 'completed',
    [TicketStatus.RETURNED]: 'returned',
    [TicketStatus.CANCELLED]: 'cancelled',
};

/**
 * Get status display info for UI
 * @param status - The ticket status
 * @param lang - Optional language for translations (defaults to 'en')
 */
export function getStatusDisplayInfo(status: string, lang: Language = 'en'): { label: string; color: string; description: string } {
    const key = STATUS_KEYS[status];
    if (!key) {
        return { label: status, color: 'gray', description: '' };
    }

    return {
        label: getServerTranslation(`status.${key}.label`, lang),
        color: STATUS_COLORS[status] || 'gray',
        description: getServerTranslation(`status.${key}.description`, lang),
    };
}
