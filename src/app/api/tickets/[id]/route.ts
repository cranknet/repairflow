import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { emitEvent } from '@/lib/events/emitter';
import { nanoid } from 'nanoid';
import {
  TicketStatus,
  canTransition,
  getAllowedTransitionsForRole,
  type TicketStatusType
} from '@/lib/ticket-lifecycle';

// Schema for ticket updates – parts field removed
const updateTicketSchema = z.object({
  status: z.enum([
    'RECEIVED',
    'IN_PROGRESS',
    'WAITING_FOR_PARTS',
    'REPAIRED',
    'COMPLETED',
    'CANCELLED'
  ]).optional(),
  finalPrice: z.number().optional(),
  priceAdjustment: z.number().optional(), // Relative adjustment (+/- amount)
  paid: z.boolean().optional(),
  assignedToId: z.string().nullable().optional(),
  notes: z.string().optional(),
  statusNotes: z.string().optional(),
  priceAdjustmentReason: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        // Keep parts include for backward compatibility (no write operations)
        parts: { include: { part: true } },
        priceAdjustments: {
          include: {
            user: {
              select: {
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: {
            performedByUser: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Calculate outstanding amount and total paid
    const totalPaid = ticket.payments.reduce((sum, p) => sum + p.amount, 0);
    const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice;
    const outstandingAmount = Math.max(0, finalPrice - totalPaid);

    return NextResponse.json({
      ...ticket,
      totalPaid,
      outstandingAmount,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let updateData: any = {};

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateTicketSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Prevent any updates for terminal state tickets (RETURNED, CANCELLED)
    // The lifecycle guard handles transition validation, this blocks all updates
    if ((ticket.status === 'RETURNED' || ticket.status === 'CANCELLED') && data.status) {
      return NextResponse.json(
        { error: `Cannot change status of a ${ticket.status.toLowerCase()} ticket` },
        { status: 400 }
      );
    }

    updateData = { ...data };
    // These are not columns on Ticket model
    delete updateData.priceAdjustmentReason;
    delete updateData.statusNotes;
    delete updateData.priceAdjustment;

    // Validate assignedToId if it's being updated and not null
    // Note: assignedToId can be null (unassigned), so we only validate if it's a non-null value
    if (data.assignedToId !== undefined && data.assignedToId !== null && data.assignedToId.trim() !== '') {
      const assignedUser = await prisma.user.findUnique({
        where: { id: data.assignedToId },
      });
      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 400 }
        );
      }
    }

    // Paid status change handling (admin / staff only)
    if (data.paid !== undefined && data.paid !== ticket.paid) {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        return NextResponse.json({ error: 'Only admin or staff can change payment status' }, { status: 403 });
      }
      // Emit ticket.updated event for payment status change
      emitEvent({
        eventId: nanoid(),
        entityType: 'ticket',
        entityId: ticket.id,
        action: 'updated',
        actorId: session.user.id,
        actorName: session.user.name || session.user.username,
        timestamp: new Date(),
        summary: `Ticket ${ticket.ticketNumber} marked as ${data.paid ? 'paid' : 'unpaid'}`,
        meta: {
          ticketNumber: ticket.ticketNumber,
          changeType: 'payment_status',
        },
        customerId: ticket.customerId,
        ticketId: ticket.id,
      });
    }

    // Status change handling
    if (data.status && data.status !== ticket.status) {
      // Calculate payment status for transition validation
      const payments = await prisma.payment.findMany({
        where: { ticketId: id },
      });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice;
      const outstandingAmount = Math.max(0, finalPrice - totalPaid);

      // Use transition guard to validate the status change
      const transitionResult = canTransition({
        current: ticket.status as TicketStatusType,
        target: data.status as TicketStatusType,
        role: session.user.role,
        ticketId: id,
        paymentStatus: {
          paid: ticket.paid,
          outstandingAmount,
        },
      });

      if (!transitionResult.allowed) {
        const allowedTransitions = getAllowedTransitionsForRole(ticket.status, session.user.role);
        return NextResponse.json(
          {
            error: transitionResult.reason,
            code: transitionResult.code,
            allowedTransitions,
          },
          { status: transitionResult.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 400 }
        );
      }

      // Verify the user exists before creating status history
      // This prevents foreign key constraint violations after database reset
      const statusUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });

      if (!statusUser) {
        return NextResponse.json(
          {
            error: 'Authentication error',
            details: 'Your user account is no longer valid. Please log out and log in again.'
          },
          { status: 401 }
        );
      }

      // Create status history entry with changedById
      updateData.statusHistory = {
        create: {
          status: data.status,
          notes: data.statusNotes || `Status changed from ${ticket.status} to ${data.status}`,
          changedById: session.user.id,
        },
      };

      // Mark completedAt when ticket becomes COMPLETED (previously was REPAIRED)
      if (data.status === TicketStatus.COMPLETED && !ticket.completedAt) {
        updateData.completedAt = new Date();

        // Auto-set finalPrice from estimatedPrice if not already adjusted
        if (ticket.finalPrice === null && ticket.estimatedPrice !== null) {
          updateData.finalPrice = ticket.estimatedPrice;
        }
      }

      // Emit ticket.status_changed event
      emitEvent({
        eventId: nanoid(),
        entityType: 'ticket',
        entityId: ticket.id,
        action: 'status_changed',
        actorId: session.user.id,
        actorName: session.user.name || session.user.username,
        timestamp: new Date(),
        summary: `Ticket ${ticket.ticketNumber} status changed from ${ticket.status} to ${data.status}`,
        meta: {
          ticketNumber: ticket.ticketNumber,
          oldStatus: ticket.status,
          newStatus: data.status,
        },
        customerId: ticket.customerId,
        ticketId: ticket.id,
      });

      // Emit repairjob.completed event when status changes to REPAIRED
      if (data.status === TicketStatus.REPAIRED) {
        emitEvent({
          eventId: nanoid(),
          entityType: 'repairjob',
          entityId: ticket.id,
          action: 'completed',
          actorId: session.user.id,
          actorName: session.user.name || session.user.username,
          timestamp: new Date(),
          summary: `Repair job ${ticket.ticketNumber} has been completed`,
          meta: {
            ticketNumber: ticket.ticketNumber,
          },
          customerId: ticket.customerId,
          ticketId: ticket.id,
        });
      }
    }

    // Price adjustment (admin / staff only)
    // Supports both absolute (finalPrice) and relative (priceAdjustment) modes
    const hasAbsolutePrice = data.finalPrice !== undefined;
    const hasRelativeAdjustment = data.priceAdjustment !== undefined && data.priceAdjustment !== 0;

    if ((hasAbsolutePrice || hasRelativeAdjustment) && (session.user.role === 'ADMIN' || session.user.role === 'STAFF')) {
      // Allow adjustments for REPAIRED or COMPLETED tickets
      if (ticket.status === 'REPAIRED' || ticket.status === 'COMPLETED' || data.status === 'REPAIRED') {
        const currentFinalPrice = ticket.finalPrice ?? ticket.estimatedPrice;

        // Calculate new price based on mode
        let newFinalPrice: number;
        if (hasRelativeAdjustment) {
          // Relative adjustment: add/subtract from current price
          newFinalPrice = currentFinalPrice + data.priceAdjustment!;
          if (newFinalPrice < 0) {
            return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 });
          }
        } else {
          newFinalPrice = data.finalPrice!;
        }

        const isInitialPriceSetting = ticket.finalPrice === null;
        const priceIsChanging = isInitialPriceSetting || Math.abs(currentFinalPrice - newFinalPrice) > 0.01;

        if (priceIsChanging) {
          // For subsequent adjustments (not initial), require a reason
          if (!isInitialPriceSetting && (!data.priceAdjustmentReason || data.priceAdjustmentReason.trim() === '')) {
            return NextResponse.json({ error: 'Reason is required for price adjustment' }, { status: 400 });
          }

          // Verify the user exists before creating price adjustment
          // This prevents foreign key constraint violations
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true },
          });

          if (!user) {
            return NextResponse.json(
              {
                error: 'Authentication error',
                details: 'Your user account is no longer valid. Please log out and log in again.'
              },
              { status: 401 }
            );
          }

          // Determine the reason for the history entry
          const adjustmentReason = isInitialPriceSetting
            ? (data.priceAdjustmentReason?.trim() || 'Initial price set upon repair completion')
            : data.priceAdjustmentReason!.trim();

          // Always create a price adjustment history entry for any price change
          updateData.priceAdjustments = {
            create: {
              userId: session.user.id,
              oldPrice: currentFinalPrice ?? ticket.estimatedPrice ?? 0,
              newPrice: newFinalPrice,
              reason: adjustmentReason,
            },
          };

          // Check if ticket has been paid - if so, create an adjustment payment
          const existingPayments = await prisma.payment.findMany({
            where: { ticketId: ticket.id },
            orderBy: { createdAt: 'desc' },
          });

          const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
          const hasPaidPayments = totalPaid > 0;

          // If ticket has payments and price is being adjusted (not initial setting),
          // create an adjustment payment record
          if (hasPaidPayments && !isInitialPriceSetting) {
            const priceDifference = newFinalPrice - currentFinalPrice;

            // Generate payment number
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const existingPaymentsToday = await prisma.payment.count({
              where: {
                paymentNumber: {
                  startsWith: `PAY-${dateStr}`,
                },
              },
            });
            const sequenceNumber = (existingPaymentsToday + 1).toString().padStart(4, '0');
            const paymentNumber = `PAY-${dateStr}-${sequenceNumber}`;

            // Determine adjustment type
            const adjustmentType = priceDifference > 0
              ? 'PRICE_INCREASE'
              : priceDifference < 0
                ? 'PRICE_DECREASE'
                : 'CORRECTION';

            // Find the most recent non-adjustment payment as the "original"
            const originalPayment = existingPayments.find(p => !p.isAdjustment);

            // Create adjustment payment linked to the price adjustment
            await prisma.payment.create({
              data: {
                paymentNumber,
                ticketId: ticket.id,
                amount: priceDifference, // Can be positive or negative
                method: originalPayment?.method || 'CASH',
                currency: originalPayment?.currency,
                performedBy: session.user.id,
                reason: `Price Adjustment: ${adjustmentReason}`,
                isAdjustment: true,
                adjustmentType,
                originalPaymentId: originalPayment?.id,
                metadata: JSON.stringify({
                  autoCreated: true,
                  oldPrice: currentFinalPrice,
                  newPrice: newFinalPrice,
                  priceDifference,
                }),
              },
            });

            // If this is a price decrease (customer gets credit), mark ticket as not fully paid
            if (priceDifference < 0 && ticket.paid) {
              updateData.paid = false;
            }

            console.log(`Created adjustment payment: ${priceDifference > 0 ? '+' : ''}${priceDifference.toFixed(2)} for ticket ${ticket.ticketNumber}`);
          }

          // Emit charge.added event for price adjustment
          emitEvent({
            eventId: nanoid(),
            entityType: 'charge',
            entityId: ticket.id,
            action: 'added',
            actorId: session.user.id,
            actorName: session.user.name || session.user.username,
            timestamp: new Date(),
            summary: isInitialPriceSetting
              ? `Ticket ${ticket.ticketNumber} final price set to ${newFinalPrice}`
              : `Ticket ${ticket.ticketNumber} price adjusted from ${currentFinalPrice} to ${newFinalPrice}`,
            meta: {
              ticketNumber: ticket.ticketNumber,
              oldPrice: currentFinalPrice ?? ticket.estimatedPrice ?? 0,
              newPrice: newFinalPrice,
              reason: adjustmentReason,
            },
            customerId: ticket.customerId,
            ticketId: ticket.id,
          });

          // For relative adjustments, explicitly set the finalPrice
          if (hasRelativeAdjustment) {
            updateData.finalPrice = newFinalPrice;
          }
        }
      } else {
        return NextResponse.json({ error: 'Price can only be adjusted after repair is finished' }, { status: 400 });
      }
    }

    // Log updateData for debugging (remove sensitive nested data)
    console.log('Updating ticket with data:', {
      ...updateData,
      statusHistory: updateData.statusHistory ? '[nested create]' : undefined,
      priceAdjustments: updateData.priceAdjustments ? '[nested create]' : undefined,
    });

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: { customer: true, assignedTo: true },
    });

    // Check for assignment change and emit repairjob.assigned event
    if (data.assignedToId !== undefined && data.assignedToId !== ticket.assignedToId) {
      if (data.assignedToId) {
        emitEvent({
          eventId: nanoid(),
          entityType: 'repairjob',
          entityId: updatedTicket.id,
          action: 'assigned',
          actorId: session.user.id,
          actorName: session.user.name || session.user.username,
          timestamp: new Date(),
          summary: `Repair job ${updatedTicket.ticketNumber} was assigned`,
          meta: {
            ticketNumber: updatedTicket.ticketNumber,
            assignedToId: data.assignedToId,
          },
          customerId: updatedTicket.customerId,
          ticketId: updatedTicket.id,
        });
      }
    }

    // Emit ticket.updated event for general updates (if no specific event was emitted)
    const hasSpecificEvent = data.status || data.finalPrice !== undefined || data.assignedToId !== undefined;
    if (!hasSpecificEvent && Object.keys(updateData).length > 0) {
      emitEvent({
        eventId: nanoid(),
        entityType: 'ticket',
        entityId: updatedTicket.id,
        action: 'updated',
        actorId: session.user.id,
        actorName: session.user.name || session.user.username,
        timestamp: new Date(),
        summary: `Ticket ${updatedTicket.ticketNumber} was updated`,
        meta: {
          ticketNumber: updatedTicket.ticketNumber,
        },
        customerId: updatedTicket.customerId,
        ticketId: updatedTicket.id,
      });
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    // Handle Prisma foreign key errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      const meta = (error as any).meta;
      console.error('Foreign key constraint violation - Full error:', JSON.stringify(error, null, 2));
      console.error('Foreign key constraint violation - Meta:', JSON.stringify(meta, null, 2));
      console.error('Update data that caused error:', JSON.stringify(updateData, null, 2));
      return NextResponse.json(
        {
          error: 'Foreign key constraint violation',
          details: `The referenced record does not exist. Field: ${meta?.field_name || 'unknown'}, Model: ${meta?.model_name || 'unknown'}, Target: ${JSON.stringify(meta?.target || 'unknown')}`
        },
        { status: 400 }
      );
    }

    console.error('Error updating ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update ticket', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete tickets
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can delete tickets' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check ticket with all related financial records
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        parts: {
          include: {
            part: true,
          },
        },
        _count: {
          select: {
            returns: true,
            payments: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Already soft-deleted
    if (ticket.deletedAt) {
      return NextResponse.json(
        { error: 'Ticket is already deleted' },
        { status: 400 }
      );
    }

    // RULE 1: Block deletion if ticket has payments (financial audit trail)
    if (ticket._count.payments > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete ticket with payment records. Payment history must be preserved for financial audit trail.',
          code: 'HAS_PAYMENTS'
        },
        { status: 403 }
      );
    }

    // RULE 2: Block deletion if ticket has returns (financial audit trail)
    if (ticket._count.returns > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete ticket with return records. Return history must be preserved for financial audit trail.',
          code: 'HAS_RETURNS'
        },
        { status: 403 }
      );
    }

    // Store ticket data for events
    const ticketData = {
      ticketNumber: ticket.ticketNumber,
      customerId: ticket.customerId,
      status: ticket.status,
      paid: ticket.paid,
    };

    // RULE 3: Soft delete for COMPLETED or (REPAIRED + paid) tickets
    // These have financial significance and must be preserved for audit
    const requiresSoftDelete =
      ticket.status === 'COMPLETED' ||
      (ticket.status === 'REPAIRED' && ticket.paid);

    if (requiresSoftDelete) {
      // Soft delete - just mark as deleted
      await prisma.ticket.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Emit soft delete event
      emitEvent({
        eventId: nanoid(),
        entityType: 'ticket',
        entityId: id,
        action: 'deleted',
        actorId: session.user.id,
        actorName: session.user.name || session.user.username,
        timestamp: new Date(),
        summary: `Ticket ${ticketData.ticketNumber} was archived (soft deleted for audit trail)`,
        meta: {
          ticketNumber: ticketData.ticketNumber,
          deleteType: 'soft',
        },
        customerId: ticketData.customerId,
        ticketId: id,
      });

      return NextResponse.json({
        success: true,
        message: 'Ticket archived successfully (preserved for financial audit)',
        deleteType: 'soft'
      });
    }

    // RULE 4: Hard delete for tickets without financial significance
    // But first, restore inventory for any parts used
    if (ticket.parts.length > 0) {
      for (const ticketPart of ticket.parts) {
        // Restore part quantity to inventory
        await prisma.part.update({
          where: { id: ticketPart.partId },
          data: {
            quantity: {
              increment: ticketPart.quantity,
            },
          },
        });
      }
    }

    // Now hard delete the ticket (cascades to parts, history, etc.)
    await prisma.ticket.delete({
      where: { id },
    });

    // Emit hard delete event
    emitEvent({
      eventId: nanoid(),
      entityType: 'ticket',
      entityId: id,
      action: 'deleted',
      actorId: session.user.id,
      actorName: session.user.name || session.user.username,
      timestamp: new Date(),
      summary: `Ticket ${ticketData.ticketNumber} was permanently deleted${ticket.parts.length > 0 ? ' (inventory restored)' : ''}`,
      meta: {
        ticketNumber: ticketData.ticketNumber,
        deleteType: 'hard',
        partsRestored: ticket.parts.length,
      },
      customerId: ticketData.customerId,
      ticketId: id,
    });

    return NextResponse.json({
      success: true,
      message: `Ticket deleted successfully${ticket.parts.length > 0 ? '. Inventory has been restored.' : ''}`,
      deleteType: 'hard',
      partsRestored: ticket.parts.length
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
