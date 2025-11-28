import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createNotification, getStatusChangeMessage } from '@/lib/notifications';

const updateTicketSchema = z.object({
  status: z.enum(['RECEIVED', 'IN_PROGRESS', 'REPAIRED', 'CANCELLED', 'RETURNED']).optional(),
  finalPrice: z.number().optional(),
  paid: z.boolean().optional(),
  assignedToId: z.string().nullable().optional(),
  notes: z.string().optional(),
  statusNotes: z.string().optional(),
  priceAdjustmentReason: z.string().optional(),
  parts: z.array(z.object({
    partId: z.string(),
    quantity: z.number().int().min(1),
  })).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        parts: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateTicketSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Prevent status changes for RETURNED tickets
    if (ticket.status === 'RETURNED' && data.status && data.status !== 'RETURNED') {
      return NextResponse.json(
        { error: 'Cannot change status of a returned ticket' },
        { status: 400 }
      );
    }

    const updateData: any = { ...data };
    
    // Remove priceAdjustmentReason from updateData as it's not a field in the Ticket model
    delete updateData.priceAdjustmentReason;

    // If status is changing, add to history
    if (data.status && data.status !== ticket.status) {
      updateData.statusHistory = {
        create: {
          status: data.status,
          notes: data.statusNotes || `Status changed from ${ticket.status} to ${data.status}`,
        },
      };
      
      // Set completedAt if status is REPAIRED (repair is complete)
      if (data.status === 'REPAIRED' && !ticket.completedAt) {
        updateData.completedAt = new Date();
      }
      
      // Handle REPAIRED status - add parts if provided
      if (data.status === 'REPAIRED' && data.parts && data.parts.length > 0) {
        // Add parts to ticket
        for (const partData of data.parts) {
          // Validate partId is not empty
          if (!partData.partId || partData.partId.trim() === '') {
            return NextResponse.json(
              { error: 'Part ID is required for all parts' },
              { status: 400 }
            );
          }
          
          // Check if part exists
          const part = await prisma.part.findUnique({
            where: { id: partData.partId },
          });
          
          if (!part) {
            return NextResponse.json(
              { error: `Part ${partData.partId} not found` },
              { status: 404 }
            );
          }
          
          // Check if ticket part already exists (avoid duplicates)
          const existingTicketPart = await prisma.ticketPart.findFirst({
            where: {
              ticketId: id,
              partId: partData.partId,
            },
          });
          
          if (!existingTicketPart) {
            // Create ticket part
            await prisma.ticketPart.create({
              data: {
                ticketId: id,
                partId: partData.partId,
                quantity: partData.quantity,
              },
            });
          }
        }
      }

      // Create notification for assigned user or all admins
      const message = getStatusChangeMessage(ticket.ticketNumber, ticket.status, data.status);
      await createNotification({
        type: 'STATUS_CHANGE',
        message,
        userId: ticket.assignedToId || null,
        ticketId: ticket.id,
      });
    }

    // If price is being adjusted by admin or staff (after repair is finished)
    if (data.finalPrice !== undefined && (session.user.role === 'ADMIN' || session.user.role === 'STAFF')) {
      // Only allow price adjustment if repair is finished
      if (ticket.status === 'REPAIRED' || data.status === 'REPAIRED') {
        const currentFinalPrice = ticket.finalPrice ?? null;
        const newFinalPrice = data.finalPrice;
        
        // Check if price is actually changing (allowing null to be set to a value)
        const priceIsChanging = currentFinalPrice === null || Math.abs((currentFinalPrice || 0) - newFinalPrice) > 0.01;
        
        if (priceIsChanging) {
          // Require reason when changing an existing price
          if (currentFinalPrice !== null && (!data.priceAdjustmentReason || data.priceAdjustmentReason.trim() === '')) {
            return NextResponse.json(
              { error: 'Reason is required for price adjustment' },
              { status: 400 }
            );
          }
          
          // Create price adjustment record if there's a reason
          if (data.priceAdjustmentReason && data.priceAdjustmentReason.trim() !== '') {
            updateData.priceAdjustments = {
              create: {
                userId: session.user.id,
                oldPrice: currentFinalPrice ?? ticket.estimatedPrice ?? 0,
                newPrice: newFinalPrice,
                reason: data.priceAdjustmentReason,
              },
            };

            // Create notification for assigned user or all admins
            const priceMessage = `Ticket ${ticket.ticketNumber} price adjusted from ${currentFinalPrice ?? ticket.estimatedPrice ?? 0} to ${newFinalPrice}`;
            await createNotification({
              type: 'PRICE_ADJUSTMENT',
              message: priceMessage,
              userId: ticket.assignedToId || null,
              ticketId: ticket.id,
            });
          }
        } else {
          // Price is not changing, but still allow the update (in case user wants to update other fields)
          // Just don't create a price adjustment record
        }
      } else {
        return NextResponse.json(
          { error: 'Price can only be adjusted after repair is finished' },
          { status: 400 }
        );
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        assignedTo: true,
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update ticket', details: errorMessage },
      { status: 500 }
    );
  }
}

