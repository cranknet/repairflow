import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addPartToTicketSchema = z.object({
  partId: z.string().min(1, 'Part ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission (ADMIN or STAFF only)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Only admin or staff can add parts to tickets' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = addPartToTicketSchema.parse(body);

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Verify part exists
    const part = await prisma.part.findUnique({
      where: { id: data.partId },
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Check if part is already added to this ticket
    const existingTicketPart = await prisma.ticketPart.findFirst({
      where: {
        ticketId: id,
        partId: data.partId,
      },
    });

    let ticketPart;
    if (existingTicketPart) {
      // Update quantity if part already exists
      ticketPart = await prisma.ticketPart.update({
        where: { id: existingTicketPart.id },
        data: {
          quantity: existingTicketPart.quantity + data.quantity,
        },
        include: {
          part: {
            select: {
              id: true,
              name: true,
              sku: true,
              unitPrice: true,
            },
          },
        },
      });
    } else {
      // Create new ticket part
      ticketPart = await prisma.ticketPart.create({
        data: {
          ticketId: id,
          partId: data.partId,
          quantity: data.quantity,
        },
        include: {
          part: {
            select: {
              id: true,
              name: true,
              sku: true,
              unitPrice: true,
            },
          },
        },
      });
    }

    // Deduct quantity from inventory
    await prisma.part.update({
      where: { id: data.partId },
      data: {
        quantity: {
          decrement: data.quantity,
        },
      },
    });

    return NextResponse.json(ticketPart, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error adding part to ticket:', error);
    return NextResponse.json(
      { error: 'Failed to add part to ticket' },
      { status: 500 }
    );
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

    // Check permission (ADMIN or STAFF only)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Only admin or staff can remove parts from tickets' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const ticketPartId = searchParams.get('ticketPartId');

    if (!ticketPartId) {
      return NextResponse.json(
        { error: 'Ticket part ID is required' },
        { status: 400 }
      );
    }

    // Get ticket part with part info
    const ticketPart = await prisma.ticketPart.findUnique({
      where: { id: ticketPartId },
      include: {
        part: true,
      },
    });

    if (!ticketPart) {
      return NextResponse.json({ error: 'Ticket part not found' }, { status: 404 });
    }

    // Verify it belongs to the ticket
    if (ticketPart.ticketId !== id) {
      return NextResponse.json(
        { error: 'Ticket part does not belong to this ticket' },
        { status: 400 }
      );
    }

    // Restore quantity to inventory
    await prisma.part.update({
      where: { id: ticketPart.partId },
      data: {
        quantity: {
          increment: ticketPart.quantity,
        },
      },
    });

    // Delete ticket part
    await prisma.ticketPart.delete({
      where: { id: ticketPartId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing part from ticket:', error);
    return NextResponse.json(
      { error: 'Failed to remove part from ticket' },
      { status: 500 }
    );
  }
}

