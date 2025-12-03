/**
 * Cash Payment Service
 * Handles manual cash payment recording for tickets and refunds
 */

import { prisma } from '@/lib/prisma';

export interface RecordCashPaymentOptions {
    ticketId: string;
    amount: number;
    userId: string;
    notes?: string;
    receiptNumber?: string;
}

export interface RecordCashRefundOptions {
    returnId: string;
    amount: number;
    userId: string;
    notes?: string;
    receiptNumber?: string;
}

/**
 * Record a cash payment for a ticket
 */
export async function recordCashPayment(options: RecordCashPaymentOptions) {
    const { ticketId, amount, userId, notes, receiptNumber } = options;

    // Validate amount
    if (amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
    }

    // Validate ticket exists
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
    });

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    // Get currency from settings
    const currencySetting = await prisma.settings.findUnique({
        where: { key: 'currency' },
    });
    const currency = currencySetting?.value || 'USD';

    // Create payment record
    const payment = await prisma.payment.create({
        data: {
            ticketId,
            amount,
            method: 'CASH',
            currency,
            reference: receiptNumber,
            reason: notes,
            metadata: JSON.stringify({
                receiptNumber,
                type: 'CASH_PAYMENT',
                notes,
            }),
            performedBy: userId,
            createdAt: new Date(),
        },
    });

    // Create journal entry
    await prisma.journalEntry.create({
        data: {
            type: 'PAYMENT',
            amount,
            description: `Cash payment received for ticket ${ticket.ticketNumber}`,
            referenceType: 'PAYMENT',
            referenceId: payment.id,
            ticketId,
            notes,
            metadata: JSON.stringify({
                paymentId: payment.id,
                receiptNumber,
            }),
            createdById: userId,
            createdAt: new Date(),
        },
    });

    return payment;
}

/**
 * Record a cash refund (called internally by return approval)
 * This is typically called as part of the approveReturnV2 workflow
 */
export async function recordCashRefund(options: RecordCashRefundOptions) {
    const { returnId, amount, userId, notes, receiptNumber } = options;

    // Validate amount
    if (amount <= 0) {
        throw new Error('Refund amount must be greater than 0');
    }

    // Validate return exists
    const returnRecord = await prisma.return.findUnique({
        where: { id: returnId },
        include: {
            ticket: true,
        },
    });

    if (!returnRecord) {
        throw new Error('Return not found');
    }

    // Get currency from settings
    const currencySetting = await prisma.settings.findUnique({
        where: { key: 'currency' },
    });
    const currency = currencySetting?.value || 'USD';

    // Create refund payment record (negative amount)
    const payment = await prisma.payment.create({
        data: {
            ticketId: returnRecord.ticketId,
            amount: -amount, // Negative for refund
            method: 'CASH',
            currency,
            reference: receiptNumber,
            reason: `Refund for return: ${returnRecord.reason}`,
            metadata: JSON.stringify({
                returnId,
                receiptNumber,
                type: 'CASH_REFUND',
                notes,
            }),
            performedBy: userId,
            createdAt: new Date(),
        },
    });

    // Create journal entry
    await prisma.journalEntry.create({
        data: {
            type: 'REFUND',
            amount,
            description: `Cash refund processed for return ${returnId}`,
            referenceType: 'PAYMENT',
            referenceId: payment.id,
            ticketId: returnRecord.ticketId,
            notes,
            metadata: JSON.stringify({
                paymentId: payment.id,
                returnId,
                receiptNumber,
            }),
            createdById: userId,
            createdAt: new Date(),
        },
    });

    return payment;
}
