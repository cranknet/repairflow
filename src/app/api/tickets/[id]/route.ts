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
