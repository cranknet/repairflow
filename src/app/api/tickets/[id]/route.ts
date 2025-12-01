import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createNotification, getStatusChangeMessage } from '@/lib/notifications';

// Schema for ticket updates – parts field removed
const updateTicketSchema = z.object({
  status: z.enum(['RECEIVED', 'IN_PROGRESS', 'REPAIRED', 'CANCELLED', 'RETURNED']).optional(),
  finalPrice: z.number().optional(),
  paid: z.boolean().optional(),
  assignedToId: z.string().nullable().optional(),
  notes: z.string().optional(),
  statusNotes: z.string().optional(),
  priceAdjustmentReason: z.string().optional(),
  returnReason: z.string().optional(), // Required when status changes to RETURNED
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
        statusHistory: true,
        // Keep parts include for backward compatibility (no write operations)
        parts: { include: { part: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Prevent status changes for RETURNED tickets
    if (ticket.status === 'RETURNED' && data.status && data.status !== 'RETURNED') {
      return NextResponse.json({ error: 'Cannot change status of a returned ticket' }, { status: 400 });
    }

    const updateData: any = { ...data };
    // priceAdjustmentReason is not a column on Ticket
    delete updateData.priceAdjustmentReason;

    // Status change handling
    if (data.status && data.status !== ticket.status) {
      // Handle RETURNED status change - create return record instead of changing status
      if (data.status === 'RETURNED') {
        // Admin-only check for creating returns
        if (session.user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Only administrators can create returns' },
            { status: 403 }
          );
        }

        // Validate ticket status is REPAIRED
        if (ticket.status !== 'REPAIRED') {
          return NextResponse.json(
            { error: 'Only repaired tickets can be returned' },
            { status: 400 }
          );
        }

        // Validate return reason is provided
        if (!data.returnReason || data.returnReason.trim() === '') {
          return NextResponse.json(
            { error: 'Return reason is required when changing status to RETURNED' },
            { status: 400 }
          );
        }

        // Check if return already exists
        const existingReturn = await prisma.return.findFirst({
          where: { ticketId: ticket.id },
        });

        if (existingReturn) {
          return NextResponse.json(
            { error: 'Ticket already has a return' },
            { status: 400 }
          );
        }

        // Calculate refund amount (full amount)
        const refundAmount = ticket.finalPrice || ticket.estimatedPrice;

        // Create return record with PENDING status
        await prisma.return.create({
          data: {
            ticketId: ticket.id,
            reason: data.returnReason,
            refundAmount: refundAmount,
            createdBy: session.user.id,
            status: 'PENDING',
          },
        });

        // Add status history note (ticket stays REPAIRED)
        updateData.statusHistory = {
          create: {
            status: ticket.status, // Keep REPAIRED
            notes: `Return request created via status change. Refund amount: ${refundAmount}. Ticket remains REPAIRED until return is approved.`,
          },
        };

        // Don't change ticket status - keep it as REPAIRED
        delete updateData.status;

        // Notification about return creation
        await createNotification({
          type: 'STATUS_CHANGE',
          message: `Return request created for ticket ${ticket.ticketNumber}. Awaiting approval.`,
          userId: ticket.assignedToId || null,
          ticketId: ticket.id,
        });
      } else {
        // Normal status change handling for other statuses
        updateData.statusHistory = {
          create: {
            status: data.status,
            notes: data.statusNotes || `Status changed from ${ticket.status} to ${data.status}`,
          },
        };

        // Mark completedAt when ticket becomes REPAIRED
        if (data.status === 'REPAIRED' && !ticket.completedAt) {
          updateData.completedAt = new Date();
        }

        // Notification about status change
        const message = getStatusChangeMessage(ticket.ticketNumber, ticket.status, data.status);
        await createNotification({
          type: 'STATUS_CHANGE',
          message,
          userId: ticket.assignedToId || null,
          ticketId: ticket.id,
        });
      }
    }

    // Price adjustment (admin / staff only)
    if (data.finalPrice !== undefined && (session.user.role === 'ADMIN' || session.user.role === 'STAFF')) {
      if (ticket.status === 'REPAIRED' || data.status === 'REPAIRED') {
        const currentFinalPrice = ticket.finalPrice ?? null;
        const newFinalPrice = data.finalPrice;
        const priceIsChanging = currentFinalPrice === null || Math.abs((currentFinalPrice || 0) - newFinalPrice) > 0.01;
        if (priceIsChanging) {
          if (currentFinalPrice !== null && (!data.priceAdjustmentReason || data.priceAdjustmentReason.trim() === '')) {
            return NextResponse.json({ error: 'Reason is required for price adjustment' }, { status: 400 });
          }
          if (data.priceAdjustmentReason && data.priceAdjustmentReason.trim() !== '') {
            updateData.priceAdjustments = {
              create: {
                userId: session.user.id,
                oldPrice: currentFinalPrice ?? ticket.estimatedPrice ?? 0,
                newPrice: newFinalPrice,
                reason: data.priceAdjustmentReason,
              },
            };
            const priceMessage = `Ticket ${ticket.ticketNumber} price adjusted from ${currentFinalPrice ?? ticket.estimatedPrice ?? 0} to ${newFinalPrice}`;
            await createNotification({
              type: 'PRICE_ADJUSTMENT',
              message: priceMessage,
              userId: ticket.assignedToId || null,
              ticketId: ticket.id,
            });
          }
        }
      } else {
        return NextResponse.json({ error: 'Price can only be adjusted after repair is finished' }, { status: 400 });
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: { customer: true, assignedTo: true },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
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

    // Check if ticket exists and has returns
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            returns: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Prevent deletion if ticket has returns
    if (ticket._count.returns > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ticket with existing returns. Please delete returns first.' },
        { status: 400 }
      );
    }

    // Delete the ticket
    await prisma.ticket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}