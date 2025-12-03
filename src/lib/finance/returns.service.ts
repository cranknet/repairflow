/**
 * Finance Service - Return Approval v2
 * Handles the complete transactional workflow for approving returns with refunds
 */

import { prisma } from '@/lib/prisma';

export interface ApproveReturnV2Options {
    returnId: string;
    userId: string; // Admin user approving the return
    paymentMethod?: string;
    partialAmount?: number;
    notes?: string;
    createInventoryAdjustment?: boolean;
}

export interface ApproveReturnV2Result {
    return: any;
    payment: any;
    journalEntry: any;
    inventoryAdjustment?: any;
    ticket: any;
}

export interface RejectReturnV2Options {
    returnId: string;
    userId: string;
    reason: string;
}

/**
 * Approve a return with refund - Transactional V2
 * This method runs the entire approval workflow in a single database transaction
 */
export async function approveReturnV2(
    options: ApproveReturnV2Options
): Promise<ApproveReturnV2Result> {
    const {
        returnId,
        userId,
        paymentMethod = 'CASH',
        partialAmount,
        notes,
        createInventoryAdjustment = false,
    } = options;

    // Use Prisma transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch and validate the return
        const returnRecord = await tx.return.findUnique({
            where: { id: returnId },
            include: {
                ticket: {
                    include: {
                        parts: {
                            include: {
                                part: true,
                            },
                        },
                    },
                },
                createdByUser: true,
            },
        });

        if (!returnRecord) {
            throw new Error('Return not found');
        }

        // 2. Validate return status
        if (returnRecord.status !== 'PENDING') {
            throw new Error(`Return is not pending (current status: ${returnRecord.status})`);
        }

        // 3. Check idempotency
        if (returnRecord.isRefunded) {
            throw new Error('Return has already been refunded');
        }

        // 4. Validate ticket status
        if (returnRecord.ticket.status !== 'REPAIRED' && returnRecord.ticket.status !== 'COMPLETED') {
            throw new Error(`Ticket must be REPAIRED or COMPLETED (current status: ${returnRecord.ticket.status})`);
        }

        // 5. Determine refund amount
        const refundAmount = partialAmount || returnRecord.refundAmount;

        if (refundAmount <= 0) {
            throw new Error('Refund amount must be greater than 0');
        }

        if (partialAmount && partialAmount > returnRecord.refundAmount) {
            throw new Error('Partial refund amount cannot exceed requested refund amount');
        }

        // Get currency from settings (or default)
        const currencySetting = await tx.settings.findUnique({
            where: { key: 'currency' },
        });
        const currency = currencySetting?.value || 'USD';

        // 6. Create Payment record for refund
        const payment = await tx.payment.create({
            data: {
                ticketId: returnRecord.ticketId,
                amount: -refundAmount, // Negative for refund
                method: paymentMethod,
                currency: currency,
                reference: `REFUND-${returnRecord.id}`,
                reason: `Refund for return: ${returnRecord.reason}`,
                metadata: JSON.stringify({
                    returnId: returnRecord.id,
                    type: 'REFUND',
                    notes: notes,
                }),
                performedBy: userId,
                createdAt: new Date(),
            },
        });

        // 7. Create JournalEntry for audit trail
        const journalEntry = await tx.journalEntry.create({
            data: {
                type: 'REFUND',
                amount: refundAmount,
                description: `Refund approved for return ${returnRecord.id}`,
                referenceType: 'RETURN',
                referenceId: returnRecord.id,
                ticketId: returnRecord.ticketId,
                notes: notes || `Refund payment ID: ${payment.id}`,
                metadata: JSON.stringify({
                    paymentId: payment.id,
                    returnId: returnRecord.id,
                    originalAmount: returnRecord.refundAmount,
                    refundedAmount: refundAmount,
                }),
                createdById: userId,
                createdAt: new Date(),
            },
        });

        // 8. Optionally create InventoryAdjustment if parts involved
        let inventoryAdjustment = null;
        if (createInventoryAdjustment && returnRecord.ticket.parts.length > 0) {
            // For simplicity, create one adjustment for the first part
            // In production, you might create multiple adjustments
            const firstTicketPart = returnRecord.ticket.parts[0];
            const partCost = firstTicketPart.part.unitPrice * firstTicketPart.quantity;

            inventoryAdjustment = await tx.inventoryAdjustment.create({
                data: {
                    partId: firstTicketPart.partId,
                    qtyChange: firstTicketPart.quantity, // Return parts to inventory
                    cost: partCost,
                    costPerUnit: firstTicketPart.part.unitPrice,
                    reason: `Return approved - parts returned to inventory`,
                    relatedReturnId: returnRecord.id,
                    createdById: userId,
                    createdAt: new Date(),
                },
            });

            // Update part quantity
            await tx.part.update({
                where: { id: firstTicketPart.partId },
                data: {
                    quantity: {
                        increment: firstTicketPart.quantity,
                    },
                },
            });
        }

        // 9. Update Return record with all references
        const updatedReturn = await tx.return.update({
            where: { id: returnId },
            data: {
                status: 'APPROVED',
                handledBy: userId,
                handledAt: new Date(),
                refundPaymentId: payment.id,
                inventoryAdjId: inventoryAdjustment?.id,
                isRefunded: true,
                refundedAt: new Date(),
            },
            include: {
                ticket: true,
                refundPayment: true,
                inventoryAdj: true,
            },
        });

        // 10. Update Ticket status to RETURNED
        const updatedTicket = await tx.ticket.update({
            where: { id: returnRecord.ticketId },
            data: {
                status: 'RETURNED',
            },
        });

        // 11. Create status history entry
        await tx.ticketStatusHistory.create({
            data: {
                ticketId: returnRecord.ticketId,
                status: 'RETURNED',
                notes: `Return approved with refund of ${refundAmount} ${currency}`,
                createdAt: new Date(),
            },
        });

        return {
            return: updatedReturn,
            payment,
            journalEntry,
            inventoryAdjustment,
            ticket: updatedTicket,
        };
    });
}

/**
 * Reject a return - V2
 */
export async function rejectReturnV2(options: RejectReturnV2Options): Promise<any> {
    const { returnId, userId, reason } = options;

    // Validate return exists and is pending
    const returnRecord = await prisma.return.findUnique({
        where: { id: returnId },
    });

    if (!returnRecord) {
        throw new Error('Return not found');
    }

    if (returnRecord.status !== 'PENDING') {
        throw new Error(`Return is not pending (current status: ${returnRecord.status})`);
    }

    // Update return with rejection
    const updatedReturn = await prisma.return.update({
        where: { id: returnId },
        data: {
            status: 'REJECTED',
            handledBy: userId,
            handledAt: new Date(),
            notes: returnRecord.notes ? `${returnRecord.notes}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`,
        },
        include: {
            ticket: true,
        },
    });

    // Create journal entry for audit
    await prisma.journalEntry.create({
        data: {
            type: 'REFUND',
            amount: 0,
            description: `Return rejected`,
            referenceType: 'RETURN',
            referenceId: returnId,
            ticketId: returnRecord.ticketId,
            notes: `Rejection reason: ${reason}`,
            metadata: JSON.stringify({
                returnId: returnId,
                status: 'REJECTED',
            }),
            createdById: userId,
            createdAt: new Date(),
        },
    });

    return updatedReturn;
}
