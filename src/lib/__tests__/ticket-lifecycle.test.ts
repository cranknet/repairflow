/**
 * Unit tests for ticket-lifecycle.ts
 * Tests transition guards, role permissions, and business rules
 */

import {
    TicketStatus,
    canTransition,
    isValidTransition,
    hasPermission,
    getAllowedTransitions,
    getAllowedTransitionsForRole,
} from '../ticket-lifecycle';

describe('Ticket Lifecycle', () => {
    describe('isValidTransition', () => {
        test('RECEIVED -> IN_PROGRESS is valid', () => {
            expect(isValidTransition('RECEIVED', 'IN_PROGRESS')).toBe(true);
        });

        test('RECEIVED -> CANCELLED is valid', () => {
            expect(isValidTransition('RECEIVED', 'CANCELLED')).toBe(true);
        });

        test('RECEIVED -> REPAIRED is invalid (skip step)', () => {
            expect(isValidTransition('RECEIVED', 'REPAIRED')).toBe(false);
        });

        test('IN_PROGRESS -> WAITING_FOR_PARTS is valid', () => {
            expect(isValidTransition('IN_PROGRESS', 'WAITING_FOR_PARTS')).toBe(true);
        });

        test('IN_PROGRESS -> REPAIRED is valid', () => {
            expect(isValidTransition('IN_PROGRESS', 'REPAIRED')).toBe(true);
        });

        test('WAITING_FOR_PARTS -> IN_PROGRESS is valid', () => {
            expect(isValidTransition('WAITING_FOR_PARTS', 'IN_PROGRESS')).toBe(true);
        });

        test('REPAIRED -> COMPLETED is valid', () => {
            expect(isValidTransition('REPAIRED', 'COMPLETED')).toBe(true);
        });

        test('REPAIRED -> RETURNED is invalid (must use Return flow)', () => {
            expect(isValidTransition('REPAIRED', 'RETURNED')).toBe(false);
        });

        test('CANCELLED -> any state is invalid (terminal)', () => {
            expect(isValidTransition('CANCELLED', 'RECEIVED')).toBe(false);
            expect(isValidTransition('CANCELLED', 'IN_PROGRESS')).toBe(false);
        });

        test('RETURNED -> any state is invalid (terminal)', () => {
            expect(isValidTransition('RETURNED', 'RECEIVED')).toBe(false);
            expect(isValidTransition('RETURNED', 'REPAIRED')).toBe(false);
        });
    });

    describe('hasPermission', () => {
        test('ADMIN has all permissions', () => {
            expect(hasPermission('ADMIN', 'RECEIVED', 'IN_PROGRESS')).toBe(true);
            expect(hasPermission('ADMIN', 'IN_PROGRESS', 'CANCELLED')).toBe(true);
            expect(hasPermission('ADMIN', 'REPAIRED', 'COMPLETED')).toBe(true);
        });

        test('STAFF can complete tickets', () => {
            expect(hasPermission('STAFF', 'REPAIRED', 'COMPLETED')).toBe(true);
        });

        test('STAFF can cancel tickets', () => {
            expect(hasPermission('STAFF', 'RECEIVED', 'CANCELLED')).toBe(true);
            expect(hasPermission('STAFF', 'IN_PROGRESS', 'CANCELLED')).toBe(true);
        });

        test('TECHNICIAN cannot cancel tickets', () => {
            expect(hasPermission('TECHNICIAN', 'RECEIVED', 'CANCELLED')).toBe(false);
            expect(hasPermission('TECHNICIAN', 'IN_PROGRESS', 'CANCELLED')).toBe(false);
        });

        test('TECHNICIAN can mark as repaired', () => {
            expect(hasPermission('TECHNICIAN', 'IN_PROGRESS', 'REPAIRED')).toBe(true);
        });

        test('TECHNICIAN cannot complete tickets', () => {
            expect(hasPermission('TECHNICIAN', 'REPAIRED', 'COMPLETED')).toBe(false);
        });
    });

    describe('getAllowedTransitions', () => {
        test('RECEIVED can go to IN_PROGRESS or CANCELLED', () => {
            const allowed = getAllowedTransitions('RECEIVED');
            expect(allowed).toContain('IN_PROGRESS');
            expect(allowed).toContain('CANCELLED');
            expect(allowed).toHaveLength(2);
        });

        test('IN_PROGRESS has 3 options', () => {
            const allowed = getAllowedTransitions('IN_PROGRESS');
            expect(allowed).toContain('WAITING_FOR_PARTS');
            expect(allowed).toContain('REPAIRED');
            expect(allowed).toContain('CANCELLED');
            expect(allowed).toHaveLength(3);
        });

        test('COMPLETED has no transitions', () => {
            const allowed = getAllowedTransitions('COMPLETED');
            expect(allowed).toHaveLength(0);
        });
    });

    describe('getAllowedTransitionsForRole', () => {
        test('TECHNICIAN at IN_PROGRESS cannot cancel', () => {
            const allowed = getAllowedTransitionsForRole('IN_PROGRESS', 'TECHNICIAN');
            expect(allowed).toContain('WAITING_FOR_PARTS');
            expect(allowed).toContain('REPAIRED');
            expect(allowed).not.toContain('CANCELLED');
        });

        test('STAFF at IN_PROGRESS can cancel', () => {
            const allowed = getAllowedTransitionsForRole('IN_PROGRESS', 'STAFF');
            expect(allowed).toContain('CANCELLED');
        });
    });

    describe('canTransition', () => {
        test('valid transition with correct role is allowed', () => {
            const result = canTransition({
                current: 'RECEIVED',
                target: 'IN_PROGRESS',
                role: 'STAFF',
            });
            expect(result.allowed).toBe(true);
        });

        test('same status transition is allowed (no-op)', () => {
            const result = canTransition({
                current: 'IN_PROGRESS',
                target: 'IN_PROGRESS',
                role: 'STAFF',
            });
            expect(result.allowed).toBe(true);
        });

        test('terminal state blocks transition', () => {
            const result = canTransition({
                current: 'RETURNED',
                target: 'IN_PROGRESS',
                role: 'ADMIN',
            });
            expect(result.allowed).toBe(false);
            expect(result.code).toBe('TERMINAL_STATE');
        });

        test('direct RETURNED transition is blocked', () => {
            const result = canTransition({
                current: 'REPAIRED',
                target: 'RETURNED',
                role: 'ADMIN',
            });
            expect(result.allowed).toBe(false);
            expect(result.code).toBe('RETURN_FLOW_REQUIRED');
        });

        test('invalid transition path is rejected', () => {
            const result = canTransition({
                current: 'RECEIVED',
                target: 'REPAIRED', // Skipping IN_PROGRESS
                role: 'ADMIN',
            });
            expect(result.allowed).toBe(false);
            expect(result.code).toBe('INVALID_TRANSITION');
        });

        test('insufficient permissions is rejected', () => {
            const result = canTransition({
                current: 'RECEIVED',
                target: 'CANCELLED',
                role: 'TECHNICIAN', // Technician cannot cancel
            });
            expect(result.allowed).toBe(false);
            expect(result.code).toBe('INSUFFICIENT_PERMISSIONS');
        });

        test('REPAIRED -> COMPLETED requires payment', () => {
            const result = canTransition({
                current: 'REPAIRED',
                target: 'COMPLETED',
                role: 'STAFF',
                paymentStatus: {
                    paid: false,
                    outstandingAmount: 150.00,
                },
            });
            expect(result.allowed).toBe(false);
            expect(result.code).toBe('PAYMENT_REQUIRED');
        });

        test('REPAIRED -> COMPLETED allowed when paid', () => {
            const result = canTransition({
                current: 'REPAIRED',
                target: 'COMPLETED',
                role: 'STAFF',
                paymentStatus: {
                    paid: true,
                    outstandingAmount: 0,
                },
            });
            expect(result.allowed).toBe(true);
        });
    });
});
